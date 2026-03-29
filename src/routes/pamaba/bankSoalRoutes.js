const express = require('express');
const router = express.Router();
const controller = require('../../controllers/pamaba/bankSoalController');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), controller.getAll);
router.get('/kategori', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), controller.getKategoriList);
router.get('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), controller.getById);
router.post('/', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), controller.create);
router.put('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), controller.update);
router.delete('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), controller.remove);

module.exports = router;
