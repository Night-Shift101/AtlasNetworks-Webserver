const express = require('express');
const router = express.Router();

router.post('/toggle-root-admin', (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');
  
    // only actual Root Admins can toggle it
    if (!res.locals.isRootAdminUser) {
      return res.status(403).send('🚫 Access denied.');
    }
    req.session.rootAdminMode = !req.session.rootAdminMode;
    res.redirect(req.get('Referer') || '/members');
  });
  module.exports = router