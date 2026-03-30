const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const ctrl = require('../../controllers/pamaba/dosenRegistrasiController');

// Public: Dosen mendaftar (no auth needed)
router.post('/daftar', ctrl.uploadBerkas, ctrl.daftar);

// Dosen: get own data by email
router.get('/by-email', auth, ctrl.getByEmail);

// Dosen: update berkas (reupload)
router.put('/berkas/:id', auth, ctrl.uploadBerkas, ctrl.updateBerkas);

// Admin: get pending dosen
router.get('/pending', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), ctrl.getPending);

// Admin: verify dosen
router.put('/verifikasi/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), ctrl.verifikasi);

module.exports = router;
