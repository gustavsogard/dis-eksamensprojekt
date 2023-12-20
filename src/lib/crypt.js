require('dotenv').config();
const crypto = require('crypto');

// Encryption and decryption algorithm, key, and iv
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.cryptoKey, 'hex');
const iv = Buffer.from(process.env.cryptoIv, 'hex');

// encrypts a phone number, with cipher, key, and iv
const encryptNum = (customer_phone) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedData = cipher.update(customer_phone, 'utf-8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}
// decrypts a phone number, with decipher, key, and iv
const decryptNum = (encryptedNum) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decryptedData = decipher.update(encryptedNum, 'hex', 'utf-8');
  decryptedData += decipher.final('utf-8');
  return decryptedData;
}

module.exports = { encryptNum, decryptNum };