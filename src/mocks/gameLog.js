// MOCK RUNTIME ONLY
// Synthetic game log stream for mock mode. Keeps player list and game log alive
// without depending on the real Windows LogWatcher service.

import {
    getMockAvatars,
    getMockCurrentUser,
    getMockFriends,
    getMockInstances,
    getMockWorlds
} from './api';
import { MOCK_LOG_CONFIG } from './config';

const state = {
    bootstrapDelivered: false,
    historyDelivered: false,
    currentLocation: '',
    currentWorldName: '',
    currentWorldIndex: 0,
    nextPlayerIndex: 0,
    nextAvatarIndex: 0,
    nextEventIndex: 0,
    nextPhotonId: 500,
    currentPlayers: new Map(),
    pendingTravelLocation: ''
};

function createDt(offsetMs = 0) {
    return new Date(Date.now() + offsetMs).toISOString();
}

function getFriendsPool() {
    return getMockFriends().filter((friend) => friend.id !== getMockCurrentUser().id);
}

function getWorldPool() {
    return getMockWorlds();
}

function getInstancePool() {
    return getMockInstances();
}

function getNextInstance() {
    const instances = getInstancePool();
    const next =
        instances[state.currentWorldIndex % Math.max(1, instances.length)] ??
        instances[0];
    state.currentWorldIndex += 1;
    return next;
}

function getNextAvailablePlayer() {
    const friends = getFriendsPool();
    if (!friends.length) {
        return null;
    }
    for (let attempt = 0; attempt < friends.length; attempt += 1) {
        const friend =
            friends[(state.nextPlayerIndex + attempt) % friends.length];
        if (!state.currentPlayers.has(friend.id)) {
            state.nextPlayerIndex =
                (state.nextPlayerIndex + attempt + 1) % friends.length;
            return friend;
        }
    }
    return null;
}

function getCurrentPlayersArray() {
    return Array.from(state.currentPlayers.values());
}

function getRemovablePlayer() {
    const players = getCurrentPlayersArray();
    if (!players.length) {
        return null;
    }
    return players[state.nextEventIndex % players.length] ?? players[0];
}

function getNextAvatarName() {
    const avatars = getMockAvatars();
    const avatar = avatars[state.nextAvatarIndex % Math.max(1, avatars.length)];
    state.nextAvatarIndex += 1;
    return avatar?.name || 'Mock Avatar';
}

function pushEntry(target, dt, type, ...args) {
    target.push(['output_log_2026-03-14.txt', dt, type, ...args]);
}

function syncPlayerState(friend, joinedAt) {
    state.currentPlayers.set(friend.id, {
        id: friend.id,
        userId: friend.id,
        displayName: friend.displayName,
        joinedAt,
        avatarName: getNextAvatarName()
    });
}

function clearPlayers() {
    state.currentPlayers.clear();
}

function clampPlayerBounds() {
    if (MOCK_LOG_CONFIG.maxPlayers < MOCK_LOG_CONFIG.minPlayers) {
        MOCK_LOG_CONFIG.maxPlayers = MOCK_LOG_CONFIG.minPlayers;
    }
}

function buildBootstrapEntries() {
    clampPlayerBounds();
    const entries = [];
    const instance = getNextInstance();
    const friends = getFriendsPool();
    const initialCount = Math.min(
        MOCK_LOG_CONFIG.maxPlayers,
        Math.max(MOCK_LOG_CONFIG.minPlayers, 1),
        friends.length
    );

    state.currentLocation = instance?.location || getMockCurrentUser().homeLocation;
    state.currentWorldName = instance?.name || getWorldPool()[0]?.name || 'Mock World';
    clearPlayers();

    pushEntry(
        entries,
        createDt(-2500),
        'location',
        state.currentLocation,
        state.currentWorldName
    );

    for (let i = 0; i < initialCount; i += 1) {
        const friend = friends[i];
        const dt = createDt(-2400 + i * 100);
        syncPlayerState(friend, dt);
        pushEntry(entries, dt, 'player-joined', friend.displayName, friend.id);
        pushEntry(entries, dt, 'photon-id', friend.displayName, String(state.nextPhotonId));
        state.nextPhotonId += 1;
    }

    return entries;
}

function chooseWeightedEvent() {
    const weighted = [
        ['join', MOCK_LOG_CONFIG.joinWeight],
        ['leave', MOCK_LOG_CONFIG.leaveWeight],
        ['avatar', MOCK_LOG_CONFIG.avatarWeight],
        ['portal', MOCK_LOG_CONFIG.portalWeight],
        ['video', MOCK_LOG_CONFIG.videoWeight],
        ['photon', MOCK_LOG_CONFIG.photonWeight],
        ['sticker', MOCK_LOG_CONFIG.stickerWeight],
        ['travel', MOCK_LOG_CONFIG.travelWeight]
    ].filter(([, weight]) => weight > 0);

    if (!weighted.length) {
        return 'join';
    }

    const total = weighted.reduce((sum, [, weight]) => sum + weight, 0);
    let cursor = state.nextEventIndex % total;
    state.nextEventIndex += 1;
    for (const [type, weight] of weighted) {
        if (cursor < weight) {
            return type;
        }
        cursor -= weight;
    }
    return weighted[0][0];
}

