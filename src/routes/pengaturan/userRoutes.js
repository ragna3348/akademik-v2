const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');
const { getAll, getById, create, update, toggleStatus, resetPassword, remove } = require('../../controllers/pengaturan/userController');

router.use(auth);
router.use(roleCheck('SUPER_ADMIN'));

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/toggle-status', toggleStatus);
router.patch('/:id/reset-password', resetPassword);
router.delete('/:id', remove);

module.exports = router;