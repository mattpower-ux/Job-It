const $ = (id) => document.getElementById(id);
const numeric = (id) => Number($(id).value) || 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, places = 2) => Number(value).toFixed(places);

const calculatorMeta = {
  concrete: { label: "CONCRETE", title: "Concrete & Foundation", icon: "assets/icons/concrete.svg" },
  roof: { label: "ROOF", title: "Roof & Rafter Geometry", icon: "assets/icons/roof.svg" },
  trim: { label: "TRIM", title: "Trim & Molding Cuts", icon: "assets/icons/trim.svg" },
  stairs: { label: "STAIRS", title: "Stairs, Ramps & Decks", icon: "assets/icons/stairs.svg" },
  takeoff: { label: "TAKEOFF", title: "Material Takeoff", icon: "assets/icons/takeoff.svg" },
  layout: { label: "LAYOUT", title: "Layout, Level & Squaring", icon: "assets/icons/layout.svg" }
};

let deferredInstallPrompt = null;
let openedFromShortcut = false;
const defaultTitle = document.title;

function setShortcutIdentity(calculatorId) {
  const meta = calculatorMeta[calculatorId];
  if (!meta) return;
  document.title = `JOB-IT ${meta.label}`;
  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.href = meta.icon;
  icon.type = "image/svg+xml";
}

function resetShortcutIdentity() {
  document.title = defaultTitle;
  const icon = document.querySelector('link[rel="icon"]');
  if (icon) icon.href = "assets/icons/job-it.svg";
}

function inchesToFeetAndInches(inches) {
  if (!Number.isFinite(inches) || inches < 0) return "0' 0\"";
  const feet = Math.floor(inches / 12);
  const wholeInches = Math.round((inches - feet * 12) * 16) / 16;
  return `${feet}' ${round(wholeInches, wholeInches % 1 === 0 ? 0 : 2)}"`;
}

function updateConcrete() {
  const shape = $("concreteShape").value;
  const lengthFt = numeric("concreteLength");
  const widthIn = numeric("concreteWidth");
  const depthIn = numeric("concreteDepth");
  const qty = Math.max(1, numeric("concreteQty"));
  const waste = 1 + numeric("concreteWaste") / 100;
  let cubicFeet = 0;

  if (shape === "pier") {
    const radiusFt = widthIn / 24;
    cubicFeet = Math.PI * radiusFt * radiusFt * (depthIn / 12) * qty;
  } else {
    cubicFeet = lengthFt * (widthIn / 12) * (depthIn / 12) * qty;
  }

  if (shape === "slab") cubicFeet = lengthFt * (widthIn / 12) * (depthIn / 12) * qty;
  if (shape === "wall") cubicFeet = lengthFt * (widthIn / 12) * (depthIn / 12) * qty;

  const yards = (cubicFeet / 27) * waste;
  const bags = Math.ceil((yards * 27) / 0.6);
  $("concreteYards").textContent = round(yards, 2);
  $("concreteBags").textContent = bags.toLocaleString();
  $("concreteNote").textContent = shape === "pier" ? "Check pier schedule" : "Verify PSI from plans";
}

function updateRoof() {
  const spanFt = numeric("roofSpan");
  const pitch = numeric("roofPitch");
  const overhangIn = numeric("roofOverhang");
  const spacing = Math.max(1, numeric("roofSpacing"));
  const runIn = (spanFt * 12) / 2 + overhangIn;
  const riseIn = runIn * (pitch / 12);
  const lengthIn = Math.hypot(runIn, riseIn);
  const angle = Math.atan(pitch / 12) * (180 / Math.PI);
  const count = Math.ceil((spanFt * 12) / spacing) + 1;

  $("roofRafter").textContent = inchesToFeetAndInches(lengthIn);
  $("roofAngle").textContent = `${round(angle, 2)} deg`;
  $("roofCount").textContent = count.toString();
  $("roofRiseLabel").textContent = `rise ${inchesToFeetAndInches(riseIn)}`;
  document.querySelector(".roof-line.left").style.transform = `rotate(${180 - angle}deg)`;
  document.querySelector(".roof-line.right").style.transform = `rotate(${angle}deg)`;
}

function updateTrim() {
  const profile = $("trimProfile").value;
  const wallAngle = clamp(numeric("trimWallAngle"), 1, 179);
  const spring = clamp(numeric("trimSpring"), 1, 89);
  const halfCorner = wallAngle / 2;
  let miter = halfCorner;
  let bevel = 0;
  let note = $("trimCorner").value === "inside" ? "Keep long point out" : "Keep long point in";

  if (profile === "crown") {
    const halfRad = halfCorner * (Math.PI / 180);
    const springRad = spring * (Math.PI / 180);
    miter = Math.atan(Math.sin(halfRad) / Math.tan(springRad)) * (180 / Math.PI);
    bevel = Math.asin(Math.cos(halfRad) * Math.cos(springRad)) * (180 / Math.PI);
    note = "Cut flat: bevel + miter";
  } else {
    miter = halfCorner;
    bevel = 0;
  }

  $("trimMiter").textContent = `${round(Math.abs(miter), 1)} deg`;
  $("trimBevel").textContent = `${round(Math.abs(bevel), 1)} deg`;
  $("trimNote").textContent = note;
  $("trimBlade").style.transform = `rotate(${Math.min(50, Math.abs(miter))}deg)`;
}

