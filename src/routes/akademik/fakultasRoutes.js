const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, create, update, remove } = require('../../controllers/akademik/fakultasController');

router.get('/', getAll); // publik
router.post('/', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), create);
router.put('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), update);
router.delete('/:id', auth, roleCheck('SUPER_ADMIN'), remove);

module.exports = router;