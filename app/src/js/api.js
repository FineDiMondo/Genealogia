import { getDataBasePath } from "./env-manager.js";

async function fetchJson(relativePath) {
  const basePath = getDataBasePath();
  const res = await fetch(`${basePath}/${relativePath}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${relativePath} (${res.status})`);
  }
  return res.json();
}

export const GestionalAPI = {
  getManifest() {
    return fetchJson("manifest.json");
  },
  getSearchPeople() {
    return fetchJson("indexes/search_people.json");
  },
  getSamplePerson() {
    return fetchJson("people/sample.json");
  }
};

