import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data
export const storeData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Error storing data:', error);
    return false;
  }
};

// Get data
export const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
};

// Remove data
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
};

// Clear all data
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

// Get multiple items
export const getMultiple = async (keys) => {
  try {
    const values = await AsyncStorage.multiGet(keys);
    return values.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error getting multiple data:', error);
    return null;
  }
};

// Set multiple items
export const setMultiple = async (keyValuePairs) => {
  try {
    await AsyncStorage.multiSet(keyValuePairs);
    return true;
  } catch (error) {
    console.error('Error setting multiple data:', error);
    return false;
  }
};

export default {
  storeData,
  getData,
  removeData,
  clearAllData,
  getMultiple,
  setMultiple,
};
