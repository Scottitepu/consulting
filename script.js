/* ==========================================================================
   Intake Docket — form logic
   Replace APPS_SCRIPT_URL below with your deployed Google Apps Script
   Web App URL (see DEPLOYMENT_GUIDE.md).
   ========================================================================== */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyD1Mv7NOJiFMBZln9rY6yblDXl_jyr7MnIIGwitG6X5W-W64jUrg7J038wacEgF9IS2A/exec";

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

const BUDGET_OPTIONS = [
  { value: "under-1k", label: "Under $1,000" },
  { value: "1k-5k", label: "$1,000 – $5,000" },
  { value: "5k-15k", label: "$5,000 – $15,000" },
  { value: "15k-plus", label: "$15,000+" },
  { value: "not-sure", label: "Not sure yet" },
];

const DURATION_OPTIONS = [
  { value: "under-1-month", label: "Less than 1 month" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "3-6-months", label: "3–6 months" },
  { value: "6-plus-months", label: "6+ months / ongoing" },
];

const FREQUENCY_OPTIONS = [
  { value: "rarely", label: "Rarely / inconsistently" },
  { value: "1-2-week", label: "1–2 times a week" },
  { value: "3-5-week", label: "3–5 times a week" },
  { value: "daily", label: "Daily" },
];

const FORMAT_OPTIONS = [
  { value: "photos", label: "Photos" },
  { value: "short-video", label: "Short-form video (Reels / TikTok)" },
  { value: "long-video", label: "Long-form video (YouTube)" },
  { value: "written", label: "Written / text" },
  { value: "audio-podcast", label: "Audio / Podcast" },
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
    brandFocus: [], brandFocusOther: "", brandObstacle: "",
    ventureStage: "", ventureNeeds: [], ventureNeedsOther: "",
    services: [], servicesOther: "",
    budget: "", duration: "",
    postingFrequency: "",
    formatEasiest: [], formatCurrent: [], formatDesired: [],
  },
};

// The step sequence is dynamic: it branches at step 3, and the content
// assessment step only appears when it's actually relevant.
function needsContentAssessment() {
  if (state.path === "brand") return true;
  if (state.data.services.includes("social-media-management")) return true;
  if (state.data.services.includes("content-strategy")) return true;
  return false;
}

function getSequence() {
  const branchStep = state.path === "venture" ? "3b" : "3a";
  const seq = ["welcome", "1", "2", branchStep, "4", "budget"];
  if (needsContentAssessment()) seq.push("assessment");
  seq.push("verdict", "close");
  return seq;
}

const STEP_LABELS = {
  welcome: "Welcome",
  "1": "Particulars",
  "2": "The Fork",
  "3a": "Focus",
  "3b": "Focus",
  "4": "Priority",
  budget: "Scope",
  assessment: "Assessment",
  verdict: "The Verdict",
  close: "Close",
};

function toRoman(n) {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return numerals[n] || String(n + 1);
}

/* -------------------------------------------------------------------------
   DOM refs
   ------------------------------------------------------------------------- */

const form = document.getElementById("intake-form");
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");
const btnStart = document.getElementById("btn-start");
const navRow = document.getElementById("nav-row");
const docketAside = document.getElementById("docket-aside");
const docketRail = document.getElementById("docket-rail");
const mobileProgressWrap = document.getElementById("mobile-progress-wrap");
const mobileProgress = document.getElementById("mobile-progress");

/* -------------------------------------------------------------------------
   Builders for checkbox / radio "seal" cards, with optional "Other" support
   ------------------------------------------------------------------------- */

