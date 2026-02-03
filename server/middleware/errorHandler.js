// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err);

    // Default error
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.code === 'ER_DUP_ENTRY') {
        status = 409;
        message = 'Duplicate entry. This record already exists.';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        status = 400;
        message = 'Referenced record does not exist.';
    } else if (err.name === 'JsonWebTokenError') {
        status = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        status = 401;
        message = 'Token expired';
    }

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV !== 'production';

    res.status(status).json({
        message,
        ...(isDev && { stack: err.stack, details: err.message })
    });
};

// Async handler wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
        this.name = 'AppError';
    }
}

module.exports = { errorHandler, asyncHandler, AppError };
