// API Configuration
// API_BASE_URL is configured via .env file — see config/config.js

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  LANGUAGE: '@language',
  THEME: '@theme',
  ONBOARDING_COMPLETE: '@onboarding_complete',
};

// User Types
export const USER_TYPES = {
  FARMER: 'farmers',
  DA_WORKER: 'DA_workers',
};

// Diagnosis Status
export const DIAGNOSIS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REVIEW_REQUESTED: 'review_requested',
  REVIEWED: 'reviewed',
};

// Case Priority
export const CASE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'AgriAssist AI',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'en',
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  MAX_IMAGES_PER_DIAGNOSIS: 5,
  CHAT_MESSAGE_LIMIT: 50,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTH_FAILED: 'Authentication failed. Please login again.',
  INVALID_CREDENTIALS: 'Invalid phone number or password.',
  UPLOAD_FAILED: 'Failed to upload image. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  DIAGNOSIS_SUBMITTED: 'Diagnosis submitted successfully.',
  FEEDBACK_SUBMITTED: 'Feedback submitted successfully.',
};

// Validation Patterns
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

export default {
  STORAGE_KEYS,
  USER_TYPES,
  DIAGNOSIS_STATUS,
  CASE_PRIORITY,
  APP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION,
};
