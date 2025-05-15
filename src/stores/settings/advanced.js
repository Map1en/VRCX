import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useAdvancedSettingsStore = defineStore('AdvancedSettings', () => {
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
        screenshotHelperCopyToClipboard: false
    });

    async function initSettings() {
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
            screenshotHelperCopyToClipboard
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
            )
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

        handleSetAppLauncherSettings();
    }

    // This one is a bit tricky to do without following the getter/action pattern
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

    function handleSetAppLauncherSettings() {
        AppApi.SetAppLauncherSettings(
            state.enableAppLauncher,
            state.enableAppLauncherAutoClose
        );
    }

    return {
        state,
        initSettings,

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

        handleSetAppLauncherSettings
    };
});
