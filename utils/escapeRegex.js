/**
 * Escapes characters that are special in a RegExp so user-supplied search
 * strings can be safely interpolated into a `new RegExp(...)` without risk
 * of a malformed or maliciously expensive pattern (ReDoS-style input).
 *
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };
