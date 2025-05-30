const express = require('express');
const { staffRolesOrder, subDepartments, staffToCategoryRole, categoryRoles, multiGuildCategoryMap } = require('../middleware/maps');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();
const { Client } = require('discord.js');
const bot = require('../middleware/bot'); // your configured Discord client

// GET /members — decide list vs profile
router.get('/', ensureAuth, async (req, res) => {
    const guild = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
    const me    = await guild.members.fetch(req.user.id);
    const ALLOWED_ROLE_IDS = [
      process.env.TARGET_ROLE_ID,
      process.env.OTHER_ALLOWED_ROLE_ID,
    ];
    const isAuthorized = ALLOWED_ROLE_IDS.some(id => me.roles.cache.has(id));
    const isAnyStaff   = Object
      .keys(staffToCategoryRole)
      .some(rid => me.roles.cache.has(rid));
  
    if (isAuthorized) {
      // full access → list of everyone
      return res.redirect('/members/list');
    } else if (isAnyStaff) {
      // limited access → just your own profile
      return res.redirect(`/members/profile/${me.user.id}`);
    } else {
      // not staff at all
      return res.status(403).send('🚫 Access denied.');
    }
});

// GET /members/list
router.get('/list', ensureAuth, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    const guild     = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
    const requester = await guild.members.fetch(req.user.id);
    const ALLOWED_ROLE_IDS = [
      process.env.TARGET_ROLE_ID,
      process.env.OTHER_ALLOWED_ROLE_ID,
    ];
  
    if (!ALLOWED_ROLE_IDS.some(id => requester.roles.cache.has(id))) {
      return res.status(403).send('🚫 Access denied.');
    }
  
    const requesterRankIndex = staffRolesOrder.findIndex(sr =>
      requester.roles.cache.has(sr.id)
    );
  
    const allMembers = await guild.members.fetch();
    const staffMembers = allMembers
      .filter(m => m.roles.cache.some(r => staffToCategoryRole[r.id]))
      .sort((a, b) => {
        const ia = staffRolesOrder.findIndex(sr => a.roles.cache.has(sr.id));
        const ib = staffRolesOrder.findIndex(sr => b.roles.cache.has(sr.id));
        return ia - ib;
      });
  
    const members = staffMembers.map(m => {
      const highestStaff  = staffRolesOrder.find(sr => m.roles.cache.has(sr.id));
      const highestIndex  = staffRolesOrder.indexOf(highestStaff);
      const roles         = staffRolesOrder.filter(sr => m.roles.cache.has(sr.id)).map(sr => sr.id);
      const categories    = Array.from(new Set(roles.map(rid => staffToCategoryRole[rid]).filter(Boolean)));
      return {
        id:            m.user.id,
        username:      m.user.username,
        discriminator: m.user.discriminator,
        highestRole:   highestStaff?.name || '—',
        roles,
        categories,
        editable:      highestIndex > requesterRankIndex
      };
    });
  
    return res.render('members', {
      user:               req.user,
      members,
      staffRolesOrder,
      requesterRankIndex,
      categoryRoles
    });
});

// GET /members/add-staff
router.post('/add-staff', ensureAuth, async (req, res) => {
    const { userId, rankId } = req.body;
    if (!req.isAuthenticated()) return res.redirect('/');

  try {
    const mainGuild = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
    const mainMember = await mainGuild.members.fetch(userId);

    // 1) Add the chosen staff role in the main guild
    await mainMember.roles.add(rankId);

    // 2) Add its category role in the main guild
    const categoryId = staffToCategoryRole[rankId];
    if (categoryId) {
      await mainMember.roles.add(categoryId);

      // 3) Propagate that category role across all other guilds
      const mappings = multiGuildCategoryMap[categoryId] || [];
      for (const { guildId, roleId } of mappings) {
        const g = await bot.guilds.fetch(guildId);
        const m = await g.members.fetch(userId);
        if (!m.roles.cache.has(roleId)) {
          await m.roles.add(roleId);
        }
      }
    }

    res.redirect('/members');
  } catch (err) {
    console.error('Error in add-staff:', err);
    res.redirect(`/members?error=${encodeURIComponent(err.message)}`);
  }
});

// POST /members/add-staff
router.get('/add-staff', ensureAuth, async (req, res) => {
    if (!res.locals.isAuthorizedStaff && !res.locals.isRootAdminUser) {
        return res.status(403).send('🚫 Access denied.');
      }
    
      try {
        // fetch main guild & requester member
        const mainGuild = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
        const requester = await mainGuild.members.fetch(req.user.id);
    
        // find where the requester sits in the staffRolesOrder
        const requesterRankIndex = staffRolesOrder.findIndex(sr =>
          requester.roles.cache.has(sr.id)
        );
    
        // build the list of ranks they’re allowed to assign:
        // • if in root-admin mode, all ranks
        // • otherwise only those *below* their own (higher index)
        const allowedRanks = (res.locals.rootAdminMode)
          ? staffRolesOrder
          : staffRolesOrder.filter((_, idx) => idx > requesterRankIndex);
    
        // enrich subDepartments with names for display
        const enrichedSubs = [];
        for (const sd of subDepartments) {
          const enrichedRoles = [];
          for (const { guildId, roleId } of sd.roles) {
            try {
              const g = await bot.guilds.fetch(guildId);
              const role = await g.roles.fetch(roleId);
              enrichedRoles.push({
                roleId,
                name: role ? role.name : `Unknown (${roleId})`
              });
            } catch {
              enrichedRoles.push({
                roleId,
                name: `Error loading (${roleId})`
              });
            }
          }
          enrichedSubs.push({
            name:         sd.name,
            abbreviation: sd.abbreviation,
            roles:        enrichedRoles
          });
        }
    
        // render the add-staff page with only allowedRanks
        return res.render('add-staff', {
          user:               req.user,
          staffRolesOrder:    allowedRanks,
          requesterRankIndex, // in case your template needs it
          subDepartments:     enrichedSubs
        });
      } catch (err) {
        console.error('Error loading Add Staff page:', err);
        return res.status(500).send('⚠️ Could not load Add Staff page.');
      }
});

module.exports = router;
