// Lightweight event emitter for auth expiration signaling.
// Used by api.js interceptor to notify AuthContext of 401 responses
// without importing React context into a plain module.

let _onAuthExpiredCallback = null;

/**
 * Register a callback to be invoked when a 401 (token expired) response is received.
 * Only one listener is supported — calling again replaces the previous one.
 * @param {Function} callback
 */
export const onAuthExpired = (callback) => {
  _onAuthExpiredCallback = callback;
};

/**
 * Emit the auth-expired event. Called from the Axios response interceptor.
 */
export const emitAuthExpired = () => {
  if (_onAuthExpiredCallback) {
    _onAuthExpiredCallback();
  }
};