function buildCheckboxGroup(container, options, groupName, stateArrayRef, otherConfig) {
  container.innerHTML = "";

  options.forEach((opt) => {
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

  if (otherConfig) {
    const otherId = `${groupName}-other`;
    const wrapper = document.createElement("div");
    wrapper.className = "sm:col-span-2";
    wrapper.innerHTML = `
      <input type="checkbox" id="${otherId}" class="seal-input" />
      <label for="${otherId}" class="seal-card flex items-start gap-3 border border-hairline rounded-sm p-4">
        <span class="seal-dot mt-0.5 shrink-0 w-4 h-4 rounded-full border border-graphite/50 flex items-center justify-center">
          <svg class="seal-check opacity-0 scale-50" style="transition: all .2s ease;" width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.2 5.7L8 1" stroke="#F6F4EE" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="block text-sm font-medium text-ink">Other</span>
      </label>
      <div class="other-text-row mt-2">
        <input type="text" placeholder="Tell me more…"
          class="w-full border border-hairline rounded-sm p-2.5 text-sm text-ink placeholder-graphite/40 focus:outline-none focus:border-brass" />
      </div>
    `;
    container.appendChild(wrapper);

    const otherCheckbox = wrapper.querySelector(`#${otherId}`);
    const otherRow = wrapper.querySelector(".other-text-row");
    const otherInput = wrapper.querySelector(".other-text-row input");

    otherCheckbox.addEventListener("change", (e) => {
      otherRow.classList.toggle("is-visible", e.target.checked);
      if (!e.target.checked) {
        otherInput.value = "";
        otherConfig.setValue("");
      }
    });
    otherInput.addEventListener("input", (e) => {
      otherConfig.setValue(e.target.value);
    });
  }
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

buildCheckboxGroup(
  document.getElementById("brand-focus-group"), BRAND_FOCUS_OPTIONS, "brandFocus", state.data.brandFocus,
  { setValue: (v) => { state.data.brandFocusOther = v; } }
);
buildRadioGroup(document.getElementById("venture-stage-group"), VENTURE_STAGE_OPTIONS, "ventureStage", (val) => {
  state.data.ventureStage = val;
});
buildCheckboxGroup(
  document.getElementById("venture-needs-group"), VENTURE_NEEDS_OPTIONS, "ventureNeeds", state.data.ventureNeeds,
  { setValue: (v) => { state.data.ventureNeedsOther = v; } }
);
buildCheckboxGroup(
  document.getElementById("services-group"), SERVICE_OPTIONS, "services", state.data.services,
  { setValue: (v) => { state.data.servicesOther = v; } }
);
buildRadioGroup(document.getElementById("budget-group"), BUDGET_OPTIONS, "budget", (val) => {
  state.data.budget = val;
});
buildRadioGroup(document.getElementById("duration-group"), DURATION_OPTIONS, "duration", (val) => {
  state.data.duration = val;
});
buildRadioGroup(document.getElementById("frequency-group"), FREQUENCY_OPTIONS, "frequency", (val) => {
  state.data.postingFrequency = val;
});
buildCheckboxGroup(document.getElementById("format-easiest-group"), FORMAT_OPTIONS, "formatEasiest", state.data.formatEasiest);
buildCheckboxGroup(document.getElementById("format-current-group"), FORMAT_OPTIONS, "formatCurrent", state.data.formatCurrent);
buildCheckboxGroup(document.getElementById("format-desired-group"), FORMAT_OPTIONS, "formatDesired", state.data.formatDesired);

/* -------------------------------------------------------------------------
   Fork (step 2) — path selection also determines the branch shown at step 3
   ------------------------------------------------------------------------- */

document.querySelectorAll('input[name="path"]').forEach((input) => {
  input.addEventListener("change", (e) => {
    state.path = e.target.value;
    state.data.path = e.target.value;
    document.getElementById("fork-error").classList.remove("is-visible");
  });
});

/* -------------------------------------------------------------------------
   Docket rail (signature element) rendering
   ------------------------------------------------------------------------- */

function renderDocketRail() {
  const fullSeq = getSequence();
  const seq = fullSeq.filter((k) => k !== "welcome");
  const currentKey = fullSeq[state.stepIndex];
  const railIndex = seq.indexOf(currentKey); // -1 while on welcome

  docketRail.innerHTML = seq.map((key, i) => {
    const numeral = toRoman(i);
    const isDone = railIndex > -1 && i < railIndex;
    const isActive = i === railIndex;
    const colorClass = isActive ? "text-brass border-brass" : isDone ? "text-brass-dim border-brass-dim" : "text-white/25 border-white/15";
    const labelClass = isActive ? "text-paper" : "text-white/35";
    return `
      <div class="flex items-center gap-3">
        <span class="docket-mark shrink-0 w-7 h-7 rounded-full border font-mono text-[11px] flex items-center justify-center ${colorClass}">
          ${numeral}
        </span>
        <span class="font-mono text-[11px] tracking-[0.1em] uppercase ${labelClass}">${STEP_LABELS[key]}</span>
      </div>
    `;
  }).join("");

  mobileProgress.innerHTML = seq.map((_, i) => {
    const isDone = railIndex > -1 && i <= railIndex;
    return `<span class="h-1 rounded-full transition-all ${isDone ? "w-6 bg-brass" : "w-3 bg-white/15"}"></span>`;
  }).join("");

  const onWelcome = currentKey === "welcome";
  docketAside.classList.toggle("force-hidden", onWelcome);
  mobileProgressWrap.classList.toggle("force-hidden", onWelcome);
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

  // Entry label per visible panel (roman numeral matching the docket rail)
  const railSeq = seq.filter((k) => k !== "welcome");
  const railIndex = railSeq.indexOf(key);
  document.querySelectorAll(`.step-panel[data-step="${key}"] [data-entry-label]`).forEach((el) => {
    el.textContent = railIndex > -1 ? `Entry ${toRoman(railIndex)}` : "";
  });

  btnBack.disabled = state.stepIndex === 0;
  if (key === "verdict") {
    btnNext.textContent = "Send this docket";
  } else {
    btnNext.textContent = "Continue";
  }
  navRow.style.display = (key === "welcome" || key === "close") ? "none" : "flex";

  if (key === "verdict") renderVerdict();
  renderDocketRail();

  const heading = document.querySelector(`.step-panel[data-step="${key}"] h1`);
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
}

function showFieldError(el) {
  const wrapper = el.closest(".underline-field") || el.closest("label");
  if (wrapper && wrapper.classList.contains("underline-field")) {
    wrapper.classList.add("has-error");
  }
  el.focus();
}

function clearFieldErrors() {
  document.querySelectorAll(".underline-field.has-error").forEach((el) => el.classList.remove("has-error"));
}

function validateStep(key) {
  if (key === "1") {
    clearFieldErrors();
    const required = ["fullName", "email", "occupation", "industry"];
    let firstInvalid = null;
    let allValid = true;
    required.forEach((name) => {
      const el = form.elements[name];
      if (!el.value.trim()) {
        allValid = false;
        const wrapper = el.closest(".underline-field");
        if (wrapper) wrapper.classList.add("has-error");
        if (!firstInvalid) firstInvalid = el;
      }
    });
    if (!allValid) {
      if (firstInvalid) firstInvalid.focus();
      return false;
    }
    state.data.fullName = form.elements.fullName.value.trim();
    state.data.email = form.elements.email.value.trim();
    state.data.occupation = form.elements.occupation.value.trim();
    state.data.industry = form.elements.industry.value;
    return true;
  }
  if (key === "2") {
    if (!state.path) {
      document.getElementById("fork-error").classList.add("is-visible");
      return false;
    }
    return true;
  }
  if (key === "3a") {
    state.data.brandObstacle = form.elements.brandObstacle.value.trim();
    return true;
  }
  return true;
}

btnStart.addEventListener("click", () => {
  state.stepIndex = 1; // seq[0] is 'welcome', seq[1] is '1'
  showStep();
});

btnNext.addEventListener("click", () => {
  const seq = getSequence();
  const key = seq[state.stepIndex];

  if (!validateStep(key)) return;

  if (key === "verdict") {
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
   Expert Verdict algorithm (Step: 'verdict')
   Reads state.data and produces a structured recommendation: a headline
   read plus a phased engagement structure, driven by the branch, the
   selected needs/focus areas, services, budget, duration, and — where
   relevant — current content habits.
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

    const p1items = ["Positioning workshop to define the singular point of view", "Audit of current presence across every visible channel"];
    if (focus.has("visual-identity") || svc.has("branding")) p1items.push("Visual identity system: mark, palette, and applied templates");
    phases.push({ title: "Phase 1 — Foundation", items: p1items });

    const p2items = [];
    if (focus.has("thought-leadership")) p2items.push("Point-of-view content pillars and a publishing cadence");
    if (focus.has("audience-growth") || svc.has("social-media-management")) p2items.push("Channel strategy and a managed content calendar");
    if (svc.has("content-strategy")) p2items.push("Editorial framework tying content back to positioning");
    if (focus.has("career-pivot")) p2items.push("Narrative bridge connecting past credibility to the new direction");

    // Fold in content-habit assessment, when present, to make Phase 2 concrete
    if (data.formatDesired && data.formatDesired.length) {
      const desired = data.formatDesired.map((v) => labelFor(FORMAT_OPTIONS, v)).join(", ");
      p2items.push(`Production plan built around the formats you actually want to make: ${desired}`);
    }
    if (data.postingFrequency === "rarely" && p2items.length) {
      p2items.push("A cadence that's realistic to sustain before it's ambitious");
    }
    if (p2items.length === 0) p2items.push("Distribution plan matched to where the right audience already is");
    phases.push({ title: "Phase 2 — Presence", items: p2items });

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

  const scopeLine = (data.budget || data.duration)
    ? `Scoped against ${data.budget ? labelFor(BUDGET_OPTIONS, data.budget).toLowerCase() : "a flexible budget"}, over ${data.duration ? labelFor(DURATION_OPTIONS, data.duration).toLowerCase() : "a timeline we'll set together"}.`
    : "";

  return { headline, phases, scopeLine };
}

function renderVerdict() {
  const { headline, phases, scopeLine } = generateVerdict(state.data);
  const output = document.getElementById("verdict-output");

  const phasesHTML = phases.map((phase) => `
    <div class="border-l-2 border-hairline pl-5">
      <p class="font-mono text-[11px] tracking-[0.15em] text-brass uppercase">${phase.title}</p>
      <ul class="mt-2 space-y-1.5">
        ${phase.items.map((it) => `<li class="text-sm text-ink/85 leading-relaxed">${it}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  output.innerHTML = `
    <p class="font-display text-xl leading-snug text-ink italic">"${headline}"</p>
    ${scopeLine ? `<p class="font-mono text-xs text-graphite">${scopeLine}</p>` : ""}
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
    brandFocus: state.data.brandFocus.map((v) => labelFor(BRAND_FOCUS_OPTIONS, v)).concat(state.data.brandFocusOther ? [`Other: ${state.data.brandFocusOther}`] : []),
    brandObstacle: state.data.brandObstacle,
    ventureStage: state.data.ventureStage ? labelFor(VENTURE_STAGE_OPTIONS, state.data.ventureStage) : "",
    ventureNeeds: state.data.ventureNeeds.map((v) => labelFor(VENTURE_NEEDS_OPTIONS, v)).concat(state.data.ventureNeedsOther ? [`Other: ${state.data.ventureNeedsOther}`] : []),
    services: state.data.services.map((v) => labelFor(SERVICE_OPTIONS, v)).concat(state.data.servicesOther ? [`Other: ${state.data.servicesOther}`] : []),
    budget: state.data.budget ? labelFor(BUDGET_OPTIONS, state.data.budget) : "",
    duration: state.data.duration ? labelFor(DURATION_OPTIONS, state.data.duration) : "",
    postingFrequency: state.data.postingFrequency ? labelFor(FREQUENCY_OPTIONS, state.data.postingFrequency) : "",
    formatEasiest: state.data.formatEasiest.map((v) => labelFor(FORMAT_OPTIONS, v)),
    formatCurrent: state.data.formatCurrent.map((v) => labelFor(FORMAT_OPTIONS, v)),
    formatDesired: state.data.formatDesired.map((v) => labelFor(FORMAT_OPTIONS, v)),
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
