const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, getAktif, create, update, toggleAktif, remove } = require('../../controllers/akademik/jenisKelasController');

router.get('/', getAll);
router.get('/aktif', getAktif); // publik, untuk form pendaftaran
router.post('/', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), create);
router.put('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), update);
router.patch('/:id/toggle', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), toggleAktif);
router.delete('/:id', auth, roleCheck('SUPER_ADMIN'), remove);

module.exports = router;