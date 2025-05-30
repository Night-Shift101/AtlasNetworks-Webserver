const express = require('express');
const { staffRolesOrder, staffToCategoryRole, categoryRoles, subDepartments, multiGuildCategoryMap } = require('../middleware/maps');
const { ensureAuth } = require('../middleware/auth');
const router = express.Router();
const bot = require('../middleware/bot');

// GET profile
router.get('/profile/:userId', ensureAuth, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    const { userId } = req.params;

    const guild = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
    const requester = await guild.members.fetch(req.user.id);
    const mbr = await guild.members.fetch(userId);

    const requesterRankIndex = staffRolesOrder.findIndex(sr =>
        requester.roles.cache.has(sr.id)
    );

    const highestStaff = staffRolesOrder.find(sr => mbr.roles.cache.has(sr.id));
    const highestIndex = staffRolesOrder.indexOf(highestStaff);
    const roles = staffRolesOrder.filter(sr => mbr.roles.cache.has(sr.id)).map(sr => sr.id);
    const categories = Array.from(new Set(roles.map(rid => staffToCategoryRole[rid]).filter(Boolean)));
    const editable = highestIndex > requesterRankIndex;
    const enrichedSubs = [];
    for (const sd of subDepartments) {
        const enrichedRoles = [];
        for (const { guildId, roleId } of sd.roles) {
            try {
                const g = await bot.guilds.fetch(guildId);
                // fetch the Role object (from cache or API)
                const roleObj = await g.roles.fetch(roleId);
                const hasRole = mbr.roles.cache.has(roleId);
                enrichedRoles.push({
                    id: roleId,
                    name: roleObj ? roleObj.name : `Unknown (${roleId})`,
                    has: hasRole
                });
            } catch {
                enrichedRoles.push({
                    id: roleId,
                    name: `Error fetching`,
                    has: mbr.roles.cache.has(roleId)
                });
            }
        }
        enrichedSubs.push({
            name: sd.name,
            abbreviation: sd.abbreviation,
            roles: enrichedRoles
        });
    }
    // at end of GET /members/profile/:userId handler, change render:
    return res.render('profile', {
        user: req.user,
        member: {
            id: mbr.user.id,
            username: mbr.user.username,
            discriminator: mbr.user.discriminator,
            highestRole: highestStaff?.name || '—',
            roles,
            categories,
            editable
        },
        staffRolesOrder,
        categoryRoles,
        subDepartments: enrichedSubs,
        errorMsg: req.query.error || null,
        requesterRankIndex
    });
});

// POST update roles
router.post('/profile/:userId/roles', ensureAuth, async (req, res) => {
    const { userId } = req.params;
    if (!req.isAuthenticated()) return res.redirect('/');
    const bypass = req.body.bypassRootChecks === '1';

    try {

        const guild = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
        const requester = await guild.members.fetch(req.user.id);
        const member = await guild.members.fetch(userId);

        // build selected array
        let selected = req.body.roles || [];
        if (!Array.isArray(selected)) selected = [selected];

        // all staff role IDs
        const allStaffIds = staffRolesOrder.map(sr => sr.id);

        // which ones to add
        const rawAdd = selected
            .filter(r => allStaffIds.includes(r) && !member.roles.cache.has(r));

        // which ones to remove
        const rawRemove = allStaffIds
            .filter(r => !selected.includes(r) && member.roles.cache.has(r));

        // now honor bypass OR rank‐based permission
        const toAdd = rawAdd.filter(r =>
            bypass || staffRolesOrder.findIndex(sr => sr.id === r) > requesterRankIndex
        );
        const toRemove = rawRemove.filter(r =>
            bypass || staffRolesOrder.findIndex(sr => sr.id === r) > requesterRankIndex
        );

        console.log('Adding:', toAdd, 'Removing:', toRemove, 'bypass:', bypass);

        // apply changes
        if (toAdd.length) await member.roles.add(toAdd);
        if (toRemove.length) await member.roles.remove(toRemove);

        // Sync main guild categories
        for (const { id: catId } of categoryRoles) {
            if (member.roles.cache.has(catId)) {
                await member.roles.remove(catId);
            }
        }
        const newCategories = Array.from(new Set(
            selected.map(sid => staffToCategoryRole[sid]).filter(Boolean)
        ));
        if (newCategories.length) {
            await member.roles.add(newCategories);
        }
        const multiGuildErrors = [];
        for (const [catId, mappings] of Object.entries(multiGuildCategoryMap)) {
            const shouldHave = newCategories.includes(catId);
            for (const { guildId, roleId } of mappings) {
                try {
                    const g = await bot.guilds.fetch(guildId);
                    const m = await g.members.fetch(userId);
                    if (shouldHave) {
                        if (!m.roles.cache.has(roleId)) await m.roles.add(roleId);
                    } else {
                        if (m.roles.cache.has(roleId)) await m.roles.remove(roleId);
                    }
                } catch (err) {
                    // store the human‐readable message
                    multiGuildErrors.push(`Guild ${guildId}: ${err.message}`);
                }
            }
        }

        // 2. If there were errors, redirect with them in the query
        if (multiGuildErrors.length) {
            // join with | as a delimiter and URI-encode
            const msg = encodeURIComponent(multiGuildErrors.join(' | '));
            return res.redirect(`/members/profile/${userId}?error=${msg}`);
        }

        // 3. No errors at all, normal redirect
        return res.redirect(`/members/profile/${userId}`);
    } catch (err) {
        console.error('Error updating staff roles:', err);
        const msg = encodeURIComponent(err.message);
        return res.redirect(`/members/profile/${userId}?error=${msg}`);
    }
});

// POST update subdepartments
router.post('/profile/:userId/subdepartments', ensureAuth, async (req, res) => {
    const { userId } = req.params;
    if (!req.isAuthenticated()) return res.redirect('/');

    try {

        // Fetch guild + member
        const guild = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
        const member = await guild.members.fetch(userId);

        // For each sub-department, sync only its roles
        for (const sd of subDepartments) {
            // normalize incoming array
            let field = req.body[`subroles-${sd.abbreviation}`] || [];
            if (!Array.isArray(field)) field = [field];

            // determine adds/removes
            const hasCache = member.roles.cache;
            const toAdd = field.filter(rid => !hasCache.has(rid));
            const toRemove = sd.roles
                .map(r => r.roleId)
                .filter(rid => !field.includes(rid) && hasCache.has(rid));

            if (toAdd.length) await member.roles.add(toAdd);
            if (toRemove.length) await member.roles.remove(toRemove);
        }

        return res.redirect(`/members/profile/${userId}`);
    } catch (err) {
        console.error('Error updating sub‐departments:', err);
        const msg = encodeURIComponent(err.message);
        return res.redirect(`/members/profile/${userId}?error=${msg}`);
    }
});

// POST remove-all-staff
router.post('/profile/:userId/remove-all-staff', ensureAuth, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');

    const { userId } = req.params;

    try {
        // 1) Remove all staff roles in main guild
        const mainGuild = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
        const mainMember = await mainGuild.members.fetch(userId);
        for (const { id: roleId } of staffRolesOrder) {
            if (mainMember.roles.cache.has(roleId)) {
                await mainMember.roles.remove(roleId);
            }
        }

        // 2) Remove all sub-department roles in main guild
        for (const sd of subDepartments) {
            for (const { roleId } of sd.roles) {
                if (mainMember.roles.cache.has(roleId)) {
                    await mainMember.roles.remove(roleId);
                }
            }
        }

        // 3) Remove category roles in main guild
        for (const { id: catId } of categoryRoles) {
            if (mainMember.roles.cache.has(catId)) {
                await mainMember.roles.remove(catId);
            }
        }

        // 4) Propagate removals across other guilds
        for (const [catId, mappings] of Object.entries(multiGuildCategoryMap)) {
            for (const { guildId, roleId } of mappings) {
                try {
                    const g = await bot.guilds.fetch(guildId);
                    const m = await g.members.fetch(userId);
                    if (m.roles.cache.has(roleId)) {
                        await m.roles.remove(roleId);
                    }
                } catch (e) {
                    console.warn(`Failed to remove ${roleId} in guild ${guildId}:`, e);
                }
            }
        }

        res.redirect(`/members/profile/${userId}`);
    } catch (err) {
        console.error('Error in remove-all-staff:', err);
        res.redirect(
            `/members/profile/${userId}?error=${encodeURIComponent('Failed to remove roles')}`
        );
    }

});

// POST remove single subdept
router.post('/profile/:userId/subdepartments/remove/:abbrev', ensureAuth, async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/');

    const { userId, abbrev } = req.params;
    console.log('[DEBUG] remove-subdept hit for', userId, 'abbrev=', abbrev);

    const targetSD = subDepartments.find(sd => sd.abbreviation === abbrev);
    if (!targetSD) {
        console.error('[ERROR] no sub-dept config for', abbrev);
        return res.redirect(`/members/profile/${userId}?error=Unknown+subdepartment`);
    }

    try {
        const guild = await bot.guilds.fetch(process.env.TARGET_GUILD_ID);
        const mbr = await guild.members.fetch(userId);

        for (const { roleId } of targetSD.roles) {
            if (mbr.roles.cache.has(roleId)) {
                console.log(` → removing ${roleId}`);
                await mbr.roles.remove(roleId);
            }
        }

        res.redirect(`/members/profile/${userId}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/members/profile/${userId}?error=Removal+failed`);
    }
});

module.exports = router;
