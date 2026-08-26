/**
 * Flattens a ZodError into a compact, readable array of { field, message }
 * objects suitable for returning directly in a 400 JSON response.
 *
 * @param {import('zod').ZodError} error
 * @returns {{ field: string, message: string }[]}
 */
const formatZodError = (error) =>
  error.errors.map((e) => ({
    field: e.path.join('.') || '(root)',
    message: e.message,
  }));

module.exports = { formatZodError };
