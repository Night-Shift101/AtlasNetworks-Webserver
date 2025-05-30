const ADMINS = process.env.ADMIN_IDS?.split(',') || []; 
// e.g. 

module.exports = function ensureAdmin(req, res, next) {
  if (req.user && ADMINS.includes(req.user.id)) {
    return next();
  }
  res.status(403).send('❌ You do not have permission to perform that action.');
};