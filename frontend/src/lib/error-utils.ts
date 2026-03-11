/**
 * Extract user-friendly error message from API error response
 */
export function getErrorMessage(error: any, fallback: string = 'Something went wrong'): string {
    // Check for Axios response error
    if (error?.response?.data) {
        const data = error.response.data;
        
        // NestJS validation error format
        if (data.message && Array.isArray(data.message)) {
            return data.message.join(', ');
        }
        
        // Standard error message
        if (data.message) {
            return data.message;
        }
        
        // Error string
        if (data.error) {
            return data.error;
        }
    }
    
    // Direct error message
    if (error?.message) {
        return error.message;
    }
    
    // String error
    if (typeof error === 'string') {
        return error;
    }
    
    return fallback;
}

/**
 * Common error messages for forms
 */
export const ErrorMessages = {
    REQUIRED: 'This field is required',
    EMAIL_INVALID: 'Please enter a valid email address',
    PHONE_INVALID: 'Please enter a valid phone number',
    PASSWORD_MIN: 'Password must be at least 8 characters',
    PASSWORD_MISMATCH: 'Passwords do not match',
    MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
    MAX_LENGTH: (field: string, max: number) => `${field} must be at most ${max} characters`,
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    NOT_FOUND: 'The requested resource was not found',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again',
};
