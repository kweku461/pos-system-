const bcrypt = require("bcrypt");

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);

  console.log("Hashed password:");
  console.log(hash);
}

// Usage: node hash.js <password>
const password = process.argv[2];
if (!password) {
  console.log("Usage: node hash.js <password>");
  process.exit(1);
}
generateHash(password);
