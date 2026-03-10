const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
    getAll, getById, create, update, toggleAktif, remove
} = require('../../controllers/pamaba/gelombangController');

router.get('/', getAll); // publik - untuk form pendaftaran
router.get('/:id', getById);
router.post('/', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), create);
router.put('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), update);
router.patch('/:id/toggle', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), toggleAktif);
router.delete('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), remove);

module.exports = router;