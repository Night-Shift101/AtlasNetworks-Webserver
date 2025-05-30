module.exports = function ensureAuth(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    // You can customize the redirect route or send a 401 for APIs
    res.redirect('/login');
  };
  