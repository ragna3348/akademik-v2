const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
    getByPendaftar, konfirmasi
} = require('../../controllers/pamaba/pembayaranMabaController');

router.get('/pendaftar/:pendaftarId', auth, getByPendaftar);
router.patch('/:id/konfirmasi', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA', 'KEUANGAN'), konfirmasi);

module.exports = router;