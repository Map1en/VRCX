import { instanceRequest } from '../../api';
import { parseLocation } from './location';

// TODO: launch, invite, refresh, etc. buttons, better to split into one component
function refreshInstancePlayerCount(instance) {
    const L = parseLocation(instance);
    if (L.isRealInstance) {
        instanceRequest.getInstance({
            worldId: L.worldId,
            instanceId: L.instanceId
        });
    }
}

function isRealInstance(instanceId) {
    if (!instanceId) {
        return false;
    }
    switch (instanceId) {
        case ':':
        case 'offline':
        case 'offline:offline':
        case 'private':
        case 'private:private':
        case 'traveling':
        case 'traveling:traveling':
        case instanceId.startsWith('local'):
            return false;
    }
    return true;
}

function getLaunchURL(instance) {
    const L = instance;
    if (L.instanceId) {
        if (L.shortName) {
            return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
                L.worldId
            )}&instanceId=${encodeURIComponent(
                L.instanceId
            )}&shortName=${encodeURIComponent(L.shortName)}`;
        }
        return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
            L.worldId
        )}&instanceId=${encodeURIComponent(L.instanceId)}`;
    }
    return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
        L.worldId
    )}`;
}

export { refreshInstancePlayerCount, isRealInstance, getLaunchURL };
