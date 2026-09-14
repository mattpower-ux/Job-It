const $ = (id) => document.getElementById(id);
const numeric = (id) => Number($(id).value) || 0;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, places = 2) => Number(value).toFixed(places);

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
    $("layoutSecondary").textContent = `${inchesToFeetAndInches(diagonal * 12)}`;
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

function setupMobileMode() {
  const scrim = $("mobileScrim");
  document.querySelectorAll("[data-mobile-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".calculator");
      const isOpen = card.classList.toggle("mobile-mode");
      document.body.classList.toggle("mobile-open", isOpen);
      scrim.hidden = !isOpen;
      button.textContent = isOpen ? "Close" : "Mobile";
    });
  });

  scrim.addEventListener("click", () => {
    const openCard = document.querySelector(".calculator.mobile-mode");
    if (!openCard) return;
    openCard.classList.remove("mobile-mode");
    openCard.querySelector("[data-mobile-toggle]").textContent = "Mobile";
    document.body.classList.remove("mobile-open");
    scrim.hidden = true;
  });
}

document.addEventListener("input", recalculateAll);
document.addEventListener("change", recalculateAll);
setupMobileMode();
recalculateAll();
