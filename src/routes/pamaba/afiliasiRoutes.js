const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
    getAll, getById, create, update,
    toggleStatus, regenerateKode, remove, cekKode
} = require('../../controllers/pamaba/afiliasiController');

// Public — untuk cek kode saat pendaftaran
router.get('/cek/:kode', cekKode);

// Protected
router.use(auth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'));

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/toggle-status', toggleStatus);
router.patch('/:id/regenerate-kode', regenerateKode);
router.delete('/:id', remove);

module.exports = router;