const express = require('express');
const router = express.Router();
const controller = require('../../controllers/akademik/jenisMahasiswaController');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

router.get('/', controller.getAll);
router.get('/aktif', controller.getAktif);
router.post('/', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), controller.create);
router.put('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), controller.update);
router.patch('/:id/toggle', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), controller.toggleAktif);
router.delete('/:id', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK'), controller.remove);

module.exports = router;
