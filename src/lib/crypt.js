require('dotenv').config();
const crypto = require('crypto');

// Krypterings- og dekrypteringsalgoritme, nøgle og iv
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.cryptoKey, 'hex');
const iv = Buffer.from(process.env.cryptoIv, 'hex');

// krypterer et telefonnummer med cipher, nøgle og iv
const encryptNum = (customer_phone) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedData = cipher.update(customer_phone, 'utf-8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}
// dekrypterer et telefonnummer med decipher, nøgle og iv
const decryptNum = (encryptedNum) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decryptedData = decipher.update(encryptedNum, 'hex', 'utf-8');
  decryptedData += decipher.final('utf-8');
  return decryptedData;
}

module.exports = { encryptNum, decryptNum };