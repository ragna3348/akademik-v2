const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, create, update, remove } = require('../../controllers/akademik/jadwalController');

router.use(auth);

router.get('/', roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK', 'KAPRODI', 'DOSEN'), getAll);

router.post('/', roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), create);
router.put('/:id', roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), update);
router.delete('/:id', roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), remove);

module.exports = router;