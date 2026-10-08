const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
function harness(network){
 const buckets=new Map(),handlers={};
 const key=r=>typeof r==='string'?r:r.url;
 const caches={
  async open(name){if(!buckets.has(name))buckets.set(name,new Map());const data=buckets.get(name);return {async match(r){return data.get(key(r))?.clone();},async put(r,response){data.set(key(r),response.clone());},async addAll(){}};},
  async keys(){return [...buckets.keys()];},async delete(name){return buckets.delete(name);},
  async match(r){for(const data of buckets.values())if(data.has(key(r)))return data.get(key(r)).clone();}
 };
 const self={location:{origin:'https://example.com'},registration:{scope:'https://example.com/Job-It/'},clients:{async claim(){}},async skipWaiting(){},addEventListener(name,fn){handlers[name]=fn;}};
 vm.runInNewContext(readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8'),{self,caches,fetch:network,URL,Response,Request,Promise});
 return {caches,handlers,async get(url){let result;const pending=[];handlers.fetch({request:{method:'GET',url,mode:'cors'},respondWith(p){result=p;},waitUntil(p){pending.push(p);}});const response=await result;await Promise.all(pending);return response;}};
}
test('a returning visitor receives updated CSS while its existing worker is active',async()=>{
 const h=harness(async()=>new Response('new green palette'));const cache=await h.caches.open('job-it-v15');
 await cache.put('https://example.com/Job-It/styles.css',new Response('old blue palette'));
 assert.equal(await (await h.get('https://example.com/Job-It/styles.css')).text(),'new green palette');
});
test('offline users can still read cached calculator styles',async()=>{
 const h=harness(async()=>{throw new Error('offline');});const cache=await h.caches.open('job-it-v15');
 await cache.put('https://example.com/Job-It/styles.css',new Response('offline stylesheet'));
 assert.equal(await (await h.get('https://example.com/Job-It/styles.css')).text(),'offline stylesheet');
});
test('activation removes old JOB-IT caches while preserving other applications',async()=>{
 const h=harness(async()=>new Response('ok'));
 for(const name of ['job-it-v14','job-it-v15','another-app-v1'])await h.caches.open(name);
 let pending;h.handlers.activate({waitUntil(p){pending=p;}});await pending;
 assert.deepEqual(await h.caches.keys(),['job-it-v15','another-app-v1']);
});
test('server errors cannot replace a working cached stylesheet',async()=>{
 const h=harness(async()=>new Response('error',{status:503}));const cache=await h.caches.open('job-it-v15');
 await cache.put('https://example.com/Job-It/styles.css',new Response('working stylesheet'));
 await h.get('https://example.com/Job-It/styles.css');
 assert.equal(await (await cache.match('https://example.com/Job-It/styles.css')).text(),'working stylesheet');
});
