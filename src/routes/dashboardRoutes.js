const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getDashboard } = require('../controllers/dashboardController');

router.use(auth);
router.use(roleCheck('SUPER_ADMIN', 'ADMIN', 'AKADEMIK', 'KEUANGAN', 'KAPRODI', 'PAMABA'));

router.get('/', getDashboard);

module.exports = router;