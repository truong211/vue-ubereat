// Find user by primary key (id)
findByPk: async (id) => {
  const sql = 'SELECT * FROM users WHERE id = ?';
  const results = await query(sql, [id]);
  
  if (results.length === 0) return null;
  
  // Remove sensitive data but keep essential profile fields
  const { 
    password, 
    socialToken, 
    verificationToken, 
    resetPasswordToken, 
    emailVerificationOtp, 
    phoneVerificationOtp, 
    resetPasswordOtp, 
    ...safeUser 
  } = results[0];

  // Ensure required fields have default values
  return {
    ...safeUser,
    fullName: safeUser.fullName || safeUser.name || '',
    email: safeUser.email || '',
    phone: safeUser.phone || '',
    address: safeUser.address || '',
    role: safeUser.role || 'customer',
    status: safeUser.status || 'active'
  };
}