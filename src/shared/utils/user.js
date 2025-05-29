import { $app } from '../../app';
import API from '../../classes/apiInit';
import { languageMappings } from '../constants';
import { HueToHex } from './base/ui';

function userOnlineForTimestamp(ctx) {
    if (ctx.ref.state === 'online' && ctx.ref.$online_for) {
        return ctx.ref.$online_for;
    } else if (ctx.ref.state === 'active' && ctx.ref.$active_for) {
        return ctx.ref.$active_for;
    } else if (ctx.ref.$offline_for) {
        return ctx.ref.$offline_for;
    }
    return 0;
}

function languageClass(language) {
    const style = {};
    const mapping = languageMappings[language];
    if (typeof mapping !== 'undefined') {
        style[mapping] = true;
    } else {
        style.unknown = true;
    }
    return style;
}

async function getNameColour(userId) {
    const hue = await AppApi.GetColourFromUserID(userId);
    return HueToHex(hue);
}

function removeEmojis(text) {
    if (!text) {
        return '';
    }
    return text
        .replace(
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
            ''
        )
        .replace(/\s+/g, ' ')
        .trim();
}

function userStatusClass(user, pendingOffline) {
    const style = {};
    if (typeof user === 'undefined') {
        return style;
    }
    let id = '';
    if (user.id) {
        id = user.id;
    } else if (user.userId) {
        id = user.userId;
    }
    if (id === API.currentUser.id) {
        return statusClass(user.status);
    }
    if (!user.isFriend) {
        return style;
    }
    if (pendingOffline) {
        // Pending offline
        style.offline = true;
    } else if (
        user.status !== 'active' &&
        user.location === 'private' &&
        user.state === '' &&
        id &&
        !API.currentUser.onlineFriends.includes(id)
    ) {
        // temp fix
        if (API.currentUser.activeFriends.includes(id)) {
            // Active
            style.active = true;
        } else {
            // Offline
            style.offline = true;
        }
    } else if (user.state === 'active') {
        // Active
        style.active = true;
    } else if (user.location === 'offline') {
        // Offline
        style.offline = true;
    } else if (user.status === 'active') {
        // Online
        style.online = true;
    } else if (user.status === 'join me') {
        // Join Me
        style.joinme = true;
    } else if (user.status === 'ask me') {
        // Ask Me
        style.askme = true;
    } else if (user.status === 'busy') {
        // Do Not Disturb
        style.busy = true;
    }
    if (
        user.platform &&
        user.platform !== 'standalonewindows' &&
        user.platform !== 'web'
    ) {
        style.mobile = true;
    }
    if (
        user.last_platform &&
        user.last_platform !== 'standalonewindows' &&
        user.platform === 'web'
    ) {
        style.mobile = true;
    }
    return style;
}

function statusClass(status) {
    const style = {};
    if (typeof status !== 'undefined') {
        if (status === 'active') {
            // Online
            style.online = true;
        } else if (status === 'join me') {
            // Join Me
            style.joinme = true;
        } else if (status === 'ask me') {
            // Ask Me
            style.askme = true;
        } else if (status === 'busy') {
            // Do Not Disturb
            style.busy = true;
        }
    }
    return style;
}

export {
    userOnlineForTimestamp,
    languageClass,
    getNameColour,
    removeEmojis,
    userStatusClass,
    statusClass
};
