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

export { userOnlineForTimestamp, languageClass, getNameColour, removeEmojis };
