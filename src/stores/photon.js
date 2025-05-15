import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';
import configRepository from '../service/config';

export const usePhotonStore = defineStore('Photon', () => {
    const state = reactive({
        photonLoggingEnabled: false,
        photonEventOverlay: false,
        photonEventOverlayFilter: 'Everyone',
        photonEventTableTypeOverlayFilter: '',
        photonEventTableTypeFilterList: [],
        timeoutHudOverlay: false,
        timeoutHudOverlayFilter: ''
    });

    async function initPhotonStates() {
        const [photonEventOverlay, photonEventOverlayFilter] =
            await Promise.all([
                configRepository.getBool('VRCX_PhotonEventOverlay', false),
                configRepository.getString(
                    'VRCX_PhotonEventOverlayFilter',
                    'Everyone'
                )
            ]);

        state.photonEventOverlay = photonEventOverlay;
        state.photonEventOverlayFilter = photonEventOverlayFilter;
    }

    const photonLoggingEnabled = computed(() => state.photonLoggingEnabled);
    const photonEventOverlay = computed(() => state.photonEventOverlay);
    const photonEventOverlayFilter = computed(
        () => state.photonEventOverlayFilter
    );

    function setPhotonLoggingEnabled() {
        state.photonLoggingEnabled = !state.photonLoggingEnabled;
        configRepository.setBool('VRCX_photonLoggingEnabled', true);
    }
    function setPhotonEventOverlay() {
        state.photonEventOverlay = !state.photonEventOverlay;
        configRepository.setBool(
            'VRCX_PhotonEventOverlay',
            state.photonEventOverlay
        );
    }
    function setPhotonEventOverlayFilter() {
        state.photonEventOverlayFilter = !state.photonEventOverlayFilter;
        configRepository.setString(
            'VRCX_PhotonEventOverlayFilter',
            state.photonEventOverlayFilter
        );
    }

    return {
        state,
        initPhotonStates,

        photonLoggingEnabled,
        photonEventOverlay,
        photonEventOverlayFilter,

        setPhotonLoggingEnabled,
        setPhotonEventOverlay,
        setPhotonEventOverlayFilter
    };
});
