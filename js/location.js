import constants from "./constants.js";

const { PHOTON_API_BASE_URL } = constants;

function mapLocationResult(location) {
  const name = location.properties.name;
  const countrycode = location.properties.countrycode;
  const lat = location.geometry.coordinates[1];
  const lon = location.geometry.coordinates[0];

  return { name, countrycode, lat, lon };
}

/**
 * Fetches locations from Photon API based on the provided query.
 * Searches for cities, towns, and villages.
 *
 * @async
 * @param {string} query - The search query for locations.
 * @returns {Promise<Array<Object>>} Promise resolving to an array of location objects,
 *                                   sorted by country code.
 * @property {string} name - The name of the location.
 * @property {string} countrycode - The country code of the location.
 * @property {number} lat - The latitude of the location.
 * @property {number} lon - The longitude of the location.
 */
export async function getLocations(query) {
  const params = new URLSearchParams({
    q: query,
    lang: "fr",
    limit: 10,
  });
  params.append("osm_tag", "place:city");
  params.append("osm_tag", "place:town");
  params.append("osm_tag", "place:village");

  const response = await fetch(`${PHOTON_API_BASE_URL}?${params.toString()}`);
  const searchResults = await response.json();

  return searchResults.features
    .map(mapLocationResult)
    .sort((a, b) => a.countrycode.localeCompare(b.countrycode));
}
