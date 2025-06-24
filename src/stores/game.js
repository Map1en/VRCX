import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { $app, API } from '../app';
import configRepository from '../service/config.js';
import database from '../service/database';
import {
    deleteVRChatCache as _deleteVRChatCache,
    isRealInstance
} from '../shared/utils';
import { useAvatarStore } from './avatar';
import { useGameLogStore } from './gameLog';
import { useInstanceStore } from './instance';
import { useLaunchStore } from './launch';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useVrStore } from './vr';
import { useWorldStore } from './world';

export const useGameStore = defineStore('Game', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const locationStore = useLocationStore();
    const notificationStore = useNotificationStore();
    const avatarStore = useAvatarStore();
    const launchStore = useLaunchStore();
    const worldStore = useWorldStore();
    const instanceStore = useInstanceStore();
    const gameLogStore = useGameLogStore();
    const vrStore = useVrStore();
    const state = reactive({
        lastCrashedTime: null,
        VRChatUsedCacheSize: '',
        VRChatTotalCacheSize: '',
        VRChatCacheSizeLoading: false,
        isGameRunning: false,
        isGameNoVR: true,
        isSteamVRRunning: false,
        isHmdAfk: false,
        isRunningUnderWine: false
    });

    async function init() {
        state.isGameNoVR = await configRepository.getBool('isGameNoVR');
    }

    init();

    const VRChatUsedCacheSize = computed({
        get: () => state.VRChatUsedCacheSize,
        set: (value) => {
            state.VRChatUsedCacheSize = value;
        }
    });

    const VRChatTotalCacheSize = computed({
        get: () => state.VRChatTotalCacheSize,
        set: (value) => {
            state.VRChatTotalCacheSize = value;
        }
    });

    const VRChatCacheSizeLoading = computed({
        get: () => state.VRChatCacheSizeLoading,
        set: (value) => {
            state.VRChatCacheSizeLoading = value;
        }
    });

    const isGameRunning = computed({
        get: () => state.isGameRunning,
        set: (value) => {
            state.isGameRunning = value;
        }
    });

    const isGameNoVR = computed({
        get: () => state.isGameNoVR,
        set: (value) => {
            state.isGameNoVR = value;
        }
    });

    const isSteamVRRunning = computed({
        get: () => state.isSteamVRRunning,
        set: (value) => {
            state.isSteamVRRunning = value;
        }
    });

    const isHmdAfk = computed({
        get: () => state.isHmdAfk,
        set: (value) => {
            state.isHmdAfk = value;
        }
    });

    const isRunningUnderWine = computed({
        get: () => state.isRunningUnderWine,
        set: (value) => {
            state.isRunningUnderWine = value;
        }
    });

    async function deleteVRChatCache(ref) {
        await _deleteVRChatCache(ref);
        getVRChatCacheSize();
        worldStore.updateVRChatWorldCache();
        avatarStore.updateVRChatAvatarCache();
    }

    function autoVRChatCacheManagement() {
        if (advancedSettingsStore.autoSweepVRChatCache) {
            sweepVRChatCache();
        }
    }

    async function sweepVRChatCache() {
        const output = await AssetBundleManager.SweepCache();
        console.log('SweepCache', output);
        if ($app.isVRChatConfigDialogVisible) {
            getVRChatCacheSize();
        }
    }

    function checkIfGameCrashed() {
        if (!advancedSettingsStore.relaunchVRChatAfterCrash) {
            return;
        }
        const { location } = locationStore.lastLocation;
        AppApi.VrcClosedGracefully().then((result) => {
            if (result || !isRealInstance(location)) {
                return;
            }
            // check if relaunched less than 2mins ago (prvent crash loop)
            if (
                state.lastCrashedTime &&
                new Date() - state.lastCrashedTime < 120_000
            ) {
                console.log('VRChat was recently crashed, not relaunching');
                return;
            }
            state.lastCrashedTime = new Date();
            // wait a bit for SteamVR to potentially close before deciding to relaunch
            let restartDelay = 8000;
            if (state.isGameNoVR) {
                // wait for game to close before relaunching
                restartDelay = 2000;
            }
            workerTimers.setTimeout(
                () => restartCrashedGame(location),
                restartDelay
            );
        });
    }

    function restartCrashedGame(location) {
        if (!state.isGameNoVR && !state.isSteamVRRunning) {
            console.log("SteamVR isn't running, not relaunching VRChat");
            return;
        }
        AppApi.FocusWindow();
        const message = 'VRChat crashed, attempting to rejoin last instance';
        $app.$message({
            message,
            type: 'info'
        });
        const entry = {
            created_at: new Date().toJSON(),
            type: 'Event',
            data: message
        };
        database.addGamelogEventToDatabase(entry);
        notificationStore.queueGameLogNoty(entry);
        $app.addGameLog(entry);
        launchStore.launchGame(location, '', state.isGameNoVR);
    }

    async function getVRChatCacheSize() {
        state.VRChatCacheSizeLoading = true;
        const totalCacheSize = 30;
        state.VRChatTotalCacheSize = totalCacheSize;
        const usedCacheSize = await AssetBundleManager.GetCacheSize();
        state.VRChatUsedCacheSize = (usedCacheSize / 1073741824).toFixed(2);
        state.VRChatCacheSizeLoading = false;
    }

    // todo: use in cef
    async function updateIsGameRunning(
        isGameRunning,
        isSteamVRRunning,
        isHmdAfk
    ) {
        if (advancedSettingsStore.gameLogDisabled) {
            return;
        }
        if (isGameRunning !== state.isGameRunning) {
            state.isGameRunning = isGameRunning;
            if (isGameRunning) {
                API.currentUser.$online_for = Date.now();
                API.currentUser.$offline_for = '';
                API.currentUser.$previousAvatarSwapTime = Date.now();
            } else {
                await configRepository.setBool('isGameNoVR', state.isGameNoVR);
                API.currentUser.$online_for = '';
                API.currentUser.$offline_for = Date.now();
                instanceStore.removeAllQueuedInstances();
                autoVRChatCacheManagement();
                checkIfGameCrashed();
                $app.ipcTimeout = 0;
                $app.addAvatarWearTime(API.currentUser.currentAvatar);
                API.currentUser.$previousAvatarSwapTime = '';
            }
            locationStore.lastLocationReset();
            gameLogStore.clearNowPlaying();
            vrStore.updateVRLastLocation();
            workerTimers.setTimeout(
                () => $app.checkVRChatDebugLogging(),
                60000
            );
            $app.nextDiscordUpdate = 0;
            console.log(new Date(), 'isGameRunning', isGameRunning);
        }

        if (isSteamVRRunning !== state.isSteamVRRunning) {
            state.isSteamVRRunning = isSteamVRRunning;
            console.log('isSteamVRRunning:', isSteamVRRunning);
        }
        if (isHmdAfk !== state.isHmdAfk) {
            state.isHmdAfk = isHmdAfk;
            console.log('isHmdAfk:', isHmdAfk);
        }
        vrStore.updateOpenVR();
    }

    return {
        state,
        VRChatUsedCacheSize,
        VRChatTotalCacheSize,
        VRChatCacheSizeLoading,
        isGameRunning,
        isGameNoVR,
        isSteamVRRunning,
        isHmdAfk,
        isRunningUnderWine,
        deleteVRChatCache,
        sweepVRChatCache,
        getVRChatCacheSize,
        updateIsGameRunning
    };
});
