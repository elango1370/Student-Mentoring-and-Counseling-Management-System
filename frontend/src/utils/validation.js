export const required = (value, label = 'This field') => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {
    return `${label} is required`;
  }

  return '';
};

export const isEmail = (value) => {
  if (!value) return 'Email is required';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Enter a valid email address';
  }

  return '';
};

export const minLength = (value, n, label = 'This field') => {
  if (!value || String(value).trim().length < n) {
    return `${label} must be at least ${n} characters`;
  }

  return '';
};

export const isStrongPassword = (value) => {
  if (!value) return 'Password is required';

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(value))) {
    return 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number';
  }

  return '';
};

export const passwordsMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return '';
};

export const inRange = (value, min, max, label = 'Value') => {
  const n = Number(value);

  if (
    value === '' ||
    value === null ||
    value === undefined ||
    Number.isNaN(n)
  ) {
    return `${label} is required`;
  }

  if (n < min || n > max) {
    return `${label} must be between ${min} and ${max}`;
  }

  return '';
};

export const nonNegative = (value, label = 'Value') => {
  const n = Number(value);

  if (value === '' || Number.isNaN(n)) {
    return `${label} is required`;
  }

  if (n < 0) {
    return `${label} cannot be negative`;
  }

  return '';
};

export const isPhone = (value) => {
  if (!value) return '';

  if (!/^[0-9+\-\s()]{6,18}$/.test(value)) {
    return 'Enter a valid phone number';
  }

  return '';
};

export const runValidators = (rules) => {
  const errors = {};

  Object.entries(rules).forEach(([field, message]) => {
    if (message) {
      errors[field] = message;
    }
  });

  return errors;
};

export const mergeServerErrors = (errors, details) => {
  if (!Array.isArray(details)) return errors;

  const next = { ...errors };

  details.forEach((d) => {
    if (d.field) {
      next[d.field] = d.message;
    }
  });

  return next;
};