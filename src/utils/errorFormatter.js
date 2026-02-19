export function formatApiError(error) {
  const serverData = error?.response?.data;

  if (serverData) {
    if (serverData.errors && typeof serverData.errors === 'object') {
      const msgs = [];
      Object.values(serverData.errors).forEach((val) => {
        if (Array.isArray(val)) msgs.push(...val.map(String));
        else if (val) msgs.push(String(val));
      });
      if (msgs.length) return msgs.join('\n');
    }


    if (serverData.message && typeof serverData.message === 'string') {
      return serverData.message;
    }


    try {
      const text = JSON.stringify(serverData);
      return text.length > 0 ? text : 'Server returned an error.';
    } catch (e) {
      return 'Server returned an error.';
    }
  }

 
  if (error?.message) return String(error.message);

  return 'An unexpected error occurred.';
}

export default formatApiError;
