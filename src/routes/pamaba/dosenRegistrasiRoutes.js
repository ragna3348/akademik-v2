const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/auth');
const ctrl = require('../../controllers/pamaba/dosenRegistrasiController');

// Public: Dosen mendaftar (no auth needed)
router.post('/daftar', ctrl.uploadBerkas, ctrl.daftar);

// Dosen: get own data by email
router.get('/by-email', verifyToken, ctrl.getByEmail);

// Dosen: update berkas (reupload)
router.put('/berkas/:id', verifyToken, ctrl.uploadBerkas, ctrl.updateBerkas);

// Admin: get pending dosen
router.get('/pending', verifyToken, requireRole(['SUPER_ADMIN', 'ADMIN']), ctrl.getPending);

// Admin: verify dosen
router.put('/verifikasi/:id', verifyToken, requireRole(['SUPER_ADMIN', 'ADMIN']), ctrl.verifikasi);

module.exports = router;
