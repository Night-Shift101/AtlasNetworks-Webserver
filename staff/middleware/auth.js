const bot = require('./bot');
module.exports.ensureAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    next();
  };
  
module.exports.rolecheck = async (req, res, next) => {
        res.locals.rootAdminMode = req.session.rootAdminMode || false;
        res.locals.isRootAdminUser = false;
        res.locals.isAuthorizedStaff = false;
      
        if (req.isAuthenticated()) {
          try {
            const guild  = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
            const member = await guild.members.fetch(req.user.id);
            const ALLOWED_ROLE_IDS = [
              process.env.TARGET_ROLE_ID,
              process.env.OTHER_ALLOWED_ROLE_ID,
            ];
            // root-admin role
            if (member.roles.cache.has('1344516337388752916')) {
              res.locals.isRootAdminUser = true;
            }
      
            // “authorized” role for full members list
            if (ALLOWED_ROLE_IDS.some(id => member.roles.cache.has(id))) {
              res.locals.isAuthorizedStaff = true;
            }
          } catch (err) {
            console.warn('Error checking staff auth:', err);
          }
        }
      
        next();
      
}