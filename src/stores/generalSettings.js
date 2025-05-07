import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../service/config';

export const useGeneralSettingsStore = defineStore('GeneralSettings', () => {
    const state = reactive({
        isStartAtWindowsStartup: false,
        isStartAsMinimizedState: false,
        isCloseToTray: false,
        disableGpuAcceleration: false,
        disableVrOverlayGpuAcceleration: false
    });

    async function initSettings() {
        const isStartAtWindowsStartup = await configRepository.getBool(
            'VRCX_StartAtWindowsStartup',
            false
        );
        state.isStartAtWindowsStartup = isStartAtWindowsStartup;

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

    return {
        initSettings,
        isStartAtWindowsStartup,
        isStartAsMinimizedState,
        isCloseToTray,
        disableGpuAcceleration,
        disableVrOverlayGpuAcceleration,

        setIsStartAtWindowsStartup,
        setIsStartAsMinimizedState,
        setIsCloseToTray,
        setDisableGpuAcceleration,
        setDisableVrOverlayGpuAcceleration
    };
});
