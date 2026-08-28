export const validators = {
  required: (msg = 'This field is required') => ({
    required: msg,
  }),

  email: {
    required: 'Email is required',
    pattern: {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Enter a valid email address',
    },
  },

  phone: {
    required: 'Phone number is required',
    pattern: {
      value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{8,14}$/,
      message: 'Enter a valid phone number',
    },
  },

  password: {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      message: 'Must include uppercase, lowercase, number, and special character',
    },
  },

  confirmPassword: (getValues) => ({
    required: 'Please confirm your password',
    validate: (val) => val === getValues('password') || 'Passwords do not match',
  }),

  name: {
    required: 'Name is required',
    minLength: { value: 2,  message: 'Name must be at least 2 characters' },
    maxLength: { value: 60, message: 'Name cannot exceed 60 characters' },
    pattern: {
      value: /^[a-zA-Z\s'-]+$/,
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    },
  },

  licenseNumber: {
    required: 'License number is required',
    pattern: {
      value: /^[A-Z0-9-]{5,20}$/,
      message: 'Enter a valid license number (letters, digits, hyphens, 5–20 chars)',
    },
  },

  url: {
    pattern: {
      value: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
      message: 'Enter a valid URL',
    },
  },

  positiveNumber: {
    min: { value: 0, message: 'Must be a positive number' },
  },

  experience: {
    required: 'Years of experience is required',
    min:      { value: 0,  message: 'Cannot be negative' },
    max:      { value: 60, message: 'Please enter a realistic value' },
  },

  textArea: (min = 10, max = 1000) => ({
    required: 'This field is required',
    minLength: { value: min, message: `Minimum ${min} characters` },
    maxLength: { value: max, message: `Maximum ${max} characters` },
  }),
}

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8)               score++
  if (/[A-Z]/.test(password))             score++
  if (/[a-z]/.test(password))             score++
  if (/[0-9]/.test(password))             score++
  if (/[@$!%*?&#]/.test(password))        score++

  const map = [
    { label: '',         color: '' },
    { label: 'Weak',     color: 'bg-red-500' },
    { label: 'Fair',     color: 'bg-amber-500' },
    { label: 'Good',     color: 'bg-yellow-400' },
    { label: 'Strong',   color: 'bg-primary-500' },
    { label: 'Very strong', color: 'bg-primary-600' },
  ]
  return { score, ...map[score] }
}
