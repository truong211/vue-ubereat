const express = require('express');
const router = express.Router();
const { hashPassword, verifyPassword } = require('../src/utils/password.util');
const db = require('../models'); // Add database access

// Test route for password validation
router.post('/test-password', async (req, res) => {
    try {
        const { password, storedHash } = req.body;
        
        console.log('\n[Password Test] Starting password test');
        console.log('----------------------------------------');
        
        // Test new password hashing
        const hashedPassword = await hashPassword(password);
        console.log('[Password Test] New hash generated:', hashedPassword);
        
        // If a stored hash was provided, test against it
        if (storedHash) {
            console.log('\n[Password Test] Testing against stored hash');
            console.log('[Password Test] Stored hash:', storedHash);
            const isValidStored = await verifyPassword(password, storedHash);
            console.log('[Password Test] Stored hash verification:', isValidStored);
            
            // Compare the hashes
            console.log('\n[Password Test] Hash comparison:');
            console.log('New hash length:', hashedPassword.length);
            console.log('Stored hash length:', storedHash.length);
            console.log('Hashes match:', hashedPassword === storedHash);
        }
        
        // Always verify the newly generated hash
        const isValidNew = await verifyPassword(password, hashedPassword);
        console.log('\n[Password Test] New hash verification:', isValidNew);
        
        res.json({
            success: true,
            newHash: hashedPassword,
            newHashValid: isValidNew,
            storedHashValid: storedHash ? await verifyPassword(password, storedHash) : null,
            passwordLength: password.length,
            newHashLength: hashedPassword.length,
            storedHashLength: storedHash ? storedHash.length : null
        });
    } catch (error) {
        console.error('[Password Test] Error:', error.message);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Diagnostic route for comparing stored vs new hashes
router.post('/diagnose-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('\n[Password Diagnosis] Starting diagnosis for email:', email);
        console.log('----------------------------------------');

        // 1. Get user from database
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        // 2. Get stored hash
        const storedHash = user.password;
        console.log('\n[Stored Password]');
        console.log('Length:', storedHash.length);
        console.log('Hash:', storedHash);

        // 3. Generate new hash
        const newHash = await hashPassword(password);
        console.log('\n[New Password]');
        console.log('Length:', newHash.length);
        console.log('Hash:', newHash);

        // 4. Verify both ways
        const storedVerify = await verifyPassword(password, storedHash);
        const newVerify = await verifyPassword(password, newHash);

        // 5. Check if password was trimmed
        const trimmedPassword = password.trim();
        const trimmedVerify = await verifyPassword(trimmedPassword, storedHash);

        res.json({
            success: true,
            diagnosis: {
                email,
                passwordLength: password.length,
                storedHashLength: storedHash.length,
                newHashLength: newHash.length,
                storedVerification: storedVerify,
                newVerification: newVerify,
                trimmedVerification: trimmedVerify,
                hashesMatch: storedHash === newHash,
                whitespaceDetected: password.length !== trimmedPassword.length
            }
        });

    } catch (error) {
        console.error('[Password Diagnosis] Error:', error.message);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;