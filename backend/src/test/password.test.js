const bcrypt = require('bcryptjs');
const { hashPassword, verifyPassword } = require('../utils/password.util');

// Test suite for password utilities
async function runTests() {
    console.log('=== Password Utility Test Suite ===\n');

    // Valid password test cases
    const validPasswords = [
        {
            password: 'Password123!',
            desc: 'Standard valid password',
            expectSuccess: true
        },
        {
            password: 'Complex@Pass1234',
            desc: 'Complex password with multiple special chars',
            expectSuccess: true
        },
        {
            password: 'Dev.Test@2024',
            desc: 'Password with dots and @ symbol',
            expectSuccess: true
        }
    ];

    // Invalid password test cases
    const invalidPasswords = [
        {
            password: 'abc123',
            desc: 'Too short',
            expectedError: 'Password must be at least 8 characters long'
        },
        {
            password: 'abcdefgh',
            desc: 'No uppercase',
            expectedError: 'Password must contain at least one uppercase letter'
        },
        {
            password: 'ABCDEFGH',
            desc: 'No lowercase',
            expectedError: 'Password must contain at least one lowercase letter'
        },
        {
            password: 'Abcdefgh',
            desc: 'No numbers',
            expectedError: 'Password must contain at least one number'
        },
        {
            password: 'Abcdef123',
            desc: 'No special chars',
            expectedError: 'Password must contain at least one special character'
        }
    ];

    // Test valid passwords
    console.log('Testing Valid Passwords:\n');
    for (const test of validPasswords) {
        console.log(`Testing: ${test.desc}`);
        try {
            // Test password hashing
            const hash = await hashPassword(test.password);
            console.log('Hash Format:', hash.substring(0, 7));
            console.log('Hash Length:', hash.length);
            
            // Verify password
            const isValid = await verifyPassword(test.password, hash);
            console.log('Verification Result:', isValid);
            
            // Double check with bcrypt directly
            const bcryptResult = await bcrypt.compare(test.password, hash);
            console.log('Direct bcrypt Result:', bcryptResult);
            
            if (isValid && bcryptResult) {
                console.log('✓ Test passed\n');
            } else {
                console.log('✗ Test failed: Verification mismatch\n');
            }
        } catch (error) {
            console.log('✗ Test failed:', error.message, '\n');
        }
        console.log('---\n');
    }

    // Test invalid passwords
    console.log('Testing Invalid Passwords:\n');
    for (const test of invalidPasswords) {
        console.log(`Testing: ${test.desc}`);
        try {
            await hashPassword(test.password);
            console.log('✗ Test failed: Expected validation error\n');
        } catch (error) {
            const passed = error.message === test.expectedError;
            console.log(passed ? '✓ Test passed' : '✗ Test failed');
            console.log('Expected:', test.expectedError);
            console.log('Received:', error.message, '\n');
        }
        console.log('---\n');
    }
}

// Run the test suite
console.log('Starting password validation tests...\n');
runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});