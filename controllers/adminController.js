const db = require('../config/db');
const bcrypt = require('bcrypt');

// Dashboard
exports.getDashboard = async (req, res) => {
    try {
        const [studentCount] = await db.query('SELECT COUNT(*) as count FROM students');
        const today = new Date().toISOString().split('T')[0];
        
        const [presentCount] = await db.query('SELECT COUNT(*) as count FROM attendance WHERE attendance_date = ? AND status = "Present"', [today]);
        const [absentCount] = await db.query('SELECT COUNT(*) as count FROM attendance WHERE attendance_date = ? AND status = "Absent"', [today]);
        const [leaveCount] = await db.query('SELECT COUNT(*) as count FROM attendance WHERE attendance_date = ? AND status = "Leave"', [today]);
        const [totalRecords] = await db.query('SELECT COUNT(*) as count FROM attendance');

        res.render('admin/dashboard', {
            activePage: 'dashboard',
            stats: {
                totalStudents: studentCount[0].count,
                presentToday: presentCount[0].count,
                absentToday: absentCount[0].count,
                leaveToday: leaveCount[0].count,
                totalRecords: totalRecords[0].count
            }
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

// Students List
exports.getStudents = async (req, res) => {
    const search = req.query.search || '';
    const course = req.query.course || '';
    
    let query = 'SELECT * FROM students WHERE 1=1';
    let params = [];
    
    if (search) {
        query += ' AND (full_name LIKE ? OR student_id LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (course) {
        query += ' AND course = ?';
        params.push(course);
    }
    
    try {
        const [students] = await db.query(query, params);
        // Get unique courses for filter
        const [courses] = await db.query('SELECT DISTINCT course FROM students WHERE course IS NOT NULL');
        
        res.render('admin/students', {
            activePage: 'students',
            students,
            courses,
            search,
            selectedCourse: course
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

// Add Student
exports.getAddStudent = (req, res) => {
    res.render('admin/add-student', { activePage: 'students' });
};

exports.postAddStudent = async (req, res) => {
    const { student_id, full_name, email, phone, course, semester, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO students (student_id, full_name, email, phone, course, semester, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [student_id, full_name, email, phone, course, semester, hashedPassword]
        );
        res.redirect('/admin/students');
    } catch (err) {
        console.error(err);
        res.send('Error adding student. ID or Email might already exist.');
    }
};

// Edit Student
exports.getEditStudent = async (req, res) => {
    try {
        const [student] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
        if (student.length === 0) return res.status(404).send('Student not found');
        res.render('admin/edit-student', { activePage: 'students', student: student[0] });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

exports.postEditStudent = async (req, res) => {
    const { student_id, full_name, email, phone, course, semester, status, password } = req.body;
    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE students SET student_id=?, full_name=?, email=?, phone=?, course=?, semester=?, status=?, password=? WHERE id=?',
                [student_id, full_name, email, phone, course, semester, status, hashedPassword, req.params.id]
            );
        } else {
            await db.query(
                'UPDATE students SET student_id=?, full_name=?, email=?, phone=?, course=?, semester=?, status=? WHERE id=?',
                [student_id, full_name, email, phone, course, semester, status, req.params.id]
            );
        }
        res.redirect('/admin/students');
    } catch (err) {
        console.error(err);
        res.send('Error updating student');
    }
};

// Delete Student
exports.postDeleteStudent = async (req, res) => {
    try {
        await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
        res.redirect('/admin/students');
    } catch (err) {
        console.error(err);
        res.send('Error deleting student');
    }
};

// View Student
exports.getViewStudent = async (req, res) => {
    try {
        const [student] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
        if (student.length === 0) return res.status(404).send('Student not found');
        res.render('admin/view-student', { activePage: 'students', student: student[0] });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

// Mark Attendance Page
exports.getMarkAttendance = async (req, res) => {
    const course = req.query.course || '';
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    try {
        const [courses] = await db.query('SELECT DISTINCT course FROM students WHERE course IS NOT NULL');
        let students = [];
        
        if (course) {
            // Get students and their attendance for the selected date
            const [rows] = await db.query(`
                SELECT s.id, s.student_id, s.full_name, a.status as attendance_status 
                FROM students s 
                LEFT JOIN attendance a ON s.id = a.student_id AND a.attendance_date = ? 
                WHERE s.course = ? AND s.status = 'active'
                ORDER BY s.student_id
            `, [date, course]);
            students = rows;
        }
        
        res.render('admin/attendance', {
            activePage: 'attendance',
            courses,
            selectedCourse: course,
            selectedDate: date,
            students
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

// Post Mark Attendance
exports.postMarkAttendance = async (req, res) => {
    const { date, course, attendance } = req.body;
    // attendance is an object like { student_id_1: 'Present', student_id_2: 'Absent' }
    
    try {
        for (const [key, status] of Object.entries(attendance || {})) {
            const studentId = key.replace('student_', '');
            // Upsert attendance
            await db.query(`
                INSERT INTO attendance (student_id, attendance_date, status, marked_by) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)
            `, [studentId, date, status, req.session.user.id]);
        }
        res.redirect(`/admin/attendance?course=${encodeURIComponent(course)}&date=${date}`);
    } catch (err) {
        console.error(err);
        res.send('Error saving attendance');
    }
};

// Attendance Records
exports.getAttendanceRecords = async (req, res) => {
    const date = req.query.date || '';
    const course = req.query.course || '';
    
    let query = `
        SELECT a.id, DATE_FORMAT(a.attendance_date, '%Y-%m-%d') as attendance_date, a.status, s.student_id, s.full_name, s.course, ad.name as marked_by_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN admins ad ON a.marked_by = ad.id
        WHERE 1=1
    `;
    let params = [];
    
    if (date) {
        query += ' AND a.attendance_date = ?';
        params.push(date);
    }
    if (course) {
        query += ' AND s.course = ?';
        params.push(course);
    }
    
    query += ' ORDER BY a.attendance_date DESC, s.student_id ASC';
    
    try {
        const [records] = await db.query(query, params);
        const [courses] = await db.query('SELECT DISTINCT course FROM students WHERE course IS NOT NULL');
        
        res.render('admin/attendance-records', {
            activePage: 'records',
            records,
            courses,
            selectedDate: date,
            selectedCourse: course
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

// Student Report
exports.getStudentReport = async (req, res) => {
    try {
        const [student] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
        if (student.length === 0) return res.status(404).send('Student not found');
        
        const [attendance] = await db.query(`
            SELECT id, DATE_FORMAT(attendance_date, '%Y-%m-%d') as attendance_date, status 
            FROM attendance 
            WHERE student_id = ? 
            ORDER BY attendance_date DESC
        `, [req.params.id]);
        
        const present = attendance.filter(a => a.status === 'Present').length;
        const absent = attendance.filter(a => a.status === 'Absent').length;
        const leave = attendance.filter(a => a.status === 'Leave').length;
        const total = present + absent + leave;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        res.render('admin/student-report', {
            activePage: 'students',
            student: student[0],
            records: attendance,
            stats: { present, absent, leave, total, percentage }
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};
