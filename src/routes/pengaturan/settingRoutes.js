const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, update, uploadLogo } = require('../../controllers/pengaturan/settingController');

// Storage logo
const logoDir = path.join(__dirname, '../../../public/uploads/logo');
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, logoDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `logo-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak didukung!'));
        }
    }
});

router.use(auth);
router.use(roleCheck('SUPER_ADMIN'));

router.get('/', getAll);
router.put('/', update);
router.post('/upload-logo', upload.single('logo'), uploadLogo);

module.exports = router;