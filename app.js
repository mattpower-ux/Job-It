const $ = (id) => document.getElementById(id);
const numeric = (id) => Number($(id).value) || 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, places = 2) => Number(value).toFixed(places);

const calculatorMeta = {
  concrete: { label: "CONCRETE", title: "Concrete & Foundation", cue: "Yards, bags, footings", icon: "assets/icons/concrete.svg", image: "assets/realistic/concrete.png" },
  roof: { label: "ROOF", title: "Roof & Rafter Geometry", cue: "Rafters, pitch, cuts", icon: "assets/icons/roof.svg", image: "assets/realistic/roof.png" },
  trim: { label: "TRIM", title: "Trim & Molding Cuts", cue: "Miter, bevel, corners", icon: "assets/icons/trim.svg", image: "assets/realistic/trim.png" },
  stairs: { label: "STAIRS", title: "Stairs, Ramps & Decks", cue: "Risers, treads, ramps", icon: "assets/icons/stairs.svg", image: "assets/realistic/stairs.png" },
  takeoff: { label: "TAKEOFF", title: "Material Takeoff", cue: "Studs, sheets, roofing", icon: "assets/icons/takeoff.svg", image: "assets/realistic/takeoff.png" },
  layout: { label: "LAYOUT", title: "Layout, Level & Squaring", cue: "Square, slope, spacing", icon: "assets/icons/layout.svg", image: "assets/realistic/layout.png" }
};

const calculatorOrder = ["concrete", "roof", "trim", "stairs", "takeoff", "layout"];

const specialtyMeta = {
  concrete: [
    { label: "Slab", image: "assets/specialties/concrete-slab.png", fields: { concreteShape: "slab", concreteLength: 32, concreteWidth: 144, concreteDepth: 4, concreteQty: 1, concreteWaste: 8 } },
    { label: "Footing", image: "assets/specialties/concrete-footing.png", fields: { concreteShape: "footing", concreteLength: 48, concreteWidth: 24, concreteDepth: 12, concreteQty: 1, concreteWaste: 10 } },
    { label: "Pier", image: "assets/specialties/concrete-pier.png", fields: { concreteShape: "pier", concreteLength: 1, concreteWidth: 16, concreteDepth: 48, concreteQty: 8, concreteWaste: 8 } }
  ],
  roof: [
    { label: "Common Rafter", image: "assets/specialties/roof-common.png", fields: { roofSpan: 28, roofPitch: 6, roofOverhang: 18, roofSpacing: 16 } },
    { label: "Hip / Valley", image: "assets/specialties/roof-hip-valley.png", fields: { roofSpan: 30, roofPitch: 8, roofOverhang: 16, roofSpacing: 16 } },
    { label: "Shed Roof", image: "assets/specialties/roof-shed.png", fields: { roofSpan: 16, roofPitch: 3, roofOverhang: 12, roofSpacing: 24 } }
  ],
  trim: [
    { label: "Inside Corner", image: "assets/specialties/trim-inside-corner.png", fields: { trimProfile: "crown", trimCorner: "inside", trimWallAngle: 90, trimSpring: 38 } },
    { label: "Baseboard", image: "assets/specialties/trim-baseboard.png", fields: { trimProfile: "base", trimCorner: "outside", trimWallAngle: 90, trimSpring: 38 } },
    { label: "Crown", image: "assets/specialties/trim-crown.png", fields: { trimProfile: "crown", trimCorner: "inside", trimWallAngle: 90, trimSpring: 45 } }
  ],
  stairs: [
    { label: "Stringer", image: "assets/specialties/stairs-stringer.png", fields: { stairRise: 108, stairTargetRiser: 7.5, stairTread: 10.5, stairStringers: 3 } },
    { label: "Decking", image: "assets/specialties/stairs-decking.png", fields: { stairRise: 36, stairTargetRiser: 7.25, stairTread: 11, stairStringers: 4 } },
    { label: "Ramp", image: "assets/specialties/stairs-ramp.png", fields: { stairRise: 24, stairTargetRiser: 6, stairTread: 12, stairStringers: 2 } }
  ],
  takeoff: [
    { label: "Framing", image: "assets/specialties/takeoff-framing.png", fields: { takeoffCategory: "wall", takeoffLength: 40, takeoffHeight: 9, takeoffSpacing: 16, takeoffOpenings: 2, takeoffWaste: 10 } },
    { label: "Drywall", image: "assets/specialties/takeoff-drywall.png", fields: { takeoffCategory: "drywall", takeoffLength: 48, takeoffHeight: 8, takeoffSpacing: 32, takeoffOpenings: 3, takeoffWaste: 12 } },
    { label: "Roofing", image: "assets/specialties/takeoff-roofing.png", fields: { takeoffCategory: "roofing", takeoffLength: 42, takeoffHeight: 18, takeoffSpacing: 0, takeoffOpenings: 0, takeoffWaste: 10 } }
  ],
  layout: [
    { label: "Squaring", image: "assets/specialties/layout-squaring.png", fields: { layoutMode: "square" } },
    { label: "Slope", image: "assets/specialties/layout-slope.png", fields: { layoutMode: "slope" } },
    { label: "Spacing", image: "assets/specialties/layout-spacing.png", fields: { layoutMode: "spacing" } }
  ]
};

