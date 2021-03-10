/**
 * @param {string} baseUrl
 * @param  {...string} parts
 * @returns string
 */
function joinUrl(baseUrl, ...parts) {
  return [
    baseUrl,
    ...parts,
  ].filter(Boolean)
    .map((part) => part
      .replace(/^\//, '')
      .replace(/\/$/, ''))
    .join('/');
}

module.exports = joinUrl;
