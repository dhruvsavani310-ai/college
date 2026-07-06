const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.session.user.id;
        
        const [attendance] = await db.query('SELECT * FROM attendance WHERE student_id = ?', [studentId]);
        
        const present = attendance.filter(a => a.status === 'Present').length;
        const absent = attendance.filter(a => a.status === 'Absent').length;
        const leave = attendance.filter(a => a.status === 'Leave').length;
        const total = present + absent + leave;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        
        res.render('student/dashboard', {
            activePage: 'dashboard',
            stats: { present, absent, leave, total, percentage }
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

exports.getAttendance = async (req, res) => {
    try {
        const studentId = req.session.user.id;
        const month = req.query.month || '';
        
        let query = `
            SELECT id, DATE_FORMAT(attendance_date, '%Y-%m-%d') as attendance_date, DAYNAME(attendance_date) as day_name, status 
            FROM attendance 
            WHERE student_id = ?
        `;
        let params = [studentId];
        
        if (month) {
            query += " AND DATE_FORMAT(attendance_date, '%Y-%m') = ?";
            params.push(month);
        }
        
        query += " ORDER BY attendance_date DESC";
        
        const [records] = await db.query(query, params);
        
        res.render('student/attendance', {
            activePage: 'attendance',
            records,
            selectedMonth: month
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};

exports.getProfile = async (req, res) => {
    try {
        const [student] = await db.query('SELECT * FROM students WHERE id = ?', [req.session.user.id]);
        if (student.length === 0) return res.status(404).send('Student not found');
        
        res.render('student/profile', {
            activePage: 'profile',
            student: student[0]
        });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
};