function updateStairs() {
  const totalRise = numeric("stairRise");
  const target = Math.max(1, numeric("stairTargetRiser"));
  const tread = Math.max(1, numeric("stairTread"));
  const stringers = Math.max(1, Math.round(numeric("stairStringers")));
  const risers = Math.max(1, Math.round(totalRise / target));
  const actualRiser = totalRise / risers;
  const treads = Math.max(1, risers - 1);
  const totalRun = treads * tread;
  const stringerLength = Math.hypot(totalRise, totalRun);

  $("stairRisers").textContent = `${risers} risers / ${treads} treads`;
  $("stairActual").textContent = `${round(actualRiser, 2)}"`;
  $("stairStringerLength").textContent = `${inchesToFeetAndInches(stringerLength)} x ${stringers}`;

  const visual = $("stairVisual");
  visual.innerHTML = "";
  const blocks = Math.min(8, risers);
  for (let i = 0; i < blocks; i += 1) {
    const block = document.createElement("span");
    block.className = "step-block";
    block.style.height = `${26 + i * 8}%`;
    visual.appendChild(block);
  }
}

function updateTakeoff() {
  const category = $("takeoffCategory").value;
  const length = numeric("takeoffLength");
  const height = numeric("takeoffHeight");
  const spacing = Math.max(1, numeric("takeoffSpacing"));
  const openings = Math.max(0, numeric("takeoffOpenings"));
  const waste = 1 + numeric("takeoffWaste") / 100;
  const area = length * height;
  let main = "";
  let secondary = "";

  if (category === "wall") {
    const studs = Math.ceil((length * 12) / spacing) + 1 + openings * 4;
    const platesLf = length * 3;
    main = `${Math.ceil(studs * waste)} studs`;
    secondary = `${Math.ceil(platesLf * waste)} lf plates`;
    $("takeoffUnit").textContent = "in OC";
  } else if (category === "drywall") {
    const sheets = Math.ceil((area / 32) * waste);
    main = `${sheets} 4x8 sheets`;
    secondary = `${Math.ceil(sheets * 32)} sq ft ordered`;
    $("takeoffUnit").textContent = "sheet sq ft";
  } else {
    const squares = (area / 100) * waste;
    main = `${round(squares, 1)} squares`;
    secondary = `${Math.ceil(squares * 3)} bundles`;
    $("takeoffUnit").textContent = "roof width";
  }

  $("takeoffMain").textContent = main;
  $("takeoffSecondary").textContent = secondary;
  $("takeoffArea").textContent = `${round(area, 1)} sq ft`;
}

function updateLayout() {
  const mode = $("layoutMode").value;
  const a = numeric("layoutA");
  const b = numeric("layoutB");
  const c = numeric("layoutC");

  if (mode === "square") {
    const diagonal = Math.hypot(a, b);
    $("layoutMain").textContent = `${round(diagonal, 3)} ft diagonal`;
    $("layoutSecondary").textContent = inchesToFeetAndInches(diagonal * 12);
    $("layoutCue").textContent = "Match both diagonals";
    $("layoutBUnit").textContent = "ft";
    $("layoutCUnit").textContent = "in";
  } else if (mode === "slope") {
    const fallIn = a * c;
    $("layoutMain").textContent = `${round(fallIn, 2)} in fall`;
    $("layoutSecondary").textContent = `${round((fallIn / 12) * 100 / a, 2)}% grade`;
    $("layoutCue").textContent = "Lower endpoint by result";
    $("layoutBUnit").textContent = "unused";
    $("layoutCUnit").textContent = "in/ft";
  } else {
    const spaces = Math.max(1, Math.round(c));
    const spacingIn = (a * 12) / spaces;
    $("layoutMain").textContent = `${round(spacingIn, 2)} in centers`;
    $("layoutSecondary").textContent = `${spaces + 1} marks incl. ends`;
    $("layoutCue").textContent = "Mark from same end";
    $("layoutBUnit").textContent = "unused";
    $("layoutCUnit").textContent = "spaces";
  }
}

function recalculateAll() {
  updateConcrete();
  updateRoof();
  updateTrim();
  updateStairs();
  updateTakeoff();
  updateLayout();
}

function isInteractiveElement(target) {
  return Boolean(target.closest("button, input, select, textarea, a, label"));
}

function getShortcutUrl(calculatorId) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("calc", calculatorId);
  url.searchParams.set("shortcut", "1");
  return url.toString();
}

