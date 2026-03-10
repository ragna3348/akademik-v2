const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads';
        if (file.fieldname === 'foto') folder = 'uploads/foto';
        else if (file.fieldname === 'dokumenKTP') folder = 'uploads/ktp';
        else if (file.fieldname === 'dokumenKK') folder = 'uploads/kk';
        else if (file.fieldname === 'dokumenIjazah') folder = 'uploads/ijazah';
        createDir(folder);
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedImage = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedAll = [...allowedImage, 'application/pdf'];

    // Foto hanya boleh gambar
    if (file.fieldname === 'foto') {
        if (allowedImage.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format foto harus JPG atau PNG!'), false);
        }
    } else {
        // Dokumen boleh gambar atau PDF
        if (allowedAll.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format file harus JPG, PNG, atau PDF!'), false);
        }
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;