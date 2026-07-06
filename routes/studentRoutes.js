const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const studentAuth = require('../middleware/studentAuth');

router.use(studentAuth);

router.get('/dashboard', studentController.getDashboard);
router.get('/attendance', studentController.getAttendance);
router.get('/profile', studentController.getProfile);

module.exports = router;
