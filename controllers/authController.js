const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect(req.session.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    }
    res.render('auth/login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { login_id, password } = req.body;
    
    try {
        // Check Admin
        const [admins] = await db.execute('SELECT * FROM admins WHERE email = ?', [login_id]);
        if (admins.length > 0) {
            const admin = admins[0];
            const match = await bcrypt.compare(password, admin.password);
            if (match) {
                req.session.user = admin;
                req.session.role = 'admin';
                return res.redirect('/admin/dashboard');
            }
        }

        // Check Student (email or student_id)
        const [students] = await db.execute('SELECT * FROM students WHERE email = ? OR student_id = ?', [login_id, login_id]);
        if (students.length > 0) {
            const student = students[0];
            if (student.status !== 'active') {
                return res.render('auth/login', { error: 'Account is inactive. Please contact admin.' });
            }
            const match = await bcrypt.compare(password, student.password);
            if (match) {
                req.session.user = student;
                req.session.role = 'student';
                return res.redirect('/student/dashboard');
            }
        }

        res.render('auth/login', { error: 'Invalid credentials. Please try again.' });
    } catch (error) {
        console.error(error);
        res.render('auth/login', { error: 'An error occurred during login.' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
};
