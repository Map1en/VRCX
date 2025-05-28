import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';
import database from '../../service/database';
import webApiService from '../../service/webapi';
import { useDebugStore } from '../debug';

export const useAdvancedSettingsStore = defineStore('AdvancedSettings', () => {
    const debugStore = useDebugStore();
    const { debugWebRequests } = storeToRefs(debugStore);

    const state = reactive({
        enablePrimaryPassword: false,
        relaunchVRChatAfterCrash: false,
        vrcQuitFix: true,
        autoSweepVRChatCache: false,
        disableWorldDatabase: false,
        saveInstancePrints: false,
        cropInstancePrints: false,
        saveInstanceStickers: false,
        avatarRemoteDatabase: true,
        enableAppLauncher: true,
        enableAppLauncherAutoClose: true,
        screenshotHelper: true,
        screenshotHelperModifyFilename: false,
        screenshotHelperCopyToClipboard: false,
        youTubeApi: false,
        youTubeApiKey: '',
        progressPie: false,
        progressPieFilter: true,
        showConfirmationOnSwitchAvatar: false,
        gameLogDisabled: false,
        sqliteTableSizes: {}
    });

    async function initAdvancedSettings() {
        const [
            enablePrimaryPassword,
            relaunchVRChatAfterCrash,
            vrcQuitFix,
            autoSweepVRChatCache,
            disableWorldDatabase,
            saveInstancePrints,
            cropInstancePrints,
            saveInstanceStickers,
            avatarRemoteDatabase,
            enableAppLauncher,
            enableAppLauncherAutoClose,
            screenshotHelper,
            screenshotHelperModifyFilename,
            screenshotHelperCopyToClipboard,
            youTubeApi,
            youTubeApiKey,
            progressPie,
            progressPieFilter,
            showConfirmationOnSwitchAvatar,
            gameLogDisabled
        ] = await Promise.all([
            configRepository.getBool('enablePrimaryPassword', false),
            configRepository.getBool('VRCX_relaunchVRChatAfterCrash', false),
            configRepository.getBool('VRCX_vrcQuitFix', true),
            configRepository.getBool('VRCX_autoSweepVRChatCache', false),
            VRCXStorage.Get('VRCX_DisableWorldDatabase'),
            configRepository.getBool('VRCX_saveInstancePrints', false),
            configRepository.getBool('VRCX_cropInstancePrints', false),
            configRepository.getBool('VRCX_saveInstanceStickers', false),
            configRepository.getBool('VRCX_avatarRemoteDatabase', true),
            configRepository.getBool('VRCX_enableAppLauncher', true),
            configRepository.getBool('VRCX_enableAppLauncherAutoClose', true),
            configRepository.getBool('VRCX_screenshotHelper', true),
            configRepository.getBool(
                'VRCX_screenshotHelperModifyFilename',
                false
            ),
            configRepository.getBool(
                'VRCX_screenshotHelperCopyToClipboard',
                false
            ),
            configRepository.getBool('VRCX_youtubeAPI', false),
            configRepository.getString('VRCX_youtubeAPIKey', ''),
            configRepository.getBool('VRCX_progressPie', false),
            configRepository.getBool('VRCX_progressPieFilter', true),
            configRepository.getBool(
                'VRCX_showConfirmationOnSwitchAvatar',
                false
            ),
            configRepository.getBool('VRCX_gameLogDisabled', false)
        ]);

        state.enablePrimaryPassword = enablePrimaryPassword;
        state.relaunchVRChatAfterCrash = relaunchVRChatAfterCrash;
        state.vrcQuitFix = vrcQuitFix;
        state.autoSweepVRChatCache = autoSweepVRChatCache;
        state.disableWorldDatabase = disableWorldDatabase === 'true';
        state.saveInstancePrints = saveInstancePrints;
        state.cropInstancePrints = cropInstancePrints;
        state.saveInstanceStickers = saveInstanceStickers;
        state.avatarRemoteDatabase = avatarRemoteDatabase;
        state.enableAppLauncher = enableAppLauncher;
        state.enableAppLauncherAutoClose = enableAppLauncherAutoClose;
        state.screenshotHelper = screenshotHelper;
        state.screenshotHelperModifyFilename = screenshotHelperModifyFilename;
        state.screenshotHelperCopyToClipboard = screenshotHelperCopyToClipboard;
        state.youTubeApi = youTubeApi;
        state.youTubeApiKey = youTubeApiKey;
        state.progressPie = progressPie;
        state.progressPieFilter = progressPieFilter;
        state.showConfirmationOnSwitchAvatar = showConfirmationOnSwitchAvatar;
        state.gameLogDisabled = gameLogDisabled === 'true';

        handleSetAppLauncherSettings();
    }

    const enablePrimaryPassword = computed({
        get: () => state.enablePrimaryPassword,
        set: (value) => (state.enablePrimaryPassword = value)
    });
    const relaunchVRChatAfterCrash = computed(
        () => state.relaunchVRChatAfterCrash
    );
    const vrcQuitFix = computed(() => state.vrcQuitFix);
    const autoSweepVRChatCache = computed(() => state.autoSweepVRChatCache);
    const disableWorldDatabase = computed(() => state.disableWorldDatabase);
    const saveInstancePrints = computed(() => state.saveInstancePrints);
    const cropInstancePrints = computed(() => state.cropInstancePrints);
    const saveInstanceStickers = computed(() => state.saveInstanceStickers);
    const avatarRemoteDatabase = computed(() => state.avatarRemoteDatabase);
    const enableAppLauncher = computed(() => state.enableAppLauncher);
    const enableAppLauncherAutoClose = computed(
        () => state.enableAppLauncherAutoClose
    );
    const screenshotHelper = computed(() => state.screenshotHelper);
    ``;
    const screenshotHelperModifyFilename = computed(
        () => state.screenshotHelperModifyFilename
    );
    const screenshotHelperCopyToClipboard = computed(
        () => state.screenshotHelperCopyToClipboard
    );
    const youTubeApi = computed(() => state.youTubeApi);
    const youTubeApiKey = computed({
        get: () => state.youTubeApiKey,
        set: (value) => (state.youTubeApiKey = value)
    });
    const progressPie = computed(() => state.progressPie);
    const progressPieFilter = computed(() => state.progressPieFilter);
    const showConfirmationOnSwitchAvatar = computed(
        () => state.showConfirmationOnSwitchAvatar
    );
    const gameLogDisabled = computed(() => state.gameLogDisabled);
    const sqliteTableSizes = computed(() => state.sqliteTableSizes);

    /**
     * @param {boolean} value
     */
    function setEnablePrimaryPasswordConfigRepository(value) {
        configRepository.setBool('enablePrimaryPassword', value);
    }
    function setRelaunchVRChatAfterCrash() {
        state.relaunchVRChatAfterCrash = !state.relaunchVRChatAfterCrash;
        configRepository.setBool(
            'VRCX_relaunchVRChatAfterCrash',
            state.relaunchVRChatAfterCrash
        );
    }
    function setVrcQuitFix() {
        state.vrcQuitFix = !state.vrcQuitFix;
        configRepository.setBool('VRCX_vrcQuitFix', state.vrcQuitFix);
    }
    function setAutoSweepVRChatCache() {
        state.autoSweepVRChatCache = !state.autoSweepVRChatCache;
        configRepository.setBool(
            'VRCX_autoSweepVRChatCache',
            state.autoSweepVRChatCache
        );
    }
    function setDisableWorldDatabase() {
        state.disableWorldDatabase = !state.disableWorldDatabase;
        VRCXStorage.Set(
            'VRCX_DisableWorldDatabase',
            state.disableWorldDatabase.toString()
        );
    }
    function setSaveInstancePrints() {
        state.saveInstancePrints = !state.saveInstancePrints;
        configRepository.setBool(
            'VRCX_saveInstancePrints',
            state.saveInstancePrints
        );
    }
    function setCropInstancePrints() {
        state.cropInstancePrints = !state.cropInstancePrints;
        configRepository.setBool(
            'VRCX_cropInstancePrints',
            state.cropInstancePrints
        );
    }
    function setSaveInstanceStickers() {
        state.saveInstanceStickers = !state.saveInstanceStickers;
        configRepository.setBool(
            'VRCX_saveInstanceStickers',
            state.saveInstanceStickers
        );
    }
    /**
     * @param {boolean} value
     */
    function setAvatarRemoteDatabase(value) {
        state.avatarRemoteDatabase = value;
        configRepository.setBool(
            'VRCX_avatarRemoteDatabase',
            state.avatarRemoteDatabase
        );
    }
    async function setEnableAppLauncher() {
        state.enableAppLauncher = !state.enableAppLauncher;
        await configRepository.setBool(
            'VRCX_enableAppLauncher',
            state.enableAppLauncher
        );
        handleSetAppLauncherSettings();
    }
    async function setEnableAppLauncherAutoClose() {
        state.enableAppLauncherAutoClose = !state.enableAppLauncherAutoClose;
        await configRepository.setBool(
            'VRCX_enableAppLauncherAutoClose',
            state.enableAppLauncherAutoClose
        );
        handleSetAppLauncherSettings();
    }
    async function setScreenshotHelper() {
        state.screenshotHelper = !state.screenshotHelper;
        await configRepository.setBool(
            'VRCX_screenshotHelper',
            state.screenshotHelper
        );
    }
    async function setScreenshotHelperModifyFilename() {
        state.screenshotHelperModifyFilename =
            !state.screenshotHelperModifyFilename;
        await configRepository.setBool(
            'VRCX_screenshotHelperModifyFilename',
            state.screenshotHelperModifyFilename
        );
    }
    async function setScreenshotHelperCopyToClipboard() {
        state.screenshotHelperCopyToClipboard =
            !state.screenshotHelperCopyToClipboard;
        await configRepository.setBool(
            'VRCX_screenshotHelperCopyToClipboard',
            state.screenshotHelperCopyToClipboard
        );
    }
    async function setYouTubeApi() {
        state.youTubeApi = !state.youTubeApi;
        await configRepository.setBool('VRCX_youtubeAPI', state.youTubeApi);
    }
    /**
     * @param {string} value
     */
    async function setYouTubeApiKey(value) {
        state.youTubeApiKey = value;
        await configRepository.setString(
            'VRCX_youtubeAPIKey',
            state.youTubeApiKey
        );
    }
    async function setProgressPie() {
        state.progressPie = !state.progressPie;
        await configRepository.setBool('VRCX_progressPie', state.progressPie);
    }
    async function setProgressPieFilter() {
        state.progressPieFilter = !state.progressPieFilter;
        await configRepository.setBool(
            'VRCX_progressPieFilter',
            state.progressPieFilter
        );
    }
    async function setShowConfirmationOnSwitchAvatar() {
        state.showConfirmationOnSwitchAvatar =
            !state.showConfirmationOnSwitchAvatar;
        await configRepository.setBool(
            'VRCX_showConfirmationOnSwitchAvatar',
            state.showConfirmationOnSwitchAvatar
        );
    }
    async function setGameLogDisabled() {
        state.gameLogDisabled = !state.gameLogDisabled;
        await configRepository.setBool(
            'VRCX_gameLogDisabled',
            state.gameLogDisabled
        );
    }

    async function getSqliteTableSizes() {
        const [
            gps,
            status,
            bio,
            avatar,
            onlineOffline,
            friendLogHistory,
            notification,
            location,
            joinLeave,
            portalSpawn,
            videoPlay,
            event,
            external
        ] = await Promise.all([
            database.getGpsTableSize(),
            database.getStatusTableSize(),
            database.getBioTableSize(),
            database.getAvatarTableSize(),
            database.getOnlineOfflineTableSize(),
            database.getFriendLogHistoryTableSize(),
            database.getNotificationTableSize(),
            database.getLocationTableSize(),
            database.getJoinLeaveTableSize(),
            database.getPortalSpawnTableSize(),
            database.getVideoPlayTableSize(),
            database.getEventTableSize(),
            database.getExternalTableSize()
        ]);

        state.sqliteTableSizes = {
            gps,
            status,
            bio,
            avatar,
            onlineOffline,
            friendLogHistory,
            notification,
            location,
            joinLeave,
            portalSpawn,
            videoPlay,
            event,
            external
        };
    }

    function handleSetAppLauncherSettings() {
        AppApi.SetAppLauncherSettings(
            state.enableAppLauncher,
            state.enableAppLauncherAutoClose
        );
    }

    /**
     * @param {boolean} videoId
     */
    async function lookupYouTubeVideo(videoId) {
        let data = null;
        let apiKey = 'AIzaSyA-iUQCpWf5afEL3NanEOSxbzziPMU3bxY';
        if (state.youTubeApiKey) {
            apiKey = state.youTubeApiKey;
        }
        try {
            const response = await webApiService.execute({
                url: `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(
                    videoId
                )}&part=snippet,contentDetails&key=${apiKey}`,
                method: 'GET',
                headers: {
                    Referer: 'https://vrcx.app'
                }
            });
            const json = JSON.parse(response.data);
            if (debugWebRequests.value) {
                console.log(json, response);
            }
            if (response.status === 200) {
                data = json;
            } else {
                throw new Error(`Error: ${response.data}`);
            }
        } catch {
            console.error(`YouTube video lookup failed for ${videoId}`);
        }
        return data;
    }

    initAdvancedSettings();

    return {
        state,

        enablePrimaryPassword,
        relaunchVRChatAfterCrash,
        vrcQuitFix,
        autoSweepVRChatCache,
        disableWorldDatabase,
        saveInstancePrints,
        cropInstancePrints,
        saveInstanceStickers,
        avatarRemoteDatabase,
        enableAppLauncher,
        enableAppLauncherAutoClose,
        screenshotHelper,
        screenshotHelperModifyFilename,
        screenshotHelperCopyToClipboard,
        youTubeApi,
        youTubeApiKey,
        progressPie,
        progressPieFilter,
        showConfirmationOnSwitchAvatar,
        gameLogDisabled,
        sqliteTableSizes,

        setEnablePrimaryPasswordConfigRepository,
        setRelaunchVRChatAfterCrash,
        setVrcQuitFix,
        setAutoSweepVRChatCache,
        setDisableWorldDatabase,
        setSaveInstancePrints,
        setCropInstancePrints,
        setSaveInstanceStickers,
        setAvatarRemoteDatabase,
        setEnableAppLauncher,
        setEnableAppLauncherAutoClose,
        setScreenshotHelper,
        setScreenshotHelperModifyFilename,
        setScreenshotHelperCopyToClipboard,
        setYouTubeApi,
        setYouTubeApiKey,
        setProgressPie,
        setProgressPieFilter,
        setShowConfirmationOnSwitchAvatar,
        setGameLogDisabled,

        getSqliteTableSizes,
        handleSetAppLauncherSettings,

        lookupYouTubeVideo
    };
});
