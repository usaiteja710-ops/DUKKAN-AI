/**
 * BookWise Application Error Class
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (default 400)
   * @param {string} code - Machine-readable error code (e.g. 'SLOT_TAKEN')
   * @param {any} [details] - Optional contextual details or field errors
   */
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

