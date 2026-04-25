/**
 * Revenue calculator utility
 * Handles supplier / platform revenue split
 *
 * Rule:
 *  - Supplier gets 60%
 *  - Platform gets 40%
 */

const calculateRevenue = (totalFare) => {
  // Basic validation (safe guard)
  if (typeof totalFare !== "number" || totalFare <= 0) {
    throw new Error("Invalid total fare amount");
  }

  const supplierAmount = totalFare * 0.6;
  const platformAmount = totalFare * 0.4;

  return {
    supplierAmount,
    platformAmount,
  };
};

module.exports = {
  calculateRevenue,
};

