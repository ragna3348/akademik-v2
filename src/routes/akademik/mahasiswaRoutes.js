const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, getById, create, update, naikSemester, remove } = require('../../controllers/akademik/mahasiswaController');

router.use(auth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK', 'KAPRODI'));

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.post('/naik-semester', naikSemester);
router.delete('/:id', remove);

module.exports = router;