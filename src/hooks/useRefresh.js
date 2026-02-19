import { useState } from 'react';

/**
 * Custom hook for pull-to-refresh functionality
 * @param {Function} refreshCallback - Async function to call when refreshing
 * @returns {Object} - { refreshing, onRefresh }
 */
export const useRefresh = (refreshCallback) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCallback();
    } catch (error) {
      if (__DEV__) console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
};
