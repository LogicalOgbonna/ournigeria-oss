export const STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

let _cachedYear = new Date().getFullYear();
let _cachedAt = Date.now();
const YEAR_CACHE_MS = 3_600_000;

/**
 * Current calendar year, re-read at most hourly so long-running server
 * processes don't serve a stale year after a calendar boundary (issue #27).
 */
export function getCurrentYear(): number {
  if (Date.now() - _cachedAt > YEAR_CACHE_MS) {
    _cachedYear = new Date().getFullYear();
    _cachedAt = Date.now();
  }
  return _cachedYear;
}

export const YEARS = Array.from(
  { length: getCurrentYear() - 2018 },
  (_, i) => 2019 + i,
);

export const UNIT_COSTS = {
  house: 25_000_000,
  school: 20_000_000,
  borehole: 5_000_000,
  homePowered: 100_000,
  hospital: 500_000_000,
  road_km: 200_000_000,
  scholarship: 500_000,
  textbook: 2_000,
};