let deferredInstallPrompt = null;
let openedFromShortcut = false;
let lastLayoutMode = null;
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
  const roofRiseLabel = $("roofRiseLabel");
  if (roofRiseLabel) roofRiseLabel.textContent = `rise ${inchesToFeetAndInches(riseIn)}`;
  const leftRoofLine = document.querySelector(".roof-line.left");
  const rightRoofLine = document.querySelector(".roof-line.right");
  if (leftRoofLine) leftRoofLine.style.transform = `rotate(${180 - angle}deg)`;
  if (rightRoofLine) rightRoofLine.style.transform = `rotate(${angle}deg)`;
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
  const trimBlade = $("trimBlade");
  if (trimBlade) trimBlade.style.transform = `rotate(${Math.min(50, Math.abs(miter))}deg)`;
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
  const comfortRule = actualRiser * 2 + tread;
  const stairOk = actualRiser <= 7.75 && tread >= 10 && comfortRule >= 24 && comfortRule <= 25;
  $("stairRule").textContent = `${round(comfortRule, 2)}" ${stairOk ? "OK" : "check"}`;

  const visual = $("stairVisual");
  if (visual) {
    visual.innerHTML = "";
    const blocks = Math.min(8, risers);
    for (let i = 0; i < blocks; i += 1) {
      const block = document.createElement("span");
      block.className = "step-block";
      block.style.height = `${26 + i * 8}%`;
      visual.appendChild(block);
    }
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
  if (mode !== lastLayoutMode) {
    if (mode === "square") {
      $("layoutA").value = "31.625";
      $("layoutB").value = "24";
      $("layoutC").value = "39.7";
    } else if (mode === "slope") {
      $("layoutA").value = "27";
      $("layoutB").value = "0";
      $("layoutC").value = "0.25";
    } else {
      $("layoutA").value = "10";
      $("layoutB").value = "0";
      $("layoutC").value = "8";
    }
    lastLayoutMode = mode;
  }

  const a = numeric("layoutA");
  const b = numeric("layoutB");
  const c = numeric("layoutC");

  if (mode === "square") {
    const diagonal = Math.hypot(a, b);
    const deltaIn = (c - diagonal) * 12;
    $("layoutMain").textContent = `${round(diagonal, 3)} ft diagonal`;
    $("layoutSecondary").textContent = `${Math.abs(round(deltaIn, 2))}" ${deltaIn >= 0 ? "long" : "short"}`;
    $("layoutCue").textContent = Math.abs(deltaIn) <= 0.125 ? "Square within 1/8 in" : "Move a corner, recheck";
    $("layoutALabel").textContent = "Length";
    $("layoutBLabel").textContent = "Width";
    $("layoutCLabel").textContent = "Measured diagonal";
    $("layoutBUnit").textContent = "ft";
    $("layoutCUnit").textContent = "ft";
  } else if (mode === "slope") {
    const fallIn = a * c;
    $("layoutMain").textContent = `${round(fallIn, 2)} in fall`;
    $("layoutSecondary").textContent = `${round((fallIn / 12) * 100 / a, 2)}% grade`;
    $("layoutCue").textContent = "Lower endpoint by result";
    $("layoutALabel").textContent = "Drain run";
    $("layoutBLabel").textContent = "Unused";
    $("layoutCLabel").textContent = "Pitch";
    $("layoutBUnit").textContent = "unused";
    $("layoutCUnit").textContent = "in/ft";
  } else {
    const spaces = Math.max(1, Math.round(c));
    const spacingIn = (a * 12) / spaces;
    $("layoutMain").textContent = `${round(spacingIn, 2)} in centers`;
    $("layoutSecondary").textContent = `${spaces + 1} marks incl. ends`;
    $("layoutCue").textContent = "Mark from same end";
    $("layoutALabel").textContent = "Opening length";
    $("layoutBLabel").textContent = "Unused";
    $("layoutCLabel").textContent = "Spaces";
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
      exitSpecialtyMode(openCard);
      openCard.classList.remove("expanded-mode");
      openCard.querySelector("[data-mobile-toggle]").textContent = "Mobile";
    }
  });

  if (!options.specialty) {
    exitSpecialtyMode(card);
  }

  card.classList.add("expanded-mode");
  card.querySelector("[data-mobile-toggle]").textContent = "Close";
  document.querySelectorAll("[data-launch-calculator]").forEach((button) => {
    button.classList.toggle("active", button.dataset.launchCalculator === calculatorId);
  });
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
  if (openCard.classList.contains("specialty-mode") && !options.force) {
    exitSpecialtyMode(openCard);
    openCard.scrollTop = 0;
    return;
  }
  exitSpecialtyMode(openCard);
  openCard.classList.remove("expanded-mode");
  openCard.querySelector("[data-mobile-toggle]").textContent = "Mobile";
  document.querySelectorAll("[data-launch-calculator]").forEach((button) => button.classList.remove("active"));
  document.body.classList.remove("calculator-open");
  $("mobileScrim").hidden = true;
  resetShortcutIdentity();

  if (!options.preserveUrl && !openedFromShortcut) {
    const url = new URL(window.location.href);
    url.searchParams.delete("calc");
    window.history.replaceState({}, "", url);
  }
}

