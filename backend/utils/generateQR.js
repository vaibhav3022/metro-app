const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'puneMetroSecretKey2024').digest();
const IV_LENGTH = 16; // AES block size

const encryptQR = (data) => {
  try {
    const text = JSON.stringify(data);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return iv and encrypted content joined by dot
    return `${iv.toString('hex')}.${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

const decryptQR = (encryptedString) => {
  try {
    const parts = encryptedString.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted QR format.');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

module.exports = {
  encryptQR,
  decryptQR
};
