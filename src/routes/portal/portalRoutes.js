const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const upload = require('../../middleware/upload');
const {
    getProfil, updateProfil, gantiPassword,
    getDashboard, getKRS, ajukanKRS, getJadwal, getKeuangan
} = require('../../controllers/portal/portalController');

router.use(auth);
router.use(roleCheck('MAHASISWA'));

router.get('/dashboard', getDashboard);
router.get('/profil', getProfil);
router.put('/profil', upload.single('foto'), updateProfil);
router.put('/ganti-password', gantiPassword);
router.get('/krs', getKRS);
router.post('/krs', ajukanKRS);
router.get('/jadwal', getJadwal);
router.get('/keuangan', getKeuangan);

module.exports = router;