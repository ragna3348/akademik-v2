const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getByPendaftar, konfirmasi, uploadBukti } = require('../../controllers/pamaba/pembayaranMabaController');
const upload = require('../../middleware/upload');

const uploadFields = upload.fields([{ name: 'buktiBayar', maxCount: 1 }]);

router.get('/pendaftar/:pendaftarId', auth, getByPendaftar);
router.patch('/:id/konfirmasi', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA', 'KEUANGAN'), konfirmasi);
router.post('/:id/upload-bukti', auth, roleCheck('PENDAFTAR'), uploadFields, uploadBukti);

module.exports = router;