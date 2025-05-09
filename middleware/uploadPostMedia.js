const multer = require('multer');
const path = require('path');

// Storage for post images/videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/posts'); // Separate folder for post media
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const uploadPostMedia = multer({ storage });

module.exports = uploadPostMedia;
