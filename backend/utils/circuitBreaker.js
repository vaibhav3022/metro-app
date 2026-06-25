const CircuitBreaker = require('opossum');

/**
 * Create a circuit breaker for any async function
 * @param {Function} fn - Function to protect
 * @param {Object} options - Override defaults
 */
function createBreaker(fn, options = {}) {
  const breaker = new CircuitBreaker(fn, {
    timeout: 5000,                  // Fail after 5s
    errorThresholdPercentage: 50,   // Open circuit if 50% errors
    resetTimeout: 30000,            // Try again after 30s
    volumeThreshold: 5,             // Evaluate after 5 calls minimum
    ...options,
  });

  breaker.on('open',     () => console.warn(`[CircuitBreaker] OPEN \u2014 ${fn.name}`));
  breaker.on('halfOpen', () => console.info(`[CircuitBreaker] HALF-OPEN \u2014 ${fn.name}`));
  breaker.on('close',    () => console.info(`[CircuitBreaker] CLOSED \u2014 ${fn.name}`));

  return breaker;
}

module.exports = { createBreaker };
