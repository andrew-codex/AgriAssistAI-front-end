/**
 * Rate Limit Helpers
 * Utility functions for managing and displaying rate limit information
 */

/**
 * Formats seconds into human-readable time
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted time string (e.g., "12 hours 30 minutes")
 */
export const formatTimeRemaining = (seconds) => {
  if (!seconds || seconds <= 0) return '0 seconds';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  } else {
    const secs = Math.floor(seconds);
    return `${secs} ${secs === 1 ? 'second' : 'seconds'}`;
  }
};

/**
 * Checks if rate limit data is stale (older than 5 minutes)
 * @param {number} lastUpdated - Timestamp of last update
 * @returns {boolean} True if stale
 */
export const isRateLimitStale = (lastUpdated) => {
  if (!lastUpdated) return true;
  const fiveMinutes = 5 * 60 * 1000;
  return (Date.now() - lastUpdated) > fiveMinutes;
};
