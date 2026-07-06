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

exports.getAdminRegister = (req, res) => {
    if (req.session.user) {
        if (req.session.role === 'admin') return res.redirect('/admin/dashboard');
        return res.redirect('/student/dashboard');
    }
    res.render('auth/admin-register', { error: null });
};

exports.postAdminRegister = async (req, res) => {
    const { name, email, password, secret_key } = req.body;
    
    try {
        // Simple security check so students can't register as admins
        if (secret_key !== 'COLLEGE2026') {
            return res.render('auth/admin-register', { error: 'Invalid Secret Registration Key!' });
        }

        // Check if email already exists
        const [existing] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.render('auth/admin-register', { error: 'An admin with this email already exists!' });
        }

        // Hash password and save
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Automatically log them in after registration
        const [newAdmin] = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
        req.session.user = newAdmin[0];
        req.session.role = 'admin';
        res.redirect('/admin/dashboard');
        
    } catch (error) {
        console.error(error);
        res.render('auth/admin-register', { error: 'An error occurred during registration.' });
    }
};
