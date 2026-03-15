/**
 * Shared form validation utilities
 * Provides consistent validation across all forms with proper error messages
 */

// Email validation
export const validateEmail = (email: string): string | null => {
    if (!email || !email.trim()) {
        return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Please enter a valid email address';
    }
    return null;
};

// Phone validation (optional but if provided, must be valid)
export const validatePhone = (phone: string, required: boolean = false): string | null => {
    if (!phone || !phone.trim()) {
        if (required) return 'Phone number is required';
        return null;
    }
    // Allow +, spaces, dashes, parentheses
    const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,6}[-\s\.]?[0-9]{3,6}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return 'Please enter a valid phone number';
    }
    return null;
};

// Required field validation
export const validateRequired = (value: string | undefined | null, fieldName: string): string | null => {
    if (!value || !String(value).trim()) {
        return `${fieldName} is required`;
    }
    return null;
};

// Password validation
export const validatePassword = (password: string, minLength: number = 6): string | null => {
    if (!password || !password.trim()) {
        return 'Password is required';
    }
    if (password.length < minLength) {
        return `Password must be at least ${minLength} characters long`;
    }
    return null;
};

// Amount validation
export const validateAmount = (amount: string | number, fieldName: string = 'Amount'): string | null => {
    if (!amount && amount !== 0) {
        return `${fieldName} is required`;
    }
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) {
        return `Please enter a valid ${fieldName.toLowerCase()}`;
    }
    if (num <= 0) {
        return `${fieldName} must be greater than zero`;
    }
    return null;
};

// Date validation
export const validateDate = (date: string | Date | undefined | null, fieldName: string): string | null => {
    if (!date) {
        return `${fieldName} is required`;
    }
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        return `Please enter a valid ${fieldName.toLowerCase()}`;
    }
    return null;
};

// Validate multiple fields and return first error
export const validateFields = (validations: Array<{ value: any; validator: () => string | null }>): string | null => {
    for (const { validator } of validations) {
        const error = validator();
        if (error) return error;
    }
    return null;
};

// Validate form data object
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
}

export const validateField = (
    value: any,
    fieldName: string,
    rules: ValidationRule
): string | null => {
    // Required check
    if (rules.required) {
        if (value === undefined || value === null || value === '') {
            return `${fieldName} is required`;
        }
        if (Array.isArray(value) && value.length === 0) {
            return `${fieldName} is required`;
        }
    }

    // Skip other validations if value is empty and not required
    if (!value && !rules.required) {
        return null;
    }

    // Min length
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        return `${fieldName} must be at least ${rules.minLength} characters`;
    }

    // Max length
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        return `${fieldName} must not exceed ${rules.maxLength} characters`;
    }

    // Pattern
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return `Please enter a valid ${fieldName.toLowerCase()}`;
    }

    // Custom validation
    if (rules.custom) {
        return rules.custom(value);
    }

    return null;
};

// Validate entire form
export const validateForm = (
    data: Record<string, any>,
    rules: Record<string, { fieldName: string; rules: ValidationRule }>
): Record<string, string> => {
    const errors: Record<string, string> = {};

    for (const [field, config] of Object.entries(rules)) {
        const error = validateField(data[field], config.fieldName, config.rules);
        if (error) {
            errors[field] = error;
        }
    }

    return errors;
};

// Check if form has errors
export const hasErrors = (errors: Record<string, string>): boolean => {
    return Object.keys(errors).length > 0;
};

// Get first error message
export const getFirstError = (errors: Record<string, string>): string | null => {
    const keys = Object.keys(errors);
    return keys.length > 0 ? errors[keys[0]] : null;
};

// Common validation schemas
export const commonValidations = {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { required: false, pattern: /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,6}[-\s\.]?[0-9]{3,6}$/ },
    required: { required: true },
    password: { required: true, minLength: 6 },
    amount: { 
        required: true, 
        custom: (value: any) => {
            const num = parseFloat(value);
            if (isNaN(num) || num <= 0) return 'Amount must be greater than zero';
            return null;
        }
    },
};
