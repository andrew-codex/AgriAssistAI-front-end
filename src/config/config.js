import { API_BASE_URL } from '@env';


const BASE_URL = API_BASE_URL || 'http://10.0.2.2:8000';

export const Config = {
  API_BASE_URL: BASE_URL,
  API_URL: `${BASE_URL}/api`,
  STORAGE_URL: `${BASE_URL}/storage_public`, 
};



export const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Normalize Laravel's /storage/ paths to match the actual /storage_public/ directory
  if (path.startsWith('/storage/')) {
    path = path.replace('/storage/', '/storage_public/');
  }
  // If path already includes /storage_public prefix, just prepend the base URL
  if (path.startsWith('/storage_public')) return `${Config.API_BASE_URL}${path}`;
  // Strip leading slash if present before appending to STORAGE_URL
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${Config.STORAGE_URL}/${cleanPath}`;
};

export default Config;
