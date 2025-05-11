import { languageMappings } from '../constants';

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

export { userOnlineForTimestamp, languageClass };
