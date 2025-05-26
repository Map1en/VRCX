import { worldRequest } from '../../api';
import { parseLocation } from './location';

async function getWorldName(location) {
    let worldName = '';

    const L = parseLocation(location);
    if (L.isRealInstance && L.worldId) {
        const args = await worldRequest.getCachedWorld({
            worldId: L.worldId
        });
        worldName = args.ref.name;
    }

    return worldName;
}

export { getWorldName };
