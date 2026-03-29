const express = require('express');
const router = express.Router();
const controller = require('../../controllers/pamaba/ujianController');
const auth = require('../../middleware/auth'); // Check standard middleware path

router.get('/soal', auth, controller.getSoalUjian);
router.post('/jawaban', auth, controller.simpanJawaban);
router.post('/akhiri', auth, controller.akhiriUjian);

module.exports = router;
