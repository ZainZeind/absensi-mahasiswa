const bcrypt = require('bcryptjs');

const password = 'password123';
const hash = bcrypt.hashSync(password, 12);

console.log('Hashed password:', hash);
console.log('');
console.log('SQL to insert user:');
console.log(`INSERT INTO users (username, email, password, role) VALUES ('admin', 'admin@example.com', '${hash}', 'admin');`);