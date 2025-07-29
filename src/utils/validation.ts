import { sanitizeInput, isValidEmail } from './authSecurity';

// Form validation utilities with security enhancements
export const validators = {
  required: (value: string, fieldName = "Field") => {
    if (!value || !value.trim()) {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName = "Field") => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName = "Field") => {
    if (value && value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },

  email: (value: string) => {
    if (value && !isValidEmail(value)) {
      return "Please enter a valid email address";
    }
    return null;
  },

  // Security-focused validators
  noScriptTags: (value: string, fieldName = "Field") => {
    if (/<script|javascript:|data:|onload|onerror/i.test(value)) {
      return `${fieldName} contains invalid content`;
    }
    return null;
  },

  alphanumericAndBasic: (value: string, fieldName = "Field") => {
    if (value && !/^[a-zA-ZÀ-ÿ0-9\s\-_\.]+$/.test(value)) {
      return `${fieldName} contains invalid characters`;
    }
    return null;
  }
};

// Validation helper function
export const validateField = (value: string, rules: Array<(value: string) => string | null>): string | null => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
};

// Form validation for common patterns in the app with security
export const validateStoryTitle = (title: string): string | null => {
  const sanitizedTitle = sanitizeInput(title);
  return validateField(sanitizedTitle, [
    (value) => validators.required(value, "Titolo"),
    (value) => validators.minLength(value, 3, "Titolo"),
    (value) => validators.maxLength(value, 100, "Titolo"),
    (value) => validators.noScriptTags(value, "Titolo")
  ]);
};

export const validateStoryContent = (content: string): string | null => {
  const sanitizedContent = sanitizeInput(content);
  return validateField(sanitizedContent, [
    (value) => validators.required(value, "Contenuto"),
    (value) => validators.minLength(value, 10, "Contenuto"),
    (value) => validators.maxLength(value, 10000, "Contenuto"),
    (value) => validators.noScriptTags(value, "Contenuto")
  ]);
};

export const validateUserName = (name: string): string | null => {
  const sanitizedName = sanitizeInput(name);
  return validateField(sanitizedName, [
    (value) => validators.required(value, "Nome"),
    (value) => validators.minLength(value, 2, "Nome"),
    (value) => validators.maxLength(value, 50, "Nome"),
    (value) => validators.alphanumericAndBasic(value, "Nome")
  ]);
};

export const validateUserEmail = (email: string): string | null => {
  if (!email.trim()) return null; // Email is optional
  const sanitizedEmail = sanitizeInput(email);
  return validateField(sanitizedEmail, [
    (value) => validators.email(value),
    (value) => validators.maxLength(value, 254, "Email")
  ]);
};

export const validateMessage = (message: string): string | null => {
  const sanitizedMessage = sanitizeInput(message);
  return validateField(sanitizedMessage, [
    (value) => validators.required(value, "Messaggio"),
    (value) => validators.maxLength(value, 1000, "Messaggio"),
    (value) => validators.noScriptTags(value, "Messaggio")
  ]);
};

// Toast message helpers
export const createToastMessage = (type: 'success' | 'error' | 'warning', message: string, description?: string) => {
  const variants = {
    success: undefined,
    error: 'destructive' as const,
    warning: 'destructive' as const
  };

  const titles = {
    success: 'Successo',
    error: 'Errore',
    warning: 'Attenzione'
  };

  return {
    title: titles[type],
    description: description || message,
    variant: variants[type]
  };
};

// Common validation patterns for the application
export const validateBeforeSave = (title: string, content: string) => {
  const titleError = validateStoryTitle(title);
  if (titleError) {
    return createToastMessage('warning', titleError);
  }

  const contentError = validateStoryContent(content);
  if (contentError) {
    return createToastMessage('warning', contentError);
  }

  return null;
};

export const validateBeforeContinue = (content: string, fieldName = "contenuto") => {
  if (!content.trim()) {
    return createToastMessage('warning', `Scrivi qualcosa prima di continuare!`);
  }
  return null;
};