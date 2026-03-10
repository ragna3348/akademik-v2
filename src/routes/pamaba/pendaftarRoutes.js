const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const upload = require('../../middleware/upload');
const { getAll, getById, create, updateStatus, getDashboardStats } = require('../../controllers/pamaba/pendaftarController');

router.get('/stats', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA', 'AKADEMIK'), getDashboardStats);
router.get('/', auth, getAll);
router.get('/by-email', auth, async (req, res) => {
    try {
        const { email } = req.query;
        const data = await prisma.pendaftar.findFirst({
            where: { email },
            select: { noPendaftaran: true, status: true }
        });
        if (!data) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});
router.get('/:id', auth, getById);

// Upload fields untuk pendaftaran
const uploadFields = upload.fields([
    { name: 'foto', maxCount: 1 },
    { name: 'dokumenKTP', maxCount: 1 },
    { name: 'dokumenKK', maxCount: 1 },
    { name: 'dokumenIjazah', maxCount: 1 }
]);

router.post('/', uploadFields, create); // PUBLIC
router.patch('/:id/status', auth, roleCheck('SUPER_ADMIN', 'ADMIN', 'PAMABA'), updateStatus);

module.exports = router;