export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, containing at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  return passwordRegex.test(password)
}

export const validatePhone = (phone: string): boolean => {
  // Allow +, spaces, and dashes in phone numbers with at least 10 digits
  const cleanPhone = phone.replace(/[\s-]/g, '')
  const phoneRegex = /^\+?[\d]{10,}$/
  return phoneRegex.test(cleanPhone)
}

export const validateName = (name: string): boolean => {
  return name.length >= 2 && /^[A-Za-z\s-]+$/.test(name)
}

export const validateAge = (dateOfBirth: string): boolean => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18
  }
  
  return age >= 18
}