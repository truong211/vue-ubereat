const bcrypt = require('bcrypt');

const password = '123456aA@';
const saltRounds = 12; // Match the application's implementation

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Generated bcrypt hash:', hash);
    
    console.log('\nCopy and run this SQL statement in your database:');
    console.log(`
INSERT INTO users (
  username, 
  email, 
  password, 
  fullName, 
  role, 
  isActive, 
  isEmailVerified,
  createdAt,
  updatedAt
) VALUES (
  'admin2', 
  'admin2@fooddelivery.com', 
  '${hash}', 
  'Second Administrator', 
  'admin', 
  TRUE, 
  TRUE,
  NOW(),
  NOW()
);
    `);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash(); 