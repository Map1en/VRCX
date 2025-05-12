import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../service/config';

export const useVRCXUpdaterStore = defineStore('VRCXUpdater', () => {
    const state = reactive({
        appVersion: '',
        autoUpdateVRCX: 'Auto Download',
        latestAppVersion: ''
    });

    async function initSettings() {
        const autoUpdateVRCX = await configRepository.getString(
            'VRCX_autoUpdateVRCX',
            'Auto Download'
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

    const latestAppVersion = computed(() => state.latestAppVersion);

    async function setAutoUpdateVRCX(value) {
        state.autoUpdateVRCX = value;
        await configRepository.setString('VRCX_autoUpdateVRCX', value);
    }

    function setLatestAppVersion(value) {
        state.latestAppVersion = value;
    }

    return {
        state,
        initSettings,

        appVersion,
        autoUpdateVRCX,
        latestAppVersion,

        setAutoUpdateVRCX,
        setLatestAppVersion
    };
});
