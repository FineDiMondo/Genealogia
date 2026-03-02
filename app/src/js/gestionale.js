import { GestionalAPI } from "./api.js";
import { GestionalState } from "./state.js";
import { getCurrentEnv } from "./env-manager.js";

const state = new GestionalState();

async function bootstrapDashboard() {
  state.set("env", getCurrentEnv());
  try {
    const [manifest, people, sample] = await Promise.all([
      GestionalAPI.getManifest(),
      GestionalAPI.getSearchPeople(),
      GestionalAPI.getSamplePerson()
    ]);
    state.set("manifest", manifest);
    state.set("people", Array.isArray(people) ? people : []);
    state.set("sample", sample);

    const versionEl = document.getElementById("kpi-version");
    const peopleEl = document.getElementById("kpi-people");
    const envEl = document.getElementById("kpi-env");
    const sampleEl = document.getElementById("kpi-sample");

    if (versionEl) versionEl.textContent = manifest?.version ?? "n/a";
    if (peopleEl) {
      const count = manifest?.counts?.people_count ?? state.get("people").length;
      peopleEl.textContent = String(count);
    }
    if (envEl) envEl.textContent = state.get("env");
    if (sampleEl) sampleEl.textContent = sample?.name ?? "n/a";
  } catch (err) {
    const errEl = document.getElementById("kpi-error");
    if (errEl) errEl.textContent = String(err);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.page === "gestionale-dashboard") {
      bootstrapDashboard();
    }
  });
}

