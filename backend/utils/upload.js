const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '../uploads/kyc'),
  path.join(__dirname, '../uploads/shop'),
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Route shop images to uploads/shop/, everything else to uploads/kyc/
    if (file.fieldname === 'shopImage' || file.fieldname === 'productImage') {
      cb(null, path.join(__dirname, '../uploads/shop'));
    } else {
      cb(null, path.join(__dirname, '../uploads/kyc'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP|pdf)$/)) {
    req.fileValidationError = 'Only image and pdf files are allowed!';
    return cb(new Error('Only image and pdf files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;
