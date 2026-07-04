/* ==========================================================================
   Intake Docket — form logic
   Replace APPS_SCRIPT_URL below with your deployed Google Apps Script
   Web App URL (see DEPLOYMENT_GUIDE.md).
   ========================================================================== */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

/* -------------------------------------------------------------------------
   Option data — edit freely; everything below renders itself from this.
   ------------------------------------------------------------------------- */

const BRAND_FOCUS_OPTIONS = [
  { value: "thought-leadership", label: "Thought Leadership", note: "Becoming the reference point in your field" },
  { value: "audience-growth", label: "Audience Growth", note: "Reach, following, and consistent visibility" },
  { value: "monetization", label: "Monetization", note: "Turning presence into revenue" },
  { value: "visual-identity", label: "Visual Identity", note: "How you look, sound, and show up" },
  { value: "career-pivot", label: "Career Pivot", note: "Repositioning for a new direction" },
];

const VENTURE_STAGE_OPTIONS = [
  { value: "concept", label: "Concept" },
  { value: "prototype", label: "Prototype" },
  { value: "pre-revenue", label: "Pre-Revenue" },
  { value: "scaling", label: "Scaling" },
];

const VENTURE_NEEDS_OPTIONS = [
  { value: "financial-modeling", label: "Financial Modeling", note: "Unit economics and runway" },
  { value: "gtm-strategy", label: "Go-to-Market Strategy", note: "How this reaches its first real customers" },
  { value: "branding-identity", label: "Branding / Identity", note: "Name, mark, and story" },
  { value: "team-structure", label: "Team Structure", note: "Roles, hiring order, and governance" },
  { value: "pitch-deck", label: "Pitch Deck", note: "The narrative for capital or partners" },
];

const SERVICE_OPTIONS = [
  { value: "branding", label: "Branding", note: "Identity systems and naming" },
  { value: "content-strategy", label: "Content Strategy", note: "What you publish, and why" },
  { value: "market-positioning", label: "Market Positioning", note: "Where you sit against the field" },
  { value: "social-media-management", label: "Social Media Management", note: "Day-to-day execution" },
  { value: "operational-efficiency", label: "Operational Efficiency", note: "Systems that remove friction" },
  { value: "ip-licensing-protection", label: "IP Licensing / Protection", note: "Protecting what you build" },
];

/* -------------------------------------------------------------------------
   State
   ------------------------------------------------------------------------- */

const state = {
  stepIndex: 0,     // index into the active step sequence
  path: null,       // 'brand' | 'venture'
  data: {
    fullName: "", email: "", occupation: "", industry: "",
    path: "",
    brandFocus: [], brandObstacle: "",
    ventureStage: "", ventureNeeds: [],
    services: [],
  },
};

