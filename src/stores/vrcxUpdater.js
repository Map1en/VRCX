import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../service/config';

export const useVRCXUpdaterStore = defineStore('VRCXUpdater', () => {
    const state = reactive({
        appVersion: '',
        autoUpdateVRCX: 'Auto Download'
    });

    async function initSettings() {
        const autoUpdateVRCX = await configRepository.getString(
            'VRCX_autoUpdateVRCX'
        );

        if (autoUpdateVRCX === 'Auto Install') {
            state.autoUpdateVRCX = 'Auto Download';
        } else {
            state.autoUpdateVRCX = autoUpdateVRCX;
        }

        state.appVersion = await AppApi.GetVersion();
    }

    const appVersion = computed(() => state.appVersion);

    const autoUpdateVRCX = computed(() => state.autoUpdateVRCX);

    async function setAutoUpdateVRCX(value) {
        state.autoUpdateVRCX = value;
        await configRepository.setString('VRCX_autoUpdateVRCX', value);
    }

    return {
        state,
        initSettings,
        appVersion,
        autoUpdateVRCX,
        setAutoUpdateVRCX
    };
});
