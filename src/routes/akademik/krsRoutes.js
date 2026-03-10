const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const {
    getAll, getPeriode, createPeriode, aktifkanPeriode,
    deletePeriode, setujui, tolak, setujuiMassal
} = require('../../controllers/akademik/krsController');

router.use(auth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK', 'KAPRODI'));

router.get('/', getAll);
router.get('/periode', getPeriode);
router.post('/periode', createPeriode);
router.put('/periode/:id/aktifkan', aktifkanPeriode);
router.delete('/periode/:id', deletePeriode);
router.put('/:id/setujui', setujui);
router.put('/:id/tolak', tolak);
router.post('/setujui-massal', setujuiMassal);

module.exports = router;