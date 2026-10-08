# Job-It Calculator Prototype

A dependency-free prototype for six residential contractor calculators:

- Concrete & Foundation
- Roof & Rafter Geometry
- Trim & Molding Cuts
- Stairs, Ramps & Decks
- Material Takeoff
- Layout, Level & Squaring

Open `index.html` in a browser to use the prototype. Each calculator includes a `Mobile` button that expands the panel into a cellphone-sized full-height field view.

This is an estimating and layout-assistance prototype. Final production use should verify formulas against local code, engineered plans, and trade-specific requirements.

## Offline updates

HTML, CSS, JavaScript and the app manifest revalidate with the network, falling back to cached copies offline. Images use the app's cache first. Releases that change CSS or JavaScript should update the version in `index.html` and the matching precache URLs in `sw.js`, and increment the `job-it-` cache version. Versioned embed links allow visitors controlled by an older cache-first worker to load the current page immediately. Cache cleanup only removes previous JOB-IT caches.

Run `npm test` for update/offline regression checks.
