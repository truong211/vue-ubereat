const bcrypt = require('bcrypt');

async function main() {
  try {
    const password = '123456aA@';
    const hash = await bcrypt.hash(password, 12);
    
    console.log("Password:", password);
    console.log("Hash:", hash);
    console.log("\n----- SQL STATEMENT -----");
    console.log("INSERT INTO users (username, email, password, fullName, role, isActive, isEmailVerified, createdAt, updatedAt)");
    console.log(`VALUES ('admin', 'admin@test.com', '${hash}', 'Administrator', 'admin', TRUE, TRUE, NOW(), NOW());`);
    console.log("----- END SQL STATEMENT -----\n");
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 