/**
 * Utility function to extract user-friendly error messages from API errors
 * @param {Error} error - The error object from API call
 * @param {string} defaultMessage - Default message to show if no specific error found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (
  error,
  defaultMessage = "Something went wrong. Please try again.",
) => {
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    error.message &&
    typeof error.message === "string"
  ) {
    if (error.message.startsWith("{") || error.message.startsWith("[")) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.message) return parsed.message;
      } catch (e) {}
    }
  }

  if (!error.response) {
    if (error.request) {
      return "Unable to connect to server. Please check your internet connection.";
    }

    if (error.message && !error.message.includes("Network Error")) {
      return error.message;
    }
    return "Network error. Please check your internet connection.";
  }

  const status = error.response?.status;

  if (status === 401) {
    return "Invalid credentials. Please check your email and password.";
  }

  if (status === 403) {
    return "Access denied. You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "The requested resource was not found.";
  }

  if (status === 422) {
    const validationErrors = error.response?.data?.errors;
    if (validationErrors) {
      const firstError = Object.values(validationErrors)[0];
      return Array.isArray(firstError) ? firstError[0] : firstError;
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }
  }

  if (status === 500) {
    return "Server error. Please try again later.";
  }

  const message =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message;

  if (
    message &&
    typeof message === "string" &&
    !message.includes("Error:") &&
    !message.includes("Exception") &&
    !message.startsWith("{")
  ) {
    return message;
  }

  return defaultMessage;
};

export const logError = (context, error) => {
  if (__DEV__) {
    console.warn(`[${context}] Error:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
  }
};

export const formatApiError = (
  error,
  defaultMessage = "An unexpected error occurred.",
) => getErrorMessage(error, defaultMessage);

export default getErrorMessage;
