const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

// Admin Registration
router.get('/admin-register', authController.getAdminRegister);
router.post('/admin-register', authController.postAdminRegister);

module.exports = router;
