import bcrypt from 'bcryptjs';

// Password security constants
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in milliseconds
  sessionTimeout: number; // in milliseconds
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against its hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Check if password meets security requirements
 */
export const checkPasswordRequirements = (password: string): PasswordRequirements => {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
};

/**
 * Check if password is strong enough
 */
export const isPasswordStrong = (password: string): boolean => {
  const requirements = checkPasswordRequirements(password);
  return Object.values(requirements).every(req => req);
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 16): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Ensure at least one character from each required category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*()_+-=[]{}|;:,.<>?'[Math.floor(Math.random() * 25)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"']/g, (char) => {
      const map: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return map[char] || char;
    })
    .trim()
    .slice(0, 1000); // Limit length to prevent DoS
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Rate limiting for login attempts
 */
class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number; lockedUntil?: number }> = new Map();

  isBlocked(identifier: string, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      return true;
    }

    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
      // Reset after lockout period
      this.attempts.delete(identifier);
      return false;
    }

    return false;
  }

  recordAttempt(identifier: string, success: boolean, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): void {
    if (success) {
      this.attempts.delete(identifier);
      return;
    }

    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
    record.count++;
    record.lastAttempt = Date.now();

    if (record.count >= config.maxLoginAttempts) {
      record.lockedUntil = Date.now() + config.lockoutDuration;
    }

    this.attempts.set(identifier, record);
  }

  getRemainingAttempts(identifier: string, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): number {
    const record = this.attempts.get(identifier);
    if (!record) return config.maxLoginAttempts;
    
    return Math.max(0, config.maxLoginAttempts - record.count);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Generate a secure session token
 */
export const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate session token format
 */
export const isValidSessionToken = (token: string): boolean => {
  return /^[a-f0-9]{64}$/.test(token);
};