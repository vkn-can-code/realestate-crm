// Web/people search plug slot — used by the Lead Search page to pull public
// details for a lead by name.
// TODO(dev): wire to a search API (Google Programmable Search, Bing, etc.)
// or a people-data provider, and normalize results into the shape below.

function assertConfigured() {
  if (!process.env.WEB_SEARCH_API_KEY) {
    throw new Error("Web search is not configured yet. Add WEB_SEARCH_API_KEY to .env");
  }
}

/** Searches the web for public info about a lead by name. */
export async function searchPerson({ name }) {
  assertConfigured();
  // TODO(dev): call the search API here
  return { name, results: [] };
}

export default { searchPerson };