// The step sequence is dynamic because step 3 branches.
function getSequence() {
  const branchStep = state.path === "venture" ? "3b" : "3a";
  return ["1", "2", branchStep, "4", "5", "6"];
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
const STEP_LABELS = ["Particulars", "The Fork", "Focus", "Service Menu", "The Verdict", "Close"];

/* -------------------------------------------------------------------------
   DOM refs
   ------------------------------------------------------------------------- */

const form = document.getElementById("intake-form");
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");
const navRow = document.getElementById("nav-row");
const docketRail = document.getElementById("docket-rail");
const mobileProgress = document.getElementById("mobile-progress");

/* -------------------------------------------------------------------------
   Builders for checkbox / radio "seal" cards
   ------------------------------------------------------------------------- */

function buildCheckboxGroup(container, options, groupName, stateArrayRef) {
  container.innerHTML = "";
  options.forEach((opt, i) => {
    const id = `${groupName}-${opt.value}`;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <input type="checkbox" id="${id}" name="${groupName}" value="${opt.value}" class="seal-input" />
      <label for="${id}" class="seal-card flex items-start gap-3 border border-hairline rounded-sm p-4">
        <span class="seal-dot mt-0.5 shrink-0 w-4 h-4 rounded-full border border-graphite/50 flex items-center justify-center">
          <svg class="seal-check opacity-0 scale-50" style="transition: all .2s ease;" width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.2 5.7L8 1" stroke="#F6F4EE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span>
          <span class="block text-sm font-medium text-ink">${opt.label}</span>
          ${opt.note ? `<span class="block text-xs text-graphite mt-0.5">${opt.note}</span>` : ""}
        </span>
      </label>
    `;
    container.appendChild(wrapper);

    wrapper.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!stateArrayRef.includes(opt.value)) stateArrayRef.push(opt.value);
      } else {
        const idx = stateArrayRef.indexOf(opt.value);
        if (idx > -1) stateArrayRef.splice(idx, 1);
      }
    });
  });
}

function buildRadioGroup(container, options, groupName, onSelect) {
  container.innerHTML = "";
  options.forEach((opt) => {
    const id = `${groupName}-${opt.value}`;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <input type="radio" id="${id}" name="${groupName}" value="${opt.value}" class="seal-input" />
      <label for="${id}" class="seal-card block text-center border border-hairline rounded-sm py-4 px-2">
        <span class="block text-sm font-medium text-ink">${opt.label}</span>
      </label>
    `;
    container.appendChild(wrapper);
    wrapper.querySelector("input").addEventListener("change", () => onSelect(opt.value));
  });
}

buildCheckboxGroup(document.getElementById("brand-focus-group"), BRAND_FOCUS_OPTIONS, "brandFocus", state.data.brandFocus);
buildRadioGroup(document.getElementById("venture-stage-group"), VENTURE_STAGE_OPTIONS, "ventureStage", (val) => {
  state.data.ventureStage = val;
});
buildCheckboxGroup(document.getElementById("venture-needs-group"), VENTURE_NEEDS_OPTIONS, "ventureNeeds", state.data.ventureNeeds);
buildCheckboxGroup(document.getElementById("services-group"), SERVICE_OPTIONS, "services", state.data.services);

/* -------------------------------------------------------------------------
   Fork (step 2) — path selection also determines the branch shown at step 3
   ------------------------------------------------------------------------- */

document.querySelectorAll('input[name="path"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    state.path = e.target.value;
    state.data.path = e.target.value;
  });
});

/* -------------------------------------------------------------------------
   Docket rail (signature element) rendering
   ------------------------------------------------------------------------- */

function renderDocketRail() {
  const seq = getSequence();
  const current = seq[state.stepIndex];

  docketRail.innerHTML = seq.map((key, i) => {
    const numeral = ROMAN[i];
    const isDone = i < state.stepIndex;
    const isActive = i === state.stepIndex;
    const colorClass = isActive ? "text-brass border-brass" : isDone ? "text-brass-dim border-brass-dim" : "text-white/25 border-white/15";
    const labelClass = isActive ? "text-paper" : "text-white/35";
    return `
      <div class="flex items-center gap-3">
        <span class="docket-mark shrink-0 w-7 h-7 rounded-full border font-mono text-[11px] flex items-center justify-center ${colorClass}">
          ${numeral}
        </span>
        <span class="font-mono text-[11px] tracking-[0.1em] uppercase ${labelClass}">${STEP_LABELS[i]}</span>
      </div>
    `;
  }).join('<div class="docket-thread ml-3.5 w-px h-4 ' + '"></div>');

  // mobile dots
  mobileProgress.innerHTML = seq.map((_, i) => {
    const isDone = i <= state.stepIndex;
    return `<span class="h-1 rounded-full transition-all ${isDone ? "w-6 bg-brass" : "w-3 bg-white/15"}"></span>`;
  }).join("");
}

/* -------------------------------------------------------------------------
   Step navigation
   ------------------------------------------------------------------------- */

function showStep() {
  const seq = getSequence();
  const key = seq[state.stepIndex];

  document.querySelectorAll(".step-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.step === key);
  });

  btnBack.disabled = state.stepIndex === 0;
  btnNext.textContent = key === "5" ? "Send this docket" : key === "6" ? "" : "Continue";
  navRow.style.display = (key === "6") ? "none" : "flex";

  if (key === "5") renderVerdict();
  renderDocketRail();

  // move focus to the new heading for accessibility
  const heading = document.querySelector(`.step-panel[data-step="${key}"] h1`);
  if (heading) heading.setAttribute("tabindex", "-1");
  if (heading) heading.focus({ preventScroll: true });
}

