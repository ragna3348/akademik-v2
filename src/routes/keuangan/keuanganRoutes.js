const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, create, createMassal, update, bayar, bayarMassal, remove } = require('../../controllers/keuangan/keuanganController');

router.use(auth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN', 'KEUANGAN'));

router.get('/', getAll);
router.post('/', create);
router.post('/massal', createMassal);
router.put('/:id', update);
router.patch('/:id/bayar', bayar);
router.post('/bayar-massal', bayarMassal);
router.delete('/:id', remove);

module.exports = router;