import toast from 'react-hot-toast';

/**
 * Standardized error handler for API calls
 * @param {Error} error - The error object from the API call
 * @param {string} userMessage - User-friendly error message to display
 */
export const handleApiError = (error, userMessage = 'Something went wrong') => {
    // Log error for debugging
    console.error('API Error:', error);

    // Handle different types of errors
    if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const serverMessage = error.response.data?.message;

        switch (status) {
            case 401:
                toast.error('Session expired. Please login again');
                // Optionally redirect to login
                // setTimeout(() => window.location.href = '/login', 2000);
                break;
            case 403:
                toast.error('You don\'t have permission to perform this action');
                break;
            case 404:
                toast.error(serverMessage || 'Resource not found');
                break;
            case 409:
                toast.error(serverMessage || 'Conflict: This action cannot be completed');
                break;
            case 422:
                toast.error(serverMessage || 'Validation error: Please check your input');
                break;
            case 500:
                toast.error('Server error. Please try again later');
                break;
            default:
                toast.error(serverMessage || userMessage);
        }
    } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error. Please check your connection');
    } else {
        // Something else happened
        toast.error(userMessage);
    }
};

/**
 * Wrapper for async operations with automatic error handling
 * @param {Function} operation - Async function to execute
 * @param {string} errorMessage - Error message to show on failure
 * @param {Function} onSuccess - Optional callback on success
 * @returns {Promise} - Result of the operation
 */
export const withErrorHandling = async (operation, errorMessage, onSuccess) => {
    try {
        const result = await operation();
        if (onSuccess) {
            onSuccess(result);
        }
        return result;
    } catch (error) {
        handleApiError(error, errorMessage);
        return null;
    }
};

/**
 * Show a confirmation toast with custom actions
 * @param {string} message - The confirmation message
 * @param {Function} onConfirm - Function to call on confirm
 * @param {Object} options - Additional options (confirmText, cancelText, etc)
 */
export const confirmAction = (message, onConfirm, options = {}) => {
    const {
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        description = ''
    } = options;

    toast((t) => (
        <div className="flex flex-col gap-3">
            <p className="font-medium">{message}</p>
            {description && <p className="text-sm text-stone-500">{description}</p>}
            <div className="flex gap-2">
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg transition"
                >
                    {cancelText}
                </button>
                <button
                    onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            await onConfirm();
                        } catch (error) {
                            handleApiError(error, 'Action failed');
                        }
                    }}
                    className="px-3 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition"
                >
                    {confirmText}
                </button>
            </div>
        </div>
    ), { duration: 10000 });
};

export default handleApiError;
