const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, create, update, remove } = require('../../controllers/akademik/prodiController');

// GET publik, tidak perlu auth
router.get('/', getAll);

// Yang lain butuh auth dulu, BARU roleCheck
router.post('/', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), create);
router.put('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), update);
router.delete('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN'), remove);

module.exports = router;