function openCalculator(calculatorId, options = {}) {
  const card = document.querySelector(`[data-calculator="${calculatorId}"]`);
  if (!card) return;

  document.querySelectorAll(".calculator.expanded-mode").forEach((openCard) => {
    if (openCard !== card) {
      openCard.classList.remove("expanded-mode");
      openCard.querySelector("[data-mobile-toggle]").textContent = "Mobile";
    }
  });

  card.classList.add("expanded-mode");
  card.querySelector("[data-mobile-toggle]").textContent = "Close";
  document.body.classList.add("calculator-open");
  $("mobileScrim").hidden = false;
  setShortcutIdentity(calculatorId);

  if (!options.preserveUrl && !openedFromShortcut) {
    const url = new URL(window.location.href);
    url.searchParams.set("calc", calculatorId);
    window.history.replaceState({}, "", url);
  }

  card.scrollTop = 0;
}

function closeCalculator(options = {}) {
  const openCard = document.querySelector(".calculator.expanded-mode");
  if (!openCard) return;
  openCard.classList.remove("expanded-mode");
  openCard.querySelector("[data-mobile-toggle]").textContent = "Mobile";
  document.body.classList.remove("calculator-open");
  $("mobileScrim").hidden = true;
  resetShortcutIdentity();

  if (!options.preserveUrl && !openedFromShortcut) {
    const url = new URL(window.location.href);
    url.searchParams.delete("calc");
    window.history.replaceState({}, "", url);
  }
}

function shortcutInstructions(calculatorId) {
  const meta = calculatorMeta[calculatorId];
  const url = getShortcutUrl(calculatorId);
  return [
    `${meta.title}`,
    `Shortcut label: JOB-IT ${meta.label}`,
    `Shortcut URL: ${url}`,
    "If your browser does not show an install prompt, use the browser menu and choose Add to Home Screen."
  ].join("\n");
}

async function createMobileShortcut(calculatorId) {
  const meta = calculatorMeta[calculatorId];
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return;
  }

  const shareData = {
    title: `JOB-IT ${meta.label}`,
    text: shortcutInstructions(calculatorId),
    url: getShortcutUrl(calculatorId)
  };

  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    await navigator.share(shareData);
    return;
  }

  window.prompt("Copy this calculator shortcut URL, then add it to your home screen:", getShortcutUrl(calculatorId));
}

function addExpandedControls() {
  document.querySelectorAll(".calculator").forEach((card) => {
    const calculatorId = card.dataset.calculator;
    const meta = calculatorMeta[calculatorId];
    const actions = document.createElement("div");
    actions.className = "expanded-actions";
    actions.innerHTML = `
      <div class="shortcut-preview" aria-hidden="true">
        <img src="${meta.icon}" alt="" />
        <span>${meta.label}</span>
      </div>
      <button class="shortcut-button" type="button" data-shortcut-button>CREATE MOBILE SHORTCUT</button>
    `;
    card.appendChild(actions);
  });
}

function setupExpandedCalculators() {
  const params = new URLSearchParams(window.location.search);
  const initialCalculator = params.get("calc");
  openedFromShortcut = params.get("shortcut") === "1";

  if (openedFromShortcut) {
    document.body.classList.add("shortcut-launch");
  }

  document.querySelectorAll(".calculator").forEach((card) => {
    const calculatorId = card.dataset.calculator;

    card.addEventListener("click", (event) => {
      if (card.classList.contains("expanded-mode") || event.target.closest("[data-mobile-toggle]")) return;
      if (isInteractiveElement(event.target)) {
        event.preventDefault();
        event.target.blur?.();
      }
      openCalculator(calculatorId);
    });

    card.querySelector("[data-mobile-toggle]").addEventListener("click", (event) => {
      event.stopPropagation();
      if (card.classList.contains("expanded-mode")) {
        closeCalculator({ preserveUrl: openedFromShortcut });
      } else {
        openCalculator(calculatorId);
      }
    });

    card.querySelector("[data-shortcut-button]").addEventListener("click", (event) => {
      event.stopPropagation();
      createMobileShortcut(calculatorId).catch(() => {
        window.prompt("Copy this calculator shortcut URL, then add it to your home screen:", getShortcutUrl(calculatorId));
      });
    });
  });

  $("mobileScrim").addEventListener("click", () => closeCalculator({ preserveUrl: openedFromShortcut }));

  if (initialCalculator && calculatorMeta[initialCalculator]) {
    openCalculator(initialCalculator, { preserveUrl: true });
    if (openedFromShortcut) {
      document.querySelectorAll(".calculator").forEach((card) => {
        card.hidden = card.dataset.calculator !== initialCalculator;
      });
    }
  }
}

function setupPwa() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

document.addEventListener("input", recalculateAll);
document.addEventListener("change", recalculateAll);
addExpandedControls();
setupExpandedCalculators();
setupPwa();
recalculateAll();
