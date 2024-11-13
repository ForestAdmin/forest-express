const timeoutError = (url, error) => {
  if (error.timeout) {
    return `The request to Forest Admin server has timed out while trying to reach ${url} at ${new Date().toISOString()}`;
  }
  return null;
};

module.exports = timeoutError;
