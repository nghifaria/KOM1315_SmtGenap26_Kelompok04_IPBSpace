export const FACILITY_CONDITION = {
  GOOD: 'good',
  BROKEN: 'broken',
  MAINTENANCE: 'maintenance',
};

/**
 * Checks if a facility is available/active based on its condition.
 * Defaults to true if the condition is not set (null/undefined) or is 'good'.
 * @param {Object} facility
 * @returns {boolean}
 */
export const isFacilityAvailable = (facility) => {
  if (!facility) return false;
  return !facility.condition || facility.condition.toLowerCase() === FACILITY_CONDITION.GOOD;
};

/**
 * Checks if a facility is currently in maintenance.
 * @param {Object} facility
 * @returns {boolean}
 */
export const isFacilityInMaintenance = (facility) => {
  if (!facility) return false;
  return facility.condition?.toLowerCase() === FACILITY_CONDITION.MAINTENANCE;
};

/**
 * Checks if a facility is broken.
 * @param {Object} facility
 * @returns {boolean}
 */
export const isFacilityBroken = (facility) => {
  if (!facility) return false;
  return facility.condition?.toLowerCase() === FACILITY_CONDITION.BROKEN;
};