function validateStep(key) {
  if (key === "1") {
    const required = ["fullName", "email", "occupation", "industry"];
    for (const name of required) {
      const el = form.elements[name];
      if (!el.value.trim()) { el.focus(); return false; }
    }
    state.data.fullName = form.elements.fullName.value.trim();
    state.data.email = form.elements.email.value.trim();
    state.data.occupation = form.elements.occupation.value.trim();
    state.data.industry = form.elements.industry.value;
    return true;
  }
  if (key === "2") {
    if (!state.path) return false;
    return true;
  }
  if (key === "3a") {
    state.data.brandObstacle = form.elements.brandObstacle.value.trim();
    return true; // no hard requirement on checkbox count
  }
  if (key === "3b") {
    return true;
  }
  if (key === "4") {
    return true;
  }
  return true;
}

btnNext.addEventListener("click", () => {
  const seq = getSequence();
  const key = seq[state.stepIndex];

  if (!validateStep(key)) return;

  if (key === "5") {
    submitDocket();
    state.stepIndex++;
    showStep();
    return;
  }

  if (state.stepIndex < seq.length - 1) {
    state.stepIndex++;
    showStep();
  }
});

btnBack.addEventListener("click", () => {
  if (state.stepIndex > 0) {
    state.stepIndex--;
    showStep();
  }
});

document.getElementById("retry-submit").addEventListener("click", () => {
  submitDocket();
});

/* -------------------------------------------------------------------------
   Expert Verdict algorithm (Step 5)
   Reads state.data and produces a structured recommendation: a headline
   read plus a phased engagement structure, driven by the branch, the
   selected needs/focus areas, and the selected services.
   ------------------------------------------------------------------------- */

function labelFor(options, value) {
  const found = options.find((o) => o.value === value);
  return found ? found.label : value;
}

function generateVerdict(data) {
  const phases = [];
  let headline = "";

  const svc = new Set(data.services);

  if (data.path === "brand") {
    const focus = new Set(data.brandFocus);

    headline = focus.has("monetization")
      ? "This reads as a brand with an audience question and a revenue question tangled together — they need to be solved in that order."
      : focus.has("career-pivot")
      ? "This reads as a repositioning project before it's a visibility project. The story has to change before the volume goes up."
      : "This reads as a brand that needs a sharper point of view before it needs more reach.";

    // Phase 1 — always foundation for personal brand
    const p1items = ["Positioning workshop to define the singular point of view", "Audit of current presence across every visible channel"];
    if (focus.has("visual-identity") || svc.has("branding")) p1items.push("Visual identity system: mark, palette, and applied templates");
    phases.push({ title: "Phase 1 — Foundation", items: p1items });

    // Phase 2 — depends on focus
    const p2items = [];
    if (focus.has("thought-leadership")) p2items.push("Point-of-view content pillars and a publishing cadence");
    if (focus.has("audience-growth") || svc.has("social-media-management")) p2items.push("Channel strategy and a managed content calendar");
    if (svc.has("content-strategy")) p2items.push("Editorial framework tying content back to positioning");
    if (focus.has("career-pivot")) p2items.push("Narrative bridge connecting past credibility to the new direction");
    if (p2items.length === 0) p2items.push("Distribution plan matched to where the right audience already is");
    phases.push({ title: "Phase 2 — Presence", items: p2items });

    // Phase 3 — monetization / positioning / protection
    const p3items = [];
    if (focus.has("monetization")) p3items.push("Offer architecture: what's sold, to whom, at what structure");
    if (svc.has("market-positioning")) p3items.push("Competitive positioning map and pricing rationale");
    if (svc.has("ip-licensing-protection")) p3items.push("Protection of name, mark, and original material");
    if (svc.has("operational-efficiency")) p3items.push("Lightweight systems so output doesn't depend on more hours");
    if (p3items.length > 0) phases.push({ title: "Phase 3 — Conversion", items: p3items });

  } else if (data.path === "venture") {
    const needs = new Set(data.ventureNeeds);
    const stage = data.ventureStage;

    headline = stage === "concept"
      ? "This reads as a venture that needs to prove its premise before it needs a pitch deck."
      : stage === "prototype"
      ? "This reads as a venture with something real to show, and a positioning gap between the product and the market."
      : stage === "pre-revenue"
      ? "This reads as a venture close to its first real customers — the priority is a go-to-market sequence, not more building."
      : "This reads as a venture where the constraint has shifted from product to organization.";

    const p1items = [];
    if (stage === "concept" || needs.has("financial-modeling")) p1items.push("Financial model: unit economics, runway, and key assumptions stress-tested");
    if (needs.has("branding-identity") || svc.has("branding")) p1items.push("Name, identity, and founding narrative");
    if (p1items.length === 0) p1items.push("Structured diagnostic of the current model against the stated goal");
    phases.push({ title: "Phase 1 — Foundation", items: p1items });

    const p2items = [];
    if (needs.has("gtm-strategy") || svc.has("market-positioning")) p2items.push("Go-to-market strategy: first customer segment and acquisition path");
    if (svc.has("content-strategy") || svc.has("social-media-management")) p2items.push("Content and channel plan to build pre-launch or early-stage demand");
    if (p2items.length === 0) p2items.push("Positioning against the nearest real alternatives, not a generic category");
    phases.push({ title: "Phase 2 — Market Entry", items: p2items });

    const p3items = [];
    if (needs.has("pitch-deck")) p3items.push("Pitch narrative and materials built on the model from Phase 1");
    if (needs.has("team-structure")) p3items.push("Team structure and hiring order matched to the next milestone");
    if (svc.has("ip-licensing-protection")) p3items.push("Protection of core IP before wider disclosure");
    if (svc.has("operational-efficiency")) p3items.push("Operating rhythm and systems built for the scaling stage");
    if (p3items.length > 0) phases.push({ title: "Phase 3 — Readiness", items: p3items });
  } else {
    headline = "Choose a path in Entry II to generate a tailored read.";
  }

  return { headline, phases };
}

