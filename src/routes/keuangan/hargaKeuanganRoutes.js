const express = require('express');
const router = express.Router();
const { getAll, getById, create, update, remove } = require('../../controllers/keuangan/hargaController');
const auth = require('../../middleware/auth');
const adminOrKeuangan = require('../../middleware/roleCheck')(['SUPER_ADMIN', 'ADMIN', 'KEUANGAN']);

router.use(auth);

router.get('/', getAll);
router.get('/:id', getById);

router.use(adminOrKeuangan);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
