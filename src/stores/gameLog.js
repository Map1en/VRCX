import { defineStore } from 'pinia';
import { reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { $app, API } from '../app';
import database from '../service/database';
import { formatSeconds } from '../shared/utils';
import { useNotificationStore } from './notification';
import { useVrStore } from './vr';

export const useGameLogStore = defineStore('GameLog', () => {
    const notificationStore = useNotificationStore();
    const vrStore = useVrStore();
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

    return { state, clearNowPlaying, setNowPlaying };
});
