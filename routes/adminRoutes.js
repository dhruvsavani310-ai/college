const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

router.use(adminAuth);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Students CRUD
router.get('/students', adminController.getStudents);
router.get('/students/add', adminController.getAddStudent);
router.post('/students/add', adminController.postAddStudent);
router.get('/students/edit/:id', adminController.getEditStudent);
router.post('/students/edit/:id', adminController.postEditStudent);
router.post('/students/delete/:id', adminController.postDeleteStudent);
router.get('/students/view/:id', adminController.getViewStudent);

// Attendance
router.get('/attendance', adminController.getMarkAttendance);
router.post('/attendance', adminController.postMarkAttendance);
router.get('/records', adminController.getAttendanceRecords);
router.get('/report/:id', adminController.getStudentReport);

module.exports = router;
