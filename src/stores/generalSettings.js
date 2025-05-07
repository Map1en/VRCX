import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../service/config';

export const useGeneralSettingsStore = defineStore('GeneralSettings', () => {
    const state = reactive({
        isStartAtWindowsStartup: false,
        isStartAsMinimizedState: false,
        isCloseToTray: false,
        disableGpuAcceleration: false,
        disableVrOverlayGpuAcceleration: false,
        localFavoriteFriendsGroups: [],
        udonExceptionLogging: false,
        logResourceLoad: false,
        logEmptyAvatars: false
    });

    async function initSettings() {
        state.isStartAtWindowsStartup = await configRepository.getBool(
            'VRCX_StartAtWindowsStartup',
            false
        );

        state.isStartAsMinimizedState =
            (await VRCXStorage.Get('VRCX_StartAsMinimizedState')) === 'true';

        state.isCloseToTray =
            (await VRCXStorage.Get('VRCX_CloseToTray')) === 'true';
        if (await configRepository.getBool('VRCX_CloseToTray')) {
            // move back to JSON
            state.isCloseToTray =
                await configRepository.getBool('VRCX_CloseToTray');
            VRCXStorage.Set('VRCX_CloseToTray', state.isCloseToTray.toString());
            await configRepository.remove('VRCX_CloseToTray');
        }

        state.disableGpuAcceleration =
            (await VRCXStorage.Get('VRCX_DisableGpuAcceleration')) === 'true';

        state.disableVrOverlayGpuAcceleration =
            (await VRCXStorage.Get('VRCX_DisableVrOverlayGpuAcceleration')) ===
            'true';

        state.localFavoriteFriendsGroups = JSON.parse(
            await configRepository.getString(
                'VRCX_localFavoriteFriendsGroups',
                '[]'
            )
        );

        state.udonExceptionLogging = await configRepository.getBool(
            'VRCX_udonExceptionLogging',
            false
        );

        state.logResourceLoad = await configRepository.getBool(
            'VRCX_logResourceLoad',
            false
        );

        state.logEmptyAvatars = await configRepository.getBool(
            'VRCX_logEmptyAvatars',
            false
        );
    }

    const isStartAtWindowsStartup = computed(
        () => state.isStartAtWindowsStartup
    );
    const isStartAsMinimizedState = computed(
        () => state.isStartAsMinimizedState
    );
    const disableGpuAcceleration = computed(() => state.disableGpuAcceleration);
    const isCloseToTray = computed(() => state.isCloseToTray);
    const disableVrOverlayGpuAcceleration = computed(
        () => state.disableVrOverlayGpuAcceleration
    );
    const localFavoriteFriendsGroups = computed(
        () => state.localFavoriteFriendsGroups
    );
    const udonExceptionLogging = computed(() => state.udonExceptionLogging);
    const logResourceLoad = computed(() => state.logResourceLoad);
    const logEmptyAvatars = computed(() => state.logEmptyAvatars);

    function setIsStartAtWindowsStartup() {
        state.isStartAtWindowsStartup = !state.isStartAtWindowsStartup;
        configRepository.setBool(
            'VRCX_StartAtWindowsStartup',
            state.isStartAtWindowsStartup
        );
    }
    function setIsStartAsMinimizedState() {
        state.isStartAsMinimizedState = !state.isStartAsMinimizedState;
        VRCXStorage.Set(
            'VRCX_StartAsMinimizedState',
            state.isStartAsMinimizedState.toString()
        );
    }
    function setIsCloseToTray() {
        state.isCloseToTray = !state.isCloseToTray;
        VRCXStorage.Set('VRCX_CloseToTray', state.isCloseToTray.toString());
    }
    function setDisableGpuAcceleration() {
        state.disableGpuAcceleration = !state.disableGpuAcceleration;
        VRCXStorage.Set(
            'VRCX_DisableGpuAcceleration',
            state.disableGpuAcceleration.toString()
        );
    }
    function setDisableVrOverlayGpuAcceleration() {
        state.disableVrOverlayGpuAcceleration =
            !state.disableVrOverlayGpuAcceleration;
        VRCXStorage.Set(
            'VRCX_DisableVrOverlayGpuAcceleration',
            state.disableVrOverlayGpuAcceleration.toString()
        );
    }
    function setLocalFavoriteFriendsGroups(value) {
        state.localFavoriteFriendsGroups = value;
        configRepository.setString(
            'VRCX_localFavoriteFriendsGroups',
            JSON.stringify(value)
        );
    }
    function setUdonExceptionLogging() {
        state.udonExceptionLogging = !state.udonExceptionLogging;
        configRepository.setBool(
            'VRCX_udonExceptionLogging',
            state.udonExceptionLogging
        );
    }
    function setLogResourceLoad() {
        state.logResourceLoad = !state.logResourceLoad;
        configRepository.setBool('VRCX_logResourceLoad', state.logResourceLoad);
    }
    function setLogEmptyAvatars() {
        state.logEmptyAvatars = !state.logEmptyAvatars;
        configRepository.setBool('VRCX_logEmptyAvatars', state.logEmptyAvatars);
    }

    return {
        initSettings,
        isStartAtWindowsStartup,
        isStartAsMinimizedState,
        isCloseToTray,
        disableGpuAcceleration,
        disableVrOverlayGpuAcceleration,
        localFavoriteFriendsGroups,
        udonExceptionLogging,
        logResourceLoad,
        logEmptyAvatars,

        setIsStartAtWindowsStartup,
        setIsStartAsMinimizedState,
        setIsCloseToTray,
        setDisableGpuAcceleration,
        setDisableVrOverlayGpuAcceleration,
        setLocalFavoriteFriendsGroups,
        setUdonExceptionLogging,
        setLogResourceLoad,
        setLogEmptyAvatars
    };
});
