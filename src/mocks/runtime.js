import { database } from '../services/database';
import {
    getMockAvatars,
    getMockAvatarModerations,
    getMockAvatarStats,
    getMockCurrentUser,
    getMockFriends,
    getMockGroups,
    getMockLocalFavoritesSeed,
    getMockMemosSeed,
    getMockNotesSeed,
    getMockNotificationsSeed,
    getMockPlayerModerations,
    getMockUserStats,
    getMockWorldStats,
    getMockWorlds
} from './api';
import { createMockLogWatcher as createLiveMockLogWatcher } from './gameLog';

const STORAGE_KEY = 'vrcx_mock_storage_state_v1';
const SQLITE_CONFIGS_KEY = 'vrcx_mock_sqlite_configs_v1';

function loadMapFromLocalStorage(key) {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
            return new Map();
        }
        return new Map(Object.entries(JSON.parse(raw)));
    } catch {
        return new Map();
    }
}

function persistMapToLocalStorage(key, map) {
    try {
        window.localStorage.setItem(
            key,
            JSON.stringify(Object.fromEntries(map.entries()))
        );
    } catch {
        // ignore localStorage quota or availability errors in mock mode
    }
}

const storageState = loadMapFromLocalStorage(STORAGE_KEY);
const sqliteState = {
    configs: loadMapFromLocalStorage(SQLITE_CONFIGS_KEY)
};

function initMockFavoriteConfig() {
    const seed = getMockLocalFavoritesSeed();
    if (!sqliteState.configs.has('VRCX_localFavoriteFriendsGroups')) {
        sqliteState.configs.set(
            'VRCX_localFavoriteFriendsGroups',
            JSON.stringify(seed.friendGroups.map((group) => `local:${group}`))
        );
        persistMapToLocalStorage(SQLITE_CONFIGS_KEY, sqliteState.configs);
    }
}

