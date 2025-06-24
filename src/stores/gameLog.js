import { defineStore } from 'pinia';
import { reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { userRequest } from '../api';
import { $app, API } from '../app';
import database from '../service/database';
import { formatSeconds } from '../shared/utils';
import { useFriendStore } from './friend';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { useUserStore } from './user';
import { useVrStore } from './vr';

export const useGameLogStore = defineStore('GameLog', () => {
    const notificationStore = useNotificationStore();
    const vrStore = useVrStore();
    const locationStore = useLocationStore();
    const friendStore = useFriendStore();
    const instanceStore = useInstanceStore();
    const userStore = useUserStore();
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
            $app.addGameLog(ctx);
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
        const data = $app.gameLogSessionTable;
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

    return { state, clearNowPlaying, setNowPlaying };
});
