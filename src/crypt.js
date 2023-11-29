const crypto = require('crypto');

// Encrypt
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.cryptoKey, 'hex');
const iv = Buffer.from(process.env.cryptoIv, 'hex');

// create a function that encrypts an sms number
const encryptNum = (phoneNum) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encryptedData = cipher.update(phoneNum, 'utf-8', 'hex');
  encryptedData += cipher.final('hex');
  return encryptedData;
}
// create a function that decrypts an sms number
const decryptNum = (encryptedNum) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decryptedData = decipher.update(encryptedNum, 'hex', 'utf-8');
  decryptedData += decipher.final('utf-8');
  return decryptedData;
}

module.exports = { encryptNum, decryptNum };