const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, create, update, remove } = require('../../controllers/akademik/mataKuliahController'); // ← hapus getById

router.use(auth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK', 'KAPRODI', 'DOSEN'));

router.get('/', getAll);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;