function renderVerdict() {
  const { headline, phases } = generateVerdict(state.data);
  const output = document.getElementById("verdict-output");

  const phasesHTML = phases.map((phase, i) => `
    <div class="border-l-2 border-hairline pl-5">
      <p class="font-mono text-[11px] tracking-[0.15em] text-brass uppercase">${phase.title}</p>
      <ul class="mt-2 space-y-1.5">
        ${phase.items.map((it) => `<li class="text-sm text-ink/85 leading-relaxed">${it}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  output.innerHTML = `
    <p class="font-display text-xl leading-snug text-ink italic">"${headline}"</p>
    <div class="space-y-6 pt-2">${phasesHTML}</div>
  `;
}

/* -------------------------------------------------------------------------
   Submission — sends the full payload to the Google Apps Script Web App.
   Uses a text/plain body (a "simple request") so no CORS preflight is
   triggered; the Apps Script side parses e.postData.contents as JSON.
   ------------------------------------------------------------------------- */

function buildPayload() {
  return {
    submittedAt: new Date().toISOString(),
    fullName: state.data.fullName,
    email: state.data.email,
    occupation: state.data.occupation,
    industry: state.data.industry,
    path: state.data.path,
    brandFocus: state.data.brandFocus.map((v) => labelFor(BRAND_FOCUS_OPTIONS, v)),
    brandObstacle: state.data.brandObstacle,
    ventureStage: state.data.ventureStage ? labelFor(VENTURE_STAGE_OPTIONS, state.data.ventureStage) : "",
    ventureNeeds: state.data.ventureNeeds.map((v) => labelFor(VENTURE_NEEDS_OPTIONS, v)),
    services: state.data.services.map((v) => labelFor(SERVICE_OPTIONS, v)),
  };
}

async function submitDocket() {
  document.getElementById("submit-pending").classList.remove("hidden");
  document.getElementById("submit-success").classList.add("hidden");
  document.getElementById("submit-error").classList.add("hidden");

  const payload = buildPayload();

  try {
    if (APPS_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID")) {
      throw new Error("Apps Script URL not configured yet.");
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    document.getElementById("submit-pending").classList.add("hidden");
    document.getElementById("submit-success").classList.remove("hidden");
    document.getElementById("success-name").textContent = payload.fullName.split(" ")[0] || "friend";
  } catch (err) {
    console.error("Docket submission failed:", err);
    document.getElementById("submit-pending").classList.add("hidden");
    document.getElementById("submit-error").classList.remove("hidden");
  }
}

/* -------------------------------------------------------------------------
   Init
   ------------------------------------------------------------------------- */

showStep();