function initMockDatabaseOverrides() {
    const seed = getMockLocalFavoritesSeed();
    const notesSeed = getMockNotesSeed();
    const memosSeed = getMockMemosSeed();
    const notificationsSeed = getMockNotificationsSeed();
    const friends = getMockFriends();
    const worlds = getMockWorlds();
    const avatars = getMockAvatars();
    const groups = getMockGroups();
    const currentUser = getMockCurrentUser();
    const userStatsSeed = new Map(
        friends.map((friend, index) => [
            friend.id,
            {
                userId: friend.id,
                lastSeen:
                    friend.state === 'offline'
                        ? `2026-03-${String((index % 14) + 1).padStart(2, '0')}T${String((index % 23) + 1).padStart(2, '0')}:15:00.000Z`
                        : new Date(Date.now() - (index % 90) * 60_000).toISOString(),
                joinCount: 3 + (index % 24),
                timeSpent: (30 + (index % 180)) * 60_000,
                previousDisplayNames: new Map(
                    index % 9 === 0
                        ? [[`${friend.displayName} Legacy`, `2025-12-${String((index % 20) + 1).padStart(2, '0')}T09:00:00.000Z`]]
                        : []
                )
            }
        ])
    );
    userStatsSeed.set(currentUser.id, {
        userId: currentUser.id,
        lastSeen: new Date(Date.now() - 35_000).toISOString(),
        joinCount: 112,
        timeSpent: 48 * 60 * 60 * 1000,
        previousDisplayNames: new Map([
            ['Mock Legacy User', '2024-06-01T00:00:00.000Z']
        ])
    });
    const worldStatsSeed = new Map(
        worlds.map((world, index) => [
            world.id,
            {
                worldId: world.id,
                created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T${String((index % 23) + 1).padStart(2, '0')}:20:00.000Z`,
                visitCount: 6 + (index % 54),
                timeSpent: (15 + (index % 300)) * 60_000
            }
        ])
    );
    const avatarStatsSeed = new Map(
        avatars.map((avatar, index) => [
            avatar.id,
            {
                avatarId: avatar.id,
                timeSpent: (10 + (index % 240)) * 60_000
            }
        ])
    );
    const moderationSeed = friends
        .slice(0, 24)
        .map((friend, index) => ({
            userId: friend.id,
            updatedAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T08:00:00.000Z`,
            displayName: friend.displayName,
            block: index % 3 === 0,
            mute: index % 4 === 0
        }));
    const friendLogCurrentSeed = friends
        .slice(0, 120)
        .map((friend, index) => ({
            userId: friend.id,
            displayName: friend.displayName,
            trustLevel: friend.tags?.includes('system_supporter')
                ? 'Trusted'
                : 'Known',
            friendNumber: index + 1
        }));
    const friendLogHistorySeed = friends
        .slice(0, 180)
        .map((friend, index) => ({
            rowId: index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T${String((index % 23) + 1).padStart(2, '0')}:00:00.000Z`,
            type: index % 5 === 0 ? 'TrustLevel' : index % 7 === 0 ? 'DisplayName' : 'Friend',
            userId: friend.id,
            displayName: friend.displayName,
            previousDisplayName:
                index % 7 === 0 ? `${friend.displayName} Legacy` : undefined,
            trustLevel: index % 5 === 0 ? 'Trusted' : undefined,
            previousTrustLevel: index % 5 === 0 ? 'Known' : undefined,
            friendNumber: index + 1
        }));
    const feedSeed = [
        ...friends.slice(0, 40).map((friend, index) => ({
            rowId: index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T09:00:00.000Z`,
            userId: friend.id,
            displayName: friend.displayName,
            type: 'GPS',
            location: friend.location,
            worldName: worlds[index % worlds.length]?.name || '',
            previousLocation: 'offline',
            time: 1200 + index * 30,
            groupName: ''
        })),
        ...friends.slice(40, 80).map((friend, index) => ({
            rowId: 1000 + index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T10:00:00.000Z`,
            userId: friend.id,
            displayName: friend.displayName,
            type: 'Status',
            status: friend.status,
            statusDescription: friend.statusDescription,
            previousStatus: 'busy',
            previousStatusDescription: 'Previous mock status'
        })),
        ...friends.slice(80, 120).map((friend, index) => ({
            rowId: 2000 + index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T11:00:00.000Z`,
            userId: friend.id,
            displayName: friend.displayName,
            type: 'Bio',
            bio: friend.bio,
            previousBio: 'Previous mock bio'
        })),
        ...friends.slice(120, 160).map((friend, index) => ({
            rowId: 3000 + index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T12:00:00.000Z`,
            userId: friend.id,
            displayName: friend.displayName,
            type: 'Avatar',
            ownerId: friend.id,
            avatarName: avatars[(index % Math.max(1, avatars.length - 1)) + 1]?.name,
            currentAvatarImageUrl: friend.currentAvatarImageUrl,
            currentAvatarThumbnailImageUrl:
                friend.currentAvatarThumbnailImageUrl,
            previousCurrentAvatarImageUrl: avatars[0]?.imageUrl || '',
            previousCurrentAvatarThumbnailImageUrl:
                avatars[0]?.thumbnailImageUrl || ''
        })),
        ...friends.slice(160, 200).map((friend, index) => ({
            rowId: 4000 + index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T13:00:00.000Z`,
            userId: friend.id,
            displayName: friend.displayName,
            type: index % 2 === 0 ? 'Online' : 'Offline',
            location: friend.location,
            worldName: worlds[index % worlds.length]?.name || '',
            time: 600 + index * 15,
            groupName: ''
        })),
        ...friends.slice(200, 240).map((friend, index) => ({
            rowId: 5000 + index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T14:00:00.000Z`,
            userId: friend.id,
            displayName: friend.displayName,
            type: 'Nickname',
            previousDisplayName: `${friend.displayName} Legacy`,
            displayNameNow: friend.displayName
        })),
        ...friends.slice(240, 280).map((friend, index) => ({
            rowId: 6000 + index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T15:00:00.000Z`,
            userId: friend.id,
            displayName: friend.displayName,
            type: 'Friend',
            location: friend.location,
            worldName: worlds[index % worlds.length]?.name || ''
        })),
        ...friends.slice(280, 320).map((friend, index) => ({
            rowId: 7000 + index + 1,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T16:00:00.000Z`,
            userId: friend.id,
            displayName: friend.displayName,
            type: 'TrustLevel',
            trustLevel: index % 2 === 0 ? 'Known' : 'Trusted',
            previousTrustLevel: 'User'
        }))
    ];
    const gameLogDatabaseSeed = [];
    const seedLocation = currentUser.homeLocation || `${worlds[0]?.id || 'wrld_mock_0001'}:1`;
    const seedWorldName =
        worlds.find((world) => seedLocation.startsWith(world.id))?.name ||
        'Mock Runtime World';
    gameLogDatabaseSeed.push({
        created_at: '2026-03-14T11:59:00.000Z',
        type: 'Location',
        location: seedLocation,
        worldName: seedWorldName
    });
    friends.slice(0, 12).forEach((friend, index) => {
        gameLogDatabaseSeed.push({
            created_at: `2026-03-14T11:${String((index + 10) % 60).padStart(2, '0')}:00.000Z`,
            type: 'OnPlayerJoined',
            location: seedLocation,
            displayName: friend.displayName,
            userId: friend.id,
            time: 60_000 + index * 45_000
        });
    });
    gameLogDatabaseSeed.push({
        created_at: '2026-03-14T12:03:00.000Z',
        type: 'VideoPlay',
        location: seedLocation,
        displayName: friends[0]?.displayName || '',
        userId: friends[0]?.id || '',
        videoUrl: 'https://cdn.mock.vrcx/video/1.mp4'
    });
    database.getFriendFavorites = async () =>
        Object.entries(seed.friendGroupsMap).flatMap(([groupName, userIds]) =>
            userIds.map((userId, index) => ({
                created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T00:00:00.000Z`,
                userId,
                groupName
            }))
        );
    database.getWorldFavorites = async () =>
        Object.entries(seed.worldGroups).flatMap(([groupName, worlds]) =>
            worlds.map((world, index) => ({
                created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T00:00:00.000Z`,
                worldId: world.id,
                groupName
            }))
        );
    database.getWorldCache = async () => getMockWorlds();
    database.getAvatarFavorites = async () =>
        Object.entries(seed.avatarGroups).flatMap(([groupName, avatars]) =>
            avatars.map((avatar, index) => ({
                created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T00:00:00.000Z`,
                avatarId: avatar.id,
                groupName
            }))
        );
    database.getAvatarCache = async () => getMockAvatars();
    database.getUserMemo = async (userId) =>
        memosSeed.users.find((memo) => memo.userId === userId) || {};
    database.getWorldMemo = async (worldId) =>
        memosSeed.worlds.find((memo) => memo.worldId === worldId) || {};
    database.getAvatarMemoDB = async (avatarId) =>
        memosSeed.avatars.find((memo) => memo.avatarId === avatarId) || {};
    database.getAllUserMemos = async () =>
        memosSeed.users.map(({ userId, memo }) => ({ userId, memo }));
    database.getAllUserNotes = async () =>
        notesSeed.map((note) => ({
            userId: note.targetUserId,
            displayName:
                getMockFriends().find((friend) => friend.id === note.targetUserId)
                    ?.displayName || '',
            note: note.note,
            createdAt: note.created_at
        }));
    database.getModeration = async (userId) =>
        moderationSeed.find((item) => item.userId === userId) || {};
    database.getFriendLogCurrent = async () => friendLogCurrentSeed;
    database.getFriendLogHistory = async () => friendLogHistorySeed;
    database.getFriendLogHistoryForUserId = async (userId, types = []) =>
        friendLogHistorySeed.filter(
            (item) =>
                item.userId === userId &&
                (types.length === 0 || types.includes(item.type))
        );
    database.lookupFeedDatabase = async (_filters = [], vipList = []) =>
        feedSeed.filter(
            (item) =>
                vipList.length === 0 || vipList.includes(item.userId)
        );
    database.searchFeedDatabase = async (
        search = '',
        _filters = [],
        vipList = []
    ) =>
        feedSeed.filter((item) => {
            const matchesSearch =
                !search ||
                item.displayName?.includes(search) ||
                item.worldName?.includes(search) ||
                item.location?.includes(search);
            const matchesVip =
                vipList.length === 0 || vipList.includes(item.userId);
            return matchesSearch && matchesVip;
        });
    database.getNotifications = async () => notificationsSeed.v1;
    database.getNotificationsV2 = async () =>
        notificationsSeed.v2.map((item) => ({
            ...item,
            created_at: item.createdAt
        }));
    database.getLastVisit = async (worldId) => getMockWorldStats(worldId);
    database.getVisitCount = async (worldId) => getMockWorldStats(worldId);
    database.getTimeSpentInWorld = async (worldId) =>
        getMockWorldStats(worldId);
    database.getAvatarTimeSpent = async (avatarId) =>
        getMockAvatarStats(avatarId);
    database.getAvatarHistory = async () => getMockAvatars().slice(0, 30);
    database.getWorldHistory = async () => getMockWorlds().slice(0, 30);
    database.getFriendFavoritesCount = async () => getMockFriends().length;
    database.getUserStats = async (input) => getMockUserStats(input);
    database.getAllUserStats = async (userIds = [], displayNames = []) => {
        const rows = [];
        const seen = new Set();
        for (const userId of userIds) {
            const friend = friends.find((item) => item.id === userId);
            if (!friend || seen.has(friend.id)) {
                continue;
            }
            seen.add(friend.id);
            const stats = getMockUserStats(friend);
            rows.push({
                userId: friend.id,
                displayName: friend.displayName,
                lastSeen: stats.lastSeen,
                timeSpent: stats.timeSpent,
                joinCount: stats.joinCount
            });
        }
        for (const displayName of displayNames) {
            const friend = friends.find((item) => item.displayName === displayName);
            if (!friend || seen.has(friend.id)) {
                continue;
            }
            seen.add(friend.id);
            const stats = getMockUserStats(friend);
            rows.push({
                userId: friend.id,
                displayName: friend.displayName,
                lastSeen: stats.lastSeen,
                timeSpent: stats.timeSpent,
                joinCount: stats.joinCount
            });
        }
        return rows;
    };
    database.getGamelogDatabase = async () => gameLogDatabaseSeed;
    database.getLastDateGameLogDatabase = async () =>
        gameLogDatabaseSeed[gameLogDatabaseSeed.length - 1]?.created_at ||
        '2026-03-14T12:00:00.000Z';
    database.addGamelogLocationToDatabase = (entry) => {
        gameLogDatabaseSeed.push(entry);
    };
    database.addGamelogJoinLeaveToDatabase = (entry) => {
        gameLogDatabaseSeed.push(entry);
    };
    database.addGamelogJoinLeaveBulk = (entries) => {
        gameLogDatabaseSeed.push(...entries);
    };
    database.addGamelogPortalSpawnToDatabase = (entry) => {
        gameLogDatabaseSeed.push(entry);
    };
    database.addGamelogVideoPlayToDatabase = (entry) => {
        gameLogDatabaseSeed.push(entry);
    };
    database.addGamelogResourceLoadToDatabase = (entry) => {
        gameLogDatabaseSeed.push(entry);
    };
    database.addGamelogEventToDatabase = (entry) => {
        gameLogDatabaseSeed.push(entry);
    };
    database.addGamelogExternalToDatabase = (entry) => {
        gameLogDatabaseSeed.push(entry);
    };
    database.getLastGroupVisit = async (groupName) => {
        const groupIndex = groups.findIndex((group) => group.name === groupName);
        return {
            groupName,
            created_at:
                groupIndex >= 0
                    ? `2026-03-${String((groupIndex % 14) + 1).padStart(2, '0')}T18:30:00.000Z`
                    : '2026-03-14T12:00:00.000Z'
        };
    };
    database.getPreviousInstancesByUserId = async (input) => {
        const data = new Map();
        const friend = friends.find((item) => item.id === input.id);
        if (!friend) {
            return data;
        }
        worlds.slice(0, 8).forEach((world, index) => {
            const location = `${world.id}:${index + 1}`;
            data.set(location, {
                created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T1${index % 10}:00:00.000Z`,
                location,
                time: (index + 2) * 60_000,
                worldName: world.name,
                groupName: groups[index % groups.length]?.name || '',
                userId: friend.id,
                displayName: friend.displayName
            });
        });
        return data;
    };
    database.getPreviousInstancesByWorldId = async (input) => {
        const data = new Map();
        worlds.slice(0, 8).forEach((world, index) => {
            if (world.id !== input.id) {
                return;
            }
            const location = `${world.id}:${index + 1}`;
            data.set(location, {
                created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T1${index % 10}:20:00.000Z`,
                location,
                time: (index + 3) * 60_000,
                worldName: world.name,
                groupName: groups[index % groups.length]?.name || ''
            });
        });
        return data;
    };
    database.getPreviousInstancesByGroupId = async (groupId) => {
        const data = new Map();
        worlds.slice(0, 8).forEach((world, index) => {
            const location = `${world.id}:${index + 1}~group(${groupId})`;
            data.set(location, {
                created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T2${index % 4}:10:00.000Z`,
                location,
                time: (index + 4) * 60_000,
                worldName: world.name,
                groupName: groups.find((group) => group.id === groupId)?.name || ''
            });
        });
        return data;
    };
    database.getPlayerModerations = async () => getMockPlayerModerations();
    database.getAvatarModerations = async () => getMockAvatarModerations();
    database.getModeration = async (userId) =>
        moderationSeed.find((item) => item.userId === userId) || {};
}

function createMockElectron() {
    const noop = () => {};
    const noopAsync = async () => {};

    return {
        getArch: async () => 'x64',
        getClipboardText: async () => '',
        getNoUpdater: async () => true,
        setTrayIconNotification: noopAsync,
        openFileDialog: async () => '',
        openDirectoryDialog: async () => '',
        desktopNotification: noopAsync,
        onWindowPositionChanged: noop,
        onWindowSizeChanged: noop,
        onWindowStateChange: noop,
        onBrowserFocus: noop,
        restartApp: noopAsync,
        getOverlayWindow: async () => false,
        updateVr: noopAsync,
        ipcRenderer: {
            on: noop
        }
    };
}

function createMockStorage() {
    return {
        async Get(key) {
            return storageState.get(key) ?? '';
        },
        async Set(key, value) {
            storageState.set(key, String(value));
            persistMapToLocalStorage(STORAGE_KEY, storageState);
        },
        async Remove(key) {
            storageState.delete(key);
            persistMapToLocalStorage(STORAGE_KEY, storageState);
        },
        async GetAll() {
            return JSON.stringify(Object.fromEntries(storageState.entries()));
        },
        async Flush() {},
        async Save() {},
        async Load() {},
        async GetArray(key) {
            try {
                const value = storageState.get(key);
                return value ? JSON.parse(value) : [];
            } catch {
                return [];
            }
        },
        async SetArray(key, value) {
            storageState.set(key, JSON.stringify(value));
            persistMapToLocalStorage(STORAGE_KEY, storageState);
        },
        async GetObject(key) {
            try {
                const value = storageState.get(key);
                return value ? JSON.parse(value) : {};
            } catch {
                return {};
            }
        },
        async SetObject(key, value) {
            storageState.set(key, JSON.stringify(value));
            persistMapToLocalStorage(STORAGE_KEY, storageState);
        }
    };
}

function createMockSQLite() {
    function readArg(args, key) {
        if (!args) {
            return undefined;
        }
        if (typeof args.get === 'function') {
            return args.get(key);
        }
        return args[key];
    }

    return {
        async Execute(_sql, args) {
            const key = readArg(args, '@key');
            if (typeof key === 'string' && sqliteState.configs.has(key)) {
                return [[sqliteState.configs.get(key)]];
            }
            return [];
        },
        async ExecuteJson(sql, args) {
            const rows = await this.Execute(sql, args);
            return JSON.stringify(rows);
        },
        async ExecuteNonQuery(sql, args) {
            if (/INSERT OR REPLACE INTO configs/i.test(sql)) {
                sqliteState.configs.set(
                    readArg(args, '@key'),
                    readArg(args, '@value') ?? ''
                );
                persistMapToLocalStorage(SQLITE_CONFIGS_KEY, sqliteState.configs);
            } else if (/DELETE FROM configs/i.test(sql)) {
                sqliteState.configs.delete(readArg(args, '@key'));
                persistMapToLocalStorage(SQLITE_CONFIGS_KEY, sqliteState.configs);
            }
            return 0;
        }
    };
}

function createMockAppApi() {
    const fixedResults = new Map([
        ['GetZoom', 0],
        ['GetClipboard', ''],
        ['CurrentCulture', 'en-US'],
        ['CurrentLanguage', 'en'],
        ['GetVersion', VERSION],
        ['GetLaunchCommand', ''],
        ['GetVRChatRegistry', {}],
        ['GetVRChatRegistryJson', '{}'],
        ['GetVRChatRegistryKey', 0],
        ['GetVRChatRegistryKeyString', ''],
        ['HasVRChatRegistryFolder', false],
        ['GetColourFromUserID', 180],
        ['GetColourBulk', {}],
        ['VrcClosedGracefully', true],
        ['ReadConfigFileSafe', '{}'],
        ['GetFileBase64', null],
        ['FindScreenshotsBySearch', []],
        ['GetExtraScreenshotData', '{}'],
        ['GetScreenshotMetadata', '[]'],
        ['GetLastScreenshot', ''],
        ['GetVRChatPhotosLocation', ''],
        ['GetImage', ''],
        ['IsGameRunning', true],
        ['IsSteamVRRunning', false],
        ['CheckForUpdateExe', false],
        ['CheckUpdateProgress', 0],
        ['TryOpenInstanceInVrc', false],
        ['FileLength', '0'],
        ['MD5File', ''],
        ['SignFile', ''],
        ['ResizeImageToFitLimits', ''],
        [
            'GetVRChatUserModeration',
            JSON.stringify(getMockPlayerModerations())
        ]
    ]);

    const registryState = new Map([['LOGGING_ENABLED', '1']]);

    return new Proxy(
        {},
        {
            get(_target, prop) {
                if (prop === 'GetVRChatRegistryKeyString') {
                    return async (key) => registryState.get(key) ?? '';
                }
                if (prop === 'SetVRChatRegistryKey') {
                    return async (key, value) => {
                        registryState.set(key, String(value));
                        return true;
                    };
                }
                if (prop === 'PopulateImageHosts') {
                    return async () => {};
                }
                if (prop === 'GetVRChatUserModeration') {
                    return async (_sourceUserId, targetUserId) => {
                        if (String(targetUserId).endsWith('00003')) {
                            return 4;
                        }
                        if (String(targetUserId).endsWith('00004')) {
                            return 5;
                        }
                        return 0;
                    };
                }
                if (fixedResults.has(prop)) {
                    return async () => fixedResults.get(prop);
                }
                return async () => {};
            }
        }
    );
}

function createMockLogWatcher() {
    return createLiveMockLogWatcher();
}

function createNoopProxy(defaultValue = undefined) {
    return new Proxy(
        {},
        {
            get() {
                return async () => defaultValue;
            }
        }
    );
}

export function initMockRuntimeGlobals() {
    initMockFavoriteConfig();
    window.AppApi = createMockAppApi();
    window.WebApi = createNoopProxy();
    window.VRCXStorage = createMockStorage();
    window.SQLite = createMockSQLite();
    window.LogWatcher = createMockLogWatcher();
    window.Discord = createNoopProxy(false);
    window.AssetBundleManager = createNoopProxy();
    window.AppApiVrElectron = createNoopProxy();
    if (LINUX && typeof window.electron === 'undefined') {
        window.electron = createMockElectron();
    }
    initMockDatabaseOverrides();
}
