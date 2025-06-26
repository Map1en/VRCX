import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { userRequest } from '../api';
import { $app } from '../app';
import configRepository from '../service/config';
import database from '../service/database';
import { API } from '../service/eventBus';
import { formatSeconds, getGroupName } from '../shared/utils';
import { useFriendStore } from './friend';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { useUiStore } from './ui';
import { useUserStore } from './user';
import { useVrStore } from './vr';
import { useVrcxStore } from './vrcx';

export const useGameLogStore = defineStore('GameLog', () => {
    const notificationStore = useNotificationStore();
    const vrStore = useVrStore();
    const locationStore = useLocationStore();
    const friendStore = useFriendStore();
    const instanceStore = useInstanceStore();
    const userStore = useUserStore();
    const uiStore = useUiStore();
    const vrcxStore = useVrcxStore();
    const state = reactive({
        nowPlaying: {
            url: '',
            name: '',
            length: 0,
            startTime: 0,
            offset: 0,
            elapsed: 0,
            percentage: 0,
            remainingText: '',
            playing: false
        },
        gameLogTable: {
            data: [],
            loading: false,
            search: '',
            filter: [],
            tableProps: {
                stripe: true,
                size: 'mini',
                defaultSort: {
                    prop: 'created_at',
                    order: 'descending'
                }
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 20, 25, 50, 100]
            },
            vip: false
        },
        gameLogSessionTable: []
    });

    async function init() {
        state.gameLogTable.filter = JSON.parse(
            await configRepository.getString('VRCX_gameLogTableFilters', '[]')
        );
        // gameLog loads before favorites
        // await configRepository.getBool(
        //     'VRCX_gameLogTableVIPFilter',
        //     false
        // );
    }

    init();

    const gameLogTable = computed({
        get: () => state.gameLogTable,
        set: (value) => {
            state.gameLogTable = value;
        }
    });

    const gameLogSessionTable = computed({
        get: () => state.gameLogSessionTable,
        set: (value) => {
            state.gameLogSessionTable = value;
        }
    });

    const nowPlaying = computed({
        get: () => state.nowPlaying,
        set: (value) => {
            state.nowPlaying = value;
        }
    });

    function clearNowPlaying() {
        state.nowPlaying = {
            url: '',
            name: '',
            length: 0,
            startTime: 0,
            offset: 0,
            elapsed: 0,
            percentage: 0,
            remainingText: '',
            playing: false
        };
        vrStore.updateVrNowPlaying();
    }

    function setNowPlaying(ctx) {
        if (state.nowPlaying.url !== ctx.videoUrl) {
            if (!ctx.userId && ctx.displayName) {
                for (const ref of API.cachedUsers.values()) {
                    if (ref.displayName === ctx.displayName) {
                        ctx.userId = ref.id;
                        break;
                    }
                }
            }
            notificationStore.queueGameLogNoty(ctx);
            addGameLog(ctx);
            database.addGamelogVideoPlayToDatabase(ctx);

            let displayName = '';
            if (ctx.displayName) {
                displayName = ` (${ctx.displayName})`;
            }
            const name = `${ctx.videoName}${displayName}`;
            state.nowPlaying = {
                url: ctx.videoUrl,
                name,
                length: ctx.videoLength,
                startTime: Date.parse(ctx.created_at) / 1000,
                offset: ctx.videoPos,
                elapsed: 0,
                percentage: 0,
                remainingText: ''
            };
        } else {
            state.nowPlaying = {
                ...state.nowPlaying,
                length: ctx.videoLength,
                startTime: Date.parse(ctx.created_at) / 1000,
                offset: ctx.videoPos,
                elapsed: 0,
                percentage: 0,
                remainingText: ''
            };
        }
        vrStore.updateVrNowPlaying();
        if (!state.nowPlaying.playing && ctx.videoLength > 0) {
            state.nowPlaying.playing = true;
            updateNowPlaying();
        }
    }

    function updateNowPlaying() {
        const np = state.nowPlaying;
        if (!state.nowPlaying.playing) {
            return;
        }
        const now = Date.now() / 1000;
        np.elapsed = Math.round((now - np.startTime + np.offset) * 10) / 10;
        if (np.elapsed >= np.length) {
            clearNowPlaying();
            return;
        }
        np.remainingText = formatSeconds(np.length - np.elapsed);
        np.percentage = Math.round(((np.elapsed * 100) / np.length) * 10) / 10;
        vrStore.updateVrNowPlaying();
        workerTimers.setTimeout(() => updateNowPlaying(), 1000);
    }

    function loadPlayerList() {
        let ctx;
        let i;
        const data = state.gameLogSessionTable;
        if (data.length === 0) {
            return;
        }
        let length = 0;
        for (i = data.length - 1; i > -1; i--) {
            ctx = data[i];
            if (ctx.type === 'Location') {
                locationStore.lastLocation = {
                    date: Date.parse(ctx.created_at),
                    location: ctx.location,
                    name: ctx.worldName,
                    playerList: new Map(),
                    friendList: new Map()
                };
                length = i;
                break;
            }
        }
        if (length > 0) {
            for (i = length + 1; i < data.length; i++) {
                ctx = data[i];
                if (ctx.type === 'OnPlayerJoined') {
                    if (!ctx.userId) {
                        for (let ref of API.cachedUsers.values()) {
                            if (ref.displayName === ctx.displayName) {
                                ctx.userId = ref.id;
                                break;
                            }
                        }
                    }
                    const userMap = {
                        displayName: ctx.displayName,
                        userId: ctx.userId,
                        joinTime: Date.parse(ctx.created_at),
                        lastAvatar: ''
                    };
                    locationStore.lastLocation.playerList.set(
                        ctx.userId,
                        userMap
                    );
                    if (friendStore.friends.has(ctx.userId)) {
                        locationStore.lastLocation.friendList.set(
                            ctx.userId,
                            userMap
                        );
                    }
                }
                if (ctx.type === 'OnPlayerLeft') {
                    locationStore.lastLocation.playerList.delete(ctx.userId);
                    locationStore.lastLocation.friendList.delete(ctx.userId);
                }
            }
            locationStore.lastLocation.playerList.forEach((ref1) => {
                if (
                    ref1.userId &&
                    typeof ref1.userId === 'string' &&
                    !API.cachedUsers.has(ref1.userId)
                ) {
                    userRequest.getUser({ userId: ref1.userId });
                }
            });

            locationStore.updateCurrentUserLocation();
            instanceStore.updateCurrentInstanceWorld();
            vrStore.updateVRLastLocation();
            instanceStore.getCurrentInstanceUserList();
            userStore.applyUserDialogLocation();
            instanceStore.applyWorldDialogInstances();
            instanceStore.applyGroupDialogInstances();
        }
    }

    function gameLogIsFriend(row) {
        if (typeof row.isFriend !== 'undefined') {
            return row.isFriend;
        }
        if (!row.userId) {
            return false;
        }
        row.isFriend = friendStore.friends.has(row.userId);
        return row.isFriend;
    }

    function gameLogIsFavorite(row) {
        if (typeof row.isFavorite !== 'undefined') {
            return row.isFavorite;
        }
        if (!row.userId) {
            return false;
        }
        row.isFavorite = friendStore.localFavoriteFriends.has(row.userId);
        return row.isFavorite;
    }

    async function gameLogTableLookup() {
        await configRepository.setString(
            'VRCX_gameLogTableFilters',
            JSON.stringify(state.gameLogTable.filter)
        );
        await configRepository.setBool(
            'VRCX_gameLogTableVIPFilter',
            state.gameLogTable.vip
        );
        state.gameLogTable.loading = true;
        let vipList = [];
        if (state.gameLogTable.vip) {
            vipList = Array.from(friendStore.localFavoriteFriends.values());
        }
        state.gameLogTable.data = await database.lookupGameLogDatabase(
            state.gameLogTable.search,
            state.gameLogTable.filter,
            vipList
        );
        state.gameLogTable.loading = false;
    }

    function addGameLog(entry) {
        state.gameLogSessionTable.push(entry);
        $app.updateSharedFeed(false);
        if (entry.type === 'VideoPlay') {
            // event time can be before last gameLog entry
            $app.updateSharedFeed(true);
        }

        // If the VIP friend filter is enabled, logs from other friends will be ignored.
        if (
            state.gameLogTable.vip &&
            !friendStore.localFavoriteFriends.has(entry.userId) &&
            (entry.type === 'OnPlayerJoined' ||
                entry.type === 'OnPlayerLeft' ||
                entry.type === 'VideoPlay' ||
                entry.type === 'PortalSpawn' ||
                entry.type === 'External')
        ) {
            return;
        }
        if (
            entry.type === 'LocationDestination' ||
            entry.type === 'AvatarChange' ||
            entry.type === 'ChatBoxMessage' ||
            (entry.userId === API.currentUser.id &&
                (entry.type === 'OnPlayerJoined' ||
                    entry.type === 'OnPlayerLeft'))
        ) {
            return;
        }
        if (
            state.gameLogTable.filter.length > 0 &&
            !state.gameLogTable.filter.includes(entry.type)
        ) {
            return;
        }
        if (!gameLogSearch(entry)) {
            return;
        }
        state.gameLogTable.data.push(entry);
        sweepGameLog();
        uiStore.notifyMenu('gameLog');
    }

    async function addGamelogLocationToDatabase(input) {
        const groupName = await getGroupName(input.location);
        const entry = {
            ...input,
            groupName
        };
        database.addGamelogLocationToDatabase(entry);
    }

    function gameLogSearch(row) {
        const value = state.gameLogTable.search.toUpperCase();
        if (!value) {
            return true;
        }
        if (
            (value.startsWith('wrld_') || value.startsWith('grp_')) &&
            String(row.location).toUpperCase().includes(value)
        ) {
            return true;
        }
        switch (row.type) {
            case 'Location':
                if (String(row.worldName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'OnPlayerJoined':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'OnPlayerLeft':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'PortalSpawn':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.worldName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'Event':
                if (String(row.data).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'External':
                if (String(row.message).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'VideoPlay':
                if (String(row.displayName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.videoName).toUpperCase().includes(value)) {
                    return true;
                }
                if (String(row.videoUrl).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
            case 'StringLoad':
            case 'ImageLoad':
                if (String(row.resourceUrl).toUpperCase().includes(value)) {
                    return true;
                }
                return false;
        }
        return true;
    }

    function sweepGameLog() {
        const { data } = state.gameLogTable;
        const j = data.length;
        if (j > vrcxStore.maxTableSize) {
            data.splice(0, j - vrcxStore.maxTableSize);
        }

        const date = new Date();
        date.setDate(date.getDate() - 1); // 24 hour limit
        const limit = date.toJSON();
        let i = 0;
        const k = state.gameLogSessionTable.length;
        while (i < k && state.gameLogSessionTable[i].created_at < limit) {
            ++i;
        }
        if (i === k) {
            state.gameLogSessionTable = [];
        } else if (i) {
            state.gameLogSessionTable.splice(0, i);
        }
    }

    return {
        state,
        nowPlaying,
        gameLogTable,
        gameLogSessionTable,
        clearNowPlaying,
        setNowPlaying,
        loadPlayerList,
        gameLogIsFriend,
        gameLogIsFavorite,
        gameLogTableLookup,
        addGameLog,
        addGamelogLocationToDatabase
    };
});
