import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';
import configRepository from '../service/config';

export const usePhotonStore = defineStore('Photon', () => {
    const state = reactive({
        photonLoggingEnabled: false,
        photonEventOverlay: false,
        photonEventOverlayFilter: '',
        photonEventTableTypeOverlayFilter: '',
        photonEventTableTypeFilterList: [],
        timeoutHudOverlay: false,
        timeoutHudOverlayFilter: ''
    });

    const photonLoggingEnabled = computed(() => state.photonLoggingEnabled);

    function setPhotonLoggingEnabled(value) {
        state.photonLoggingEnabled = value;
        configRepository.setBool('VRCX_photonLoggingEnabled', true);
    }

    return {
        state,

        photonLoggingEnabled,

        setPhotonLoggingEnabled
    };
});
