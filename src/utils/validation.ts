// Form validation utilities
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return "Please enter a valid email address";
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

// Form validation for common patterns in the app
export const validateStoryTitle = (title: string): string | null => {
  return validateField(title, [
    (value) => validators.required(value, "Titolo"),
    (value) => validators.minLength(value, 3, "Titolo"),
    (value) => validators.maxLength(value, 100, "Titolo")
  ]);
};

export const validateStoryContent = (content: string): string | null => {
  return validateField(content, [
    (value) => validators.required(value, "Contenuto"),
    (value) => validators.minLength(value, 10, "Contenuto")
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