function createJoinEntries(batch) {
    if (state.currentPlayers.size >= MOCK_LOG_CONFIG.maxPlayers) {
        return false;
    }
    const friend = getNextAvailablePlayer();
    if (!friend) {
        return false;
    }
    const dt = createDt();
    syncPlayerState(friend, dt);
    pushEntry(batch, dt, 'player-joined', friend.displayName, friend.id);
    pushEntry(batch, dt, 'photon-id', friend.displayName, String(state.nextPhotonId));
    state.nextPhotonId += 1;
    return true;
}

function createLeaveEntries(batch) {
    if (state.currentPlayers.size <= MOCK_LOG_CONFIG.minPlayers) {
        return false;
    }
    const player = getRemovablePlayer();
    if (!player) {
        return false;
    }
    const dt = createDt();
    state.currentPlayers.delete(player.id);
    pushEntry(batch, dt, 'player-left', player.displayName, player.id);
    return true;
}

function createAvatarEntries(batch) {
    const player = getRemovablePlayer();
    if (!player) {
        return false;
    }
    const dt = createDt();
    player.avatarName = getNextAvatarName();
    pushEntry(batch, dt, 'avatar-change', player.displayName, player.avatarName);
    return true;
}

function createPortalEntries(batch) {
    if (!state.currentLocation) {
        return false;
    }
    pushEntry(batch, createDt(), 'portal-spawn');
    return true;
}

function createVideoEntries(batch) {
    const player = getRemovablePlayer();
    if (!player) {
        return false;
    }
    const url = `https://www.youtube.com/watch?v=mock${String(
        state.nextEventIndex
    ).padStart(6, '0')}`;
    pushEntry(batch, createDt(), 'video-play', url, player.displayName);
    return true;
}

function createPhotonEntries(batch) {
    const player = getRemovablePlayer();
    if (!player) {
        return false;
    }
    pushEntry(
        batch,
        createDt(),
        'photon-id',
        player.displayName,
        String(state.nextPhotonId)
    );
    state.nextPhotonId += 1;
    return true;
}

function createStickerEntries(batch) {
    const player = getRemovablePlayer();
    if (!player) {
        return false;
    }
    pushEntry(
        batch,
        createDt(),
        'sticker-spawn',
        player.id,
        player.displayName,
        `inv_mock_${String((state.nextEventIndex % 200) + 1).padStart(4, '0')}`
    );
    return true;
}

function createTravelEntries(batch) {
    const instance = getNextInstance();
    if (!instance) {
        return false;
    }

    state.pendingTravelLocation = instance.location;
    pushEntry(batch, createDt(), 'location-destination', state.pendingTravelLocation);
    pushEntry(batch, createDt(300), 'location', instance.location, instance.name);
    state.currentLocation = instance.location;
    state.currentWorldName = instance.name;
    clearPlayers();

    const friends = getFriendsPool();
    const joinCount = Math.min(
        MOCK_LOG_CONFIG.minPlayers + 2,
        MOCK_LOG_CONFIG.maxPlayers,
        friends.length
    );
    for (let i = 0; i < joinCount; i += 1) {
        const friend = friends[(state.nextPlayerIndex + i) % friends.length];
        const dt = createDt(600 + i * 80);
        syncPlayerState(friend, dt);
        pushEntry(batch, dt, 'player-joined', friend.displayName, friend.id);
    }
    state.nextPlayerIndex =
        (state.nextPlayerIndex + joinCount) % Math.max(1, friends.length);
    return true;
}

function buildLiveBatch() {
    clampPlayerBounds();
    if (!state.bootstrapDelivered) {
        state.bootstrapDelivered = true;
        return buildBootstrapEntries();
    }

    const batch = [];
    const limit = Math.max(1, MOCK_LOG_CONFIG.batchSize);
    const actions = {
        join: createJoinEntries,
        leave: createLeaveEntries,
        avatar: createAvatarEntries,
        portal: createPortalEntries,
        video: createVideoEntries,
        photon: createPhotonEntries,
        sticker: createStickerEntries,
        travel: createTravelEntries
    };

    for (let i = 0; i < limit; i += 1) {
        const type = chooseWeightedEvent();
        const ok = actions[type]?.(batch);
        if (!ok) {
            createAvatarEntries(batch);
        }
    }

    return batch;
}

export function createMockLogWatcher() {
    let nextBatchAt = 0;

    return {
        async Get() {
            if (state.historyDelivered || state.bootstrapDelivered) {
                state.historyDelivered = true;
                return [];
            }
            state.historyDelivered = true;
            state.bootstrapDelivered = true;
            return buildBootstrapEntries();
        },
        async SetDateTill() {},
        async Reset() {
            state.bootstrapDelivered = false;
            state.historyDelivered = false;
            state.currentLocation = '';
            state.currentWorldName = '';
            state.currentWorldIndex = 0;
            state.nextPlayerIndex = 0;
            state.nextAvatarIndex = 0;
            state.nextEventIndex = 0;
            state.nextPhotonId = 500;
            state.pendingTravelLocation = '';
            clearPlayers();
            nextBatchAt = 0;
        },
        async GetLogLines() {
            const now = Date.now();
            if (now < nextBatchAt) {
                return [];
            }
            nextBatchAt = now + MOCK_LOG_CONFIG.intervalMs;
            return buildLiveBatch().map((entry) => JSON.stringify(entry));
        }
    };
}
