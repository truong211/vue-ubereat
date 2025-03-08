import * as yup from 'yup';

// Phone regex for international format
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Function to validate password
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!passwordRegex.test(password)) {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
  return true;
};

export const registerSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),

  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),

  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),

  phone: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Please enter a valid phone number'),

  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),

  agreeTerms: yup
    .boolean()
    .oneOf([true], 'You must accept the terms and conditions')
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),

  password: yup
    .string()
    .required('Password is required')
});

export const phoneLoginSchema = yup.object({
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Please enter a valid phone number')
});

export const otpVerificationSchema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'OTP must be 6 digits')
});