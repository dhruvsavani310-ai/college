module.exports = (req, res, next) => {
    if (req.session.user && req.session.role === 'admin') {
        next();
    } else {
        res.redirect('/auth/login');
    }
};