function setParentToolControlsHidden(card, hidden) {
  card.querySelector("[data-specialty-grid]")?.toggleAttribute("hidden", hidden);
  card.querySelector(".expanded-actions")?.toggleAttribute("hidden", hidden);
}

function enterSpecialtyMode(card, specialty) {
  const prompt = card.querySelector(".field-question");
  if (prompt) {
    if (!prompt.dataset.defaultQuestion) prompt.dataset.defaultQuestion = prompt.textContent;
    prompt.textContent = `Specialized calculator: ${specialty.label}`;
  }
  card.classList.add("specialty-mode");
  setParentToolControlsHidden(card, true);
}

function exitSpecialtyMode(card) {
  if (!card) return;
  const prompt = card.querySelector(".field-question");
  if (prompt?.dataset.defaultQuestion) {
    prompt.textContent = prompt.dataset.defaultQuestion;
  }
  card.classList.remove("specialty-mode");
  setParentToolControlsHidden(card, false);
  card.querySelectorAll("[data-specialty-tile]").forEach((tile) => tile.classList.remove("selected"));
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

function confirmInstallShortcut(calculatorId) {
  const meta = calculatorMeta[calculatorId];
  return new Promise((resolve) => {
    const dialog = document.createElement("div");
    dialog.className = "install-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.innerHTML = `
      <div class="install-dialog-panel">
        <h3>JOB-IT ${meta.label}</h3>
        <p>Add this calculator to your phone home screen as its own shortcut.</p>
        <div class="install-dialog-actions">
          <button class="install-confirm" type="button">Install shortcut on your phone?</button>
          <button class="install-cancel" type="button">Cancel</button>
        </div>
      </div>
    `;

    const finish = (answer) => {
      dialog.remove();
      resolve(answer);
    };

    dialog.querySelector(".install-confirm").addEventListener("click", () => finish(true));
    dialog.querySelector(".install-cancel").addEventListener("click", () => finish(false));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) finish(false);
    });
    document.body.appendChild(dialog);
    dialog.querySelector(".install-confirm").focus();
  });
}

async function createMobileShortcut(calculatorId) {
  const meta = calculatorMeta[calculatorId];
  const confirmed = await confirmInstallShortcut(calculatorId);
  if (!confirmed) return;

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

function setFieldValue(id, value) {
  const field = $(id);
  if (!field) return;
  field.value = value;
}

function applySpecialty(calculatorId, index) {
  const specialty = specialtyMeta[calculatorId]?.[index];
  const card = document.querySelector(`[data-calculator="${calculatorId}"]`);
  if (!specialty || !card) return;

  Object.entries(specialty.fields).forEach(([id, value]) => setFieldValue(id, value));
  card.querySelectorAll("[data-specialty-tile]").forEach((tile) => {
    tile.classList.toggle("selected", Number(tile.dataset.specialtyIndex) === index);
  });
  recalculateAll();
  openCalculator(calculatorId, { specialty: true });
  enterSpecialtyMode(card, specialty);
}

function addSpecialtyTiles() {
  document.querySelectorAll(".calculator").forEach((card) => {
    const calculatorId = card.dataset.calculator;
    const grid = card.querySelector("[data-specialty-grid]");
    if (!grid || !specialtyMeta[calculatorId]) return;

    grid.innerHTML = specialtyMeta[calculatorId].map((specialty, index) => `
      <button class="specialty-tile" type="button" data-specialty-tile data-specialty-index="${index}">
        <img src="${specialty.image}" alt="" />
        <span>${specialty.label}</span>
      </button>
    `).join("");

    grid.querySelectorAll("[data-specialty-tile]").forEach((tile) => {
      tile.addEventListener("click", (event) => {
        event.stopPropagation();
        applySpecialty(calculatorId, Number(tile.dataset.specialtyIndex));
      });
    });
  });
}

function addMobileLauncher() {
  const menu = $("mobileMenuBars");
  if (!menu) return;

  menu.innerHTML = calculatorOrder.map((calculatorId, index) => {
    const meta = calculatorMeta[calculatorId];
    return `
      <button class="mobile-menu-bar" type="button" data-launch-calculator="${calculatorId}">
        <span class="mobile-menu-index">${String(index + 1).padStart(2, "0")}</span>
        <img src="${meta.image}" alt="" />
        <span class="mobile-menu-copy">
          <strong>${meta.label}</strong>
          <span>${meta.title}</span>
          <em>${meta.cue}</em>
        </span>
      </button>
    `;
  }).join("");

  menu.querySelectorAll("[data-launch-calculator]").forEach((button) => {
    button.addEventListener("click", () => openCalculator(button.dataset.launchCalculator));
  });
}

function setupExpandedCalculators() {
  const params = new URLSearchParams(window.location.search);
  const initialCalculator = params.get("calc");
  openedFromShortcut = params.get("shortcut") === "1";
  const forcedMenu = params.get("menu") === "1";

  if (openedFromShortcut) {
    document.body.classList.add("shortcut-launch");
  }
  if (forcedMenu) {
    document.body.classList.add("menu-launch");
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
addSpecialtyTiles();
addMobileLauncher();
setupExpandedCalculators();
setupPwa();
recalculateAll();
