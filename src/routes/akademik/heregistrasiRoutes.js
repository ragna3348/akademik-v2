const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, getCalon, proses, prosesMassal, getMahasiswa, pindahProdi } = require('../../controllers/akademik/heregistrasiController');

router.use(auth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN', 'KEUANGAN')); // ← AKADEMIK diganti KEUANGAN

router.get('/', getAll);
router.get('/mahasiswa', getMahasiswa);
router.get('/calon', getCalon);
router.get('/riwayat', getMahasiswa);
router.post('/proses/:pendaftarId', proses);
router.post('/proses-massal', prosesMassal);
router.put('/pindah-prodi/:mahasiswaId', pindahProdi);

module.exports = router;