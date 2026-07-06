module.exports = (req, res, next) => {
    if (req.session.user && req.session.role === 'student') {
        next();
    } else {
        res.redirect('/auth/login');
    }
};
