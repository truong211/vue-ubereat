const { hashPassword, verifyPassword } = require('../src/utils/password.util');

describe('Password Utils', () => {
  const validPassword = 'TestPass123!';
  const shortPassword = '123';

  // Known working cases for comparison
  const workingEmail = 'abc18@abc.com';
  const workingPassword = 'TestPass123!';

  // Known failing cases for comparison
  const failingEmail = 'abc19@abc.com';
  const failingPassword = 'TestPass123!';

  test('should hash password successfully', async () => {
    const hash = await hashPassword(validPassword);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  test('should reject short passwords', async () => {
    await expect(hashPassword(shortPassword)).rejects.toThrow('Password must be at least 8 characters long');
  });

  test('should reject null/empty passwords', async () => {
    await expect(hashPassword(null)).rejects.toThrow('No password provided for hashing');
    await expect(hashPassword('')).rejects.toThrow('Password must be at least 8 characters long');
  });

  test('should verify correct password', async () => {
    const hash = await hashPassword(validPassword);
    const isValid = await verifyPassword(validPassword, hash);
    expect(isValid).toBe(true);
  });

  test('should reject incorrect password', async () => {
    const hash = await hashPassword(validPassword);
    const isValid = await verifyPassword('WrongPassword123!', hash);
    expect(isValid).toBe(false);
  });

  test('should handle verification with invalid hash', async () => {
    const isValid = await verifyPassword(validPassword, 'invalid-hash');
    expect(isValid).toBe(false);
  });

  // New tests to compare working vs failing cases
  test('should analyze working vs failing password cases', async () => {
    // Test working case
    console.log('\n[Test] Testing working case:', workingEmail);
    const workingHash = await hashPassword(workingPassword);
    const workingValid = await verifyPassword(workingPassword, workingHash);
    expect(workingValid).toBe(true);

    // Test failing case
    console.log('\n[Test] Testing failing case:', failingEmail);
    const failingHash = await hashPassword(failingPassword);
    const failingValid = await verifyPassword(failingPassword, failingHash);
    expect(failingValid).toBe(true);

    // Compare hashes
    console.log('\n[Test] Hash Comparison:');
    console.log('Working hash length:', workingHash.length);
    console.log('Failing hash length:', failingHash.length);
    console.log('Working hash:', workingHash);
    console.log('Failing hash:', failingHash);
  });

  // Test whitespace handling
  test('should handle passwords with whitespace consistently', async () => {
    const passwordWithSpace = ' TestPass123! ';
    const hash = await hashPassword(passwordWithSpace);
    
    // Test exact password
    const exactValid = await verifyPassword(passwordWithSpace, hash);
    console.log('\n[Test] Password with whitespace - exact match:', exactValid);
    
    // Test trimmed password
    const trimmedValid = await verifyPassword(passwordWithSpace.trim(), hash);
    console.log('[Test] Password with whitespace - trimmed match:', trimmedValid);
    
    expect(exactValid).toBe(true);
  });
});