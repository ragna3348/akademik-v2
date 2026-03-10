const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { register, login, getProfile, cekStatus } = require('../../controllers/auth/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.get('/cek-status', auth, cekStatus);

module.exports = router;