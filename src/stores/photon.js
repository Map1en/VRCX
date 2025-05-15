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

    async function initPhotonStates() {
        const [photonEventOverlay] = await Promise.all([
            configRepository.getBool('VRCX_PhotonEventOverlay', false)
        ]);

        state.photonEventOverlay = photonEventOverlay;
    }

    const photonLoggingEnabled = computed(() => state.photonLoggingEnabled);
    const photonEventOverlay = computed(() => state.photonEventOverlay);

    function setPhotonLoggingEnabled(value) {
        state.photonLoggingEnabled = value;
        configRepository.setBool('VRCX_photonLoggingEnabled', true);
    }
    function setPhotonEventOverlay(value) {
        state.photonEventOverlay = !state.photonEventOverlay;
        configRepository.setBool(
            'VRCX_PhotonEventOverlay',
            state.photonEventOverlay
        );
    }

    return {
        state,
        initPhotonStates,

        photonLoggingEnabled,
        photonEventOverlay,

        setPhotonLoggingEnabled,
        setPhotonEventOverlay
    };
});
