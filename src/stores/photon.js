import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';
import configRepository from '../service/config';

export const usePhotonStore = defineStore('Photon', () => {
    const state = reactive({
        photonLoggingEnabled: false,
        photonEventOverlay: false,
        photonEventOverlayFilter: 'Everyone',
        photonEventTableTypeOverlayFilter: [],
        photonEventTableTypeFilterList: [
            'Event',
            'OnPlayerJoined',
            'OnPlayerLeft',
            'ChangeAvatar',
            'ChangeStatus',
            'ChangeGroup',
            'PortalSpawn',
            'DeletedPortal',
            'ChatBoxMessage',
            'Moderation',
            'Camera',
            'SpawnEmoji',
            'MasterMigrate'
        ],
        timeoutHudOverlay: false,
        timeoutHudOverlayFilter: 'Everyone'
    });

    async function initPhotonStates() {
        const [
            photonEventOverlay,
            photonEventOverlayFilter,
            photonEventTableTypeOverlayFilter,
            timeoutHudOverlay,
            timeoutHudOverlayFilter
        ] = await Promise.all([
            configRepository.getBool('VRCX_PhotonEventOverlay', false),
            configRepository.getString(
                'VRCX_PhotonEventOverlayFilter',
                'Everyone'
            ),
            configRepository.getString(
                'VRCX_photonEventTypeOverlayFilter',
                '[]'
            ),
            configRepository.getBool('VRCX_TimeoutHudOverlay', false),
            configRepository.getString(
                'VRCX_TimeoutHudOverlayFilter',
                'Everyone'
            )
        ]);

        state.photonEventOverlay = photonEventOverlay;
        state.photonEventOverlayFilter = photonEventOverlayFilter;
        state.photonEventTableTypeOverlayFilter = JSON.parse(
            photonEventTableTypeOverlayFilter
        );
        state.timeoutHudOverlay = timeoutHudOverlay;
        state.timeoutHudOverlayFilter = timeoutHudOverlayFilter;
    }

    const photonLoggingEnabled = computed(() => state.photonLoggingEnabled);
    const photonEventOverlay = computed(() => state.photonEventOverlay);
    const photonEventOverlayFilter = computed(
        () => state.photonEventOverlayFilter
    );
    const photonEventTableTypeOverlayFilter = computed(
        () => state.photonEventTableTypeOverlayFilter
    );
    const photonEventTableTypeFilterList = computed(
        () => state.photonEventTableTypeFilterList
    );
    const timeoutHudOverlay = computed(() => state.timeoutHudOverlay);
    const timeoutHudOverlayFilter = computed(
        () => state.timeoutHudOverlayFilter
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
    function setPhotonEventOverlayFilter(value) {
        state.photonEventOverlayFilter = value;
        configRepository.setString(
            'VRCX_PhotonEventOverlayFilter',
            state.photonEventOverlayFilter
        );
    }
    function setPhotonEventTableTypeOverlayFilter(value) {
        state.photonEventTableTypeOverlayFilter = value;
        configRepository.setString(
            'VRCX_photonEventTypeOverlayFilter',
            JSON.stringify(state.photonEventTableTypeOverlayFilter)
        );
    }
    function setTimeoutHudOverlay(value) {
        state.timeoutHudOverlay = !state.timeoutHudOverlay;
        configRepository.setBool('VRCX_TimeoutHudOverlay', value);
        if (!state.timeoutHudOverlay) {
            AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
        }
    }
    function setTimeoutHudOverlayFilter(value) {
        state.timeoutHudOverlayFilter = value;
        configRepository.setString(
            'VRCX_TimeoutHudOverlayFilter',
            state.timeoutHudOverlayFilter
        );
    }

    return {
        state,
        initPhotonStates,

        photonLoggingEnabled,
        photonEventOverlay,
        photonEventOverlayFilter,
        photonEventTableTypeOverlayFilter,
        photonEventTableTypeFilterList,
        timeoutHudOverlay,
        timeoutHudOverlayFilter,

        setPhotonLoggingEnabled,
        setPhotonEventOverlay,
        setPhotonEventOverlayFilter,
        setPhotonEventTableTypeOverlayFilter,
        setTimeoutHudOverlay,
        setTimeoutHudOverlayFilter
    };
});
