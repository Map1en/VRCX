// MOCK RUNTIME ONLY
// Centralized mock runtime configuration. Env values seed defaults, local overrides keep browser debug sessions sticky.

const SETTINGS_KEY = 'vrcx_mock_runtime_settings_v1';

function readEnvNumber(key, fallback, min = 0) {
    const raw = import.meta.env[key];
    const value = Number(raw);
    if (!Number.isFinite(value)) {
        return fallback;
    }
    return Math.max(min, Math.floor(value));
}

function readEnvRatio(key, fallback) {
    const raw = import.meta.env[key];
    const value = Number(raw);
    if (!Number.isFinite(value)) {
        return fallback;
    }
    return Math.min(1, Math.max(0, value));
}

function loadPersistedSettings() {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const raw = window.localStorage.getItem(SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function persistSettings(settings) {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // ignore localStorage failures in mock mode
    }
}

function numberSetting(value, fallback, min = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.max(min, Math.floor(parsed));
}

function ratioSetting(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(1, Math.max(0, parsed));
}

export const MOCK_CREDENTIALS = Object.freeze({
    username: 'mock',
    password: 'mock'
});

export const DEFAULT_MOCK_DATA_CONFIG = Object.freeze({
    friendCount: readEnvNumber('VITE_MOCK_FRIEND_COUNT', 2000, 1),
    groupCount: readEnvNumber('VITE_MOCK_GROUP_COUNT', 12, 1),
    worldCount: readEnvNumber('VITE_MOCK_WORLD_COUNT', 420, 3),
    avatarCount: readEnvNumber('VITE_MOCK_AVATAR_COUNT', 320, 8),
    instanceCount: readEnvNumber('VITE_MOCK_INSTANCE_COUNT', 72, 3),
    onlineRatio: readEnvRatio('VITE_MOCK_ONLINE_RATIO', 0.28),
    activeRatio: readEnvRatio('VITE_MOCK_ACTIVE_RATIO', 0.08),
    travelingRatio: readEnvRatio('VITE_MOCK_TRAVELING_RATIO', 0.05)
});

export const DEFAULT_MOCK_WS_CONFIG = Object.freeze({
    intervalMs: readEnvNumber('VITE_MOCK_WS_INTERVAL_MS', 15000, 50),
    batchSize: readEnvNumber('VITE_MOCK_WS_BATCH_SIZE', 1, 1),
    locationWeight: readEnvNumber('VITE_MOCK_WS_LOCATION_WEIGHT', 6, 0),
    onlineWeight: readEnvNumber('VITE_MOCK_WS_ONLINE_WEIGHT', 2, 0),
    offlineWeight: readEnvNumber('VITE_MOCK_WS_OFFLINE_WEIGHT', 1, 0),
    updateWeight: readEnvNumber('VITE_MOCK_WS_UPDATE_WEIGHT', 2, 0),
    activeWeight: readEnvNumber('VITE_MOCK_WS_ACTIVE_WEIGHT', 1, 0),
    cohortSize: readEnvNumber('VITE_MOCK_WS_COHORT_SIZE', 3, 2),
    clusterWeight: readEnvNumber('VITE_MOCK_WS_CLUSTER_WEIGHT', 3, 0),
    splitWeight: readEnvNumber('VITE_MOCK_WS_SPLIT_WEIGHT', 2, 0),
    chaosWeight: readEnvNumber('VITE_MOCK_WS_CHAOS_WEIGHT', 2, 0)
});

export const DEFAULT_MOCK_LOG_CONFIG = Object.freeze({
    intervalMs: readEnvNumber('VITE_MOCK_LOG_INTERVAL_MS', 3500, 250),
    batchSize: readEnvNumber('VITE_MOCK_LOG_BATCH_SIZE', 3, 1),
    minPlayers: readEnvNumber('VITE_MOCK_LOG_MIN_PLAYERS', 6, 1),
    maxPlayers: readEnvNumber('VITE_MOCK_LOG_MAX_PLAYERS', 18, 2),
    joinWeight: readEnvNumber('VITE_MOCK_LOG_JOIN_WEIGHT', 5, 0),
    leaveWeight: readEnvNumber('VITE_MOCK_LOG_LEAVE_WEIGHT', 3, 0),
    avatarWeight: readEnvNumber('VITE_MOCK_LOG_AVATAR_WEIGHT', 2, 0),
    portalWeight: readEnvNumber('VITE_MOCK_LOG_PORTAL_WEIGHT', 1, 0),
    videoWeight: readEnvNumber('VITE_MOCK_LOG_VIDEO_WEIGHT', 1, 0),
    photonWeight: readEnvNumber('VITE_MOCK_LOG_PHOTON_WEIGHT', 2, 0),
    stickerWeight: readEnvNumber('VITE_MOCK_LOG_STICKER_WEIGHT', 1, 0),
    travelWeight: readEnvNumber('VITE_MOCK_LOG_TRAVEL_WEIGHT', 1, 0)
});

const persisted = loadPersistedSettings();

export const MOCK_DATA_CONFIG = {
    friendCount: numberSetting(
        persisted.data?.friendCount,
        DEFAULT_MOCK_DATA_CONFIG.friendCount,
        1
    ),
    groupCount: numberSetting(
        persisted.data?.groupCount,
        DEFAULT_MOCK_DATA_CONFIG.groupCount,
        1
    ),
    worldCount: numberSetting(
        persisted.data?.worldCount,
        DEFAULT_MOCK_DATA_CONFIG.worldCount,
        3
    ),
    avatarCount: numberSetting(
        persisted.data?.avatarCount,
        DEFAULT_MOCK_DATA_CONFIG.avatarCount,
        8
    ),
    instanceCount: numberSetting(
        persisted.data?.instanceCount,
        DEFAULT_MOCK_DATA_CONFIG.instanceCount,
        3
    ),
    onlineRatio: ratioSetting(
        persisted.data?.onlineRatio,
        DEFAULT_MOCK_DATA_CONFIG.onlineRatio
    ),
    activeRatio: ratioSetting(
        persisted.data?.activeRatio,
        DEFAULT_MOCK_DATA_CONFIG.activeRatio
    ),
    travelingRatio: ratioSetting(
        persisted.data?.travelingRatio,
        DEFAULT_MOCK_DATA_CONFIG.travelingRatio
    )
};

export const MOCK_WS_CONFIG = {
    intervalMs: numberSetting(
        persisted.ws?.intervalMs,
        DEFAULT_MOCK_WS_CONFIG.intervalMs,
        50
    ),
    batchSize: numberSetting(
        persisted.ws?.batchSize,
        DEFAULT_MOCK_WS_CONFIG.batchSize,
        1
    ),
    locationWeight: numberSetting(
        persisted.ws?.locationWeight,
        DEFAULT_MOCK_WS_CONFIG.locationWeight,
        0
    ),
    onlineWeight: numberSetting(
        persisted.ws?.onlineWeight,
        DEFAULT_MOCK_WS_CONFIG.onlineWeight,
        0
    ),
    offlineWeight: numberSetting(
        persisted.ws?.offlineWeight,
        DEFAULT_MOCK_WS_CONFIG.offlineWeight,
        0
    ),
    updateWeight: numberSetting(
        persisted.ws?.updateWeight,
        DEFAULT_MOCK_WS_CONFIG.updateWeight,
        0
    ),
    activeWeight: numberSetting(
        persisted.ws?.activeWeight,
        DEFAULT_MOCK_WS_CONFIG.activeWeight,
        0
    ),
    cohortSize: numberSetting(
        persisted.ws?.cohortSize,
        DEFAULT_MOCK_WS_CONFIG.cohortSize,
        2
    ),
    clusterWeight: numberSetting(
        persisted.ws?.clusterWeight,
        DEFAULT_MOCK_WS_CONFIG.clusterWeight,
        0
    ),
    splitWeight: numberSetting(
        persisted.ws?.splitWeight,
        DEFAULT_MOCK_WS_CONFIG.splitWeight,
        0
    ),
    chaosWeight: numberSetting(
        persisted.ws?.chaosWeight,
        DEFAULT_MOCK_WS_CONFIG.chaosWeight,
        0
    )
};

export const MOCK_LOG_CONFIG = {
    intervalMs: numberSetting(
        persisted.log?.intervalMs,
        DEFAULT_MOCK_LOG_CONFIG.intervalMs,
        250
    ),
    batchSize: numberSetting(
        persisted.log?.batchSize,
        DEFAULT_MOCK_LOG_CONFIG.batchSize,
        1
    ),
    minPlayers: numberSetting(
        persisted.log?.minPlayers,
        DEFAULT_MOCK_LOG_CONFIG.minPlayers,
        1
    ),
    maxPlayers: numberSetting(
        persisted.log?.maxPlayers,
        DEFAULT_MOCK_LOG_CONFIG.maxPlayers,
        2
    ),
    joinWeight: numberSetting(
        persisted.log?.joinWeight,
        DEFAULT_MOCK_LOG_CONFIG.joinWeight,
        0
    ),
    leaveWeight: numberSetting(
        persisted.log?.leaveWeight,
        DEFAULT_MOCK_LOG_CONFIG.leaveWeight,
        0
    ),
    avatarWeight: numberSetting(
        persisted.log?.avatarWeight,
        DEFAULT_MOCK_LOG_CONFIG.avatarWeight,
        0
    ),
    portalWeight: numberSetting(
        persisted.log?.portalWeight,
        DEFAULT_MOCK_LOG_CONFIG.portalWeight,
        0
    ),
    videoWeight: numberSetting(
        persisted.log?.videoWeight,
        DEFAULT_MOCK_LOG_CONFIG.videoWeight,
        0
    ),
    photonWeight: numberSetting(
        persisted.log?.photonWeight,
        DEFAULT_MOCK_LOG_CONFIG.photonWeight,
        0
    ),
    stickerWeight: numberSetting(
        persisted.log?.stickerWeight,
        DEFAULT_MOCK_LOG_CONFIG.stickerWeight,
        0
    ),
    travelWeight: numberSetting(
        persisted.log?.travelWeight,
        DEFAULT_MOCK_LOG_CONFIG.travelWeight,
        0
    )
};

export function getMockSettingsSnapshot() {
    return {
        data: { ...MOCK_DATA_CONFIG },
        ws: { ...MOCK_WS_CONFIG },
        log: { ...MOCK_LOG_CONFIG }
    };
}

export function saveMockSettings({ data, ws, log } = {}) {
    if (data) {
        Object.assign(MOCK_DATA_CONFIG, {
            friendCount: numberSetting(
                data.friendCount,
                MOCK_DATA_CONFIG.friendCount,
                1
            ),
            groupCount: numberSetting(data.groupCount, MOCK_DATA_CONFIG.groupCount, 1),
            worldCount: numberSetting(data.worldCount, MOCK_DATA_CONFIG.worldCount, 3),
            avatarCount: numberSetting(data.avatarCount, MOCK_DATA_CONFIG.avatarCount, 8),
            instanceCount: numberSetting(
                data.instanceCount,
                MOCK_DATA_CONFIG.instanceCount,
                3
            ),
            onlineRatio: ratioSetting(data.onlineRatio, MOCK_DATA_CONFIG.onlineRatio),
            activeRatio: ratioSetting(data.activeRatio, MOCK_DATA_CONFIG.activeRatio),
            travelingRatio: ratioSetting(
                data.travelingRatio,
                MOCK_DATA_CONFIG.travelingRatio
            )
        });
    }

    if (ws) {
        Object.assign(MOCK_WS_CONFIG, {
            intervalMs: numberSetting(ws.intervalMs, MOCK_WS_CONFIG.intervalMs, 50),
            batchSize: numberSetting(ws.batchSize, MOCK_WS_CONFIG.batchSize, 1),
            locationWeight: numberSetting(
                ws.locationWeight,
                MOCK_WS_CONFIG.locationWeight,
                0
            ),
            onlineWeight: numberSetting(ws.onlineWeight, MOCK_WS_CONFIG.onlineWeight, 0),
            offlineWeight: numberSetting(
                ws.offlineWeight,
                MOCK_WS_CONFIG.offlineWeight,
                0
            ),
            updateWeight: numberSetting(ws.updateWeight, MOCK_WS_CONFIG.updateWeight, 0),
            activeWeight: numberSetting(ws.activeWeight, MOCK_WS_CONFIG.activeWeight, 0),
            cohortSize: numberSetting(ws.cohortSize, MOCK_WS_CONFIG.cohortSize, 2),
            clusterWeight: numberSetting(
                ws.clusterWeight,
                MOCK_WS_CONFIG.clusterWeight,
                0
            ),
            splitWeight: numberSetting(ws.splitWeight, MOCK_WS_CONFIG.splitWeight, 0),
            chaosWeight: numberSetting(ws.chaosWeight, MOCK_WS_CONFIG.chaosWeight, 0)
        });
    }

    if (log) {
        Object.assign(MOCK_LOG_CONFIG, {
            intervalMs: numberSetting(
                log.intervalMs,
                MOCK_LOG_CONFIG.intervalMs,
                250
            ),
            batchSize: numberSetting(log.batchSize, MOCK_LOG_CONFIG.batchSize, 1),
            minPlayers: numberSetting(
                log.minPlayers,
                MOCK_LOG_CONFIG.minPlayers,
                1
            ),
            maxPlayers: numberSetting(
                log.maxPlayers,
                MOCK_LOG_CONFIG.maxPlayers,
                2
            ),
            joinWeight: numberSetting(log.joinWeight, MOCK_LOG_CONFIG.joinWeight, 0),
            leaveWeight: numberSetting(
                log.leaveWeight,
                MOCK_LOG_CONFIG.leaveWeight,
                0
            ),
            avatarWeight: numberSetting(
                log.avatarWeight,
                MOCK_LOG_CONFIG.avatarWeight,
                0
            ),
            portalWeight: numberSetting(
                log.portalWeight,
                MOCK_LOG_CONFIG.portalWeight,
                0
            ),
            videoWeight: numberSetting(
                log.videoWeight,
                MOCK_LOG_CONFIG.videoWeight,
                0
            ),
            photonWeight: numberSetting(
                log.photonWeight,
                MOCK_LOG_CONFIG.photonWeight,
                0
            ),
            stickerWeight: numberSetting(
                log.stickerWeight,
                MOCK_LOG_CONFIG.stickerWeight,
                0
            ),
            travelWeight: numberSetting(
                log.travelWeight,
                MOCK_LOG_CONFIG.travelWeight,
                0
            )
        });
    }

    persistSettings(getMockSettingsSnapshot());
}

export function resetMockSettings() {
    Object.assign(MOCK_DATA_CONFIG, { ...DEFAULT_MOCK_DATA_CONFIG });
    Object.assign(MOCK_WS_CONFIG, { ...DEFAULT_MOCK_WS_CONFIG });
    Object.assign(MOCK_LOG_CONFIG, { ...DEFAULT_MOCK_LOG_CONFIG });
    persistSettings(getMockSettingsSnapshot());
}
