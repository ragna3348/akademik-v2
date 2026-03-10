const express = require('express');
const router = express.Router();
const { kirimKodeOTP, verifikasiOTP, kirimUlangOTP } = require('../../controllers/auth/otpController');

router.post('/kirim', kirimKodeOTP);
router.post('/verifikasi', verifikasiOTP);
router.post('/kirim-ulang', kirimUlangOTP);

module.exports = router;