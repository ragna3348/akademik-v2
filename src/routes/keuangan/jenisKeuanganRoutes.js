const express = require('express');
const router = express.Router();
const controller = require('../../controllers/keuangan/jenisKeuanganController');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'KEUANGAN'), controller.getAll);
router.get('/aktif', auth, controller.getAktif);
router.post('/', auth, roleCheck('SUPER_ADMIN'), controller.create);
router.put('/:id', auth, roleCheck('SUPER_ADMIN'), controller.update);
router.patch('/:id/toggle', auth, roleCheck('SUPER_ADMIN'), controller.toggleAktif);
router.delete('/:id', auth, roleCheck('SUPER_ADMIN'), controller.remove);

module.exports = router;
