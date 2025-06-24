import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { $app, API } from '../app';
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
        timeoutHudOverlayFilter: 'Everyone',
        photonEventCount: 0,
        photonEventIcon: false
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

    initPhotonStates();

    const photonLoggingEnabled = computed(() => state.photonLoggingEnabled);
    const photonEventOverlay = computed(() => state.photonEventOverlay);
    const photonEventOverlayFilter = computed(
        () => state.photonEventOverlayFilter
    );
    const photonEventTableTypeOverlayFilter = computed(
        () => state.photonEventTableTypeOverlayFilter
    );
    const timeoutHudOverlay = computed(() => state.timeoutHudOverlay);
    const timeoutHudOverlayFilter = computed(
        () => state.timeoutHudOverlayFilter
    );
    const photonEventIcon = computed({
        get: () => state.photonEventIcon,
        set: (value) => {
            state.photonEventIcon = value;
        }
    });

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

    function getDisplayName(userId) {
        if (userId) {
            const ref = API.cachedUsers.get(userId);
            if (ref.displayName) {
                return ref.displayName;
            }
        }
        return '';
    }
    function photonEventPulse() {
        state.photonEventCount++;
        state.photonEventIcon = true;
        workerTimers.setTimeout(() => (state.photonEventIcon = false), 150);
    }

    function parseOperationResponse(data, dateTime) {
        switch (data.OperationCode) {
            case 226:
                if (
                    typeof data.Parameters[248] !== 'undefined' &&
                    typeof data.Parameters[248][248] !== 'undefined'
                ) {
                    $app.setPhotonLobbyMaster(data.Parameters[248][248]);
                }
                if (typeof data.Parameters[254] !== 'undefined') {
                    $app.photonLobbyCurrentUser = data.Parameters[254];
                }
                if (typeof data.Parameters[249] !== 'undefined') {
                    for (const i in data.Parameters[249]) {
                        const id = parseInt(i, 10);
                        const user = data.Parameters[249][i];
                        $app.parsePhotonUser(id, user.user, dateTime);
                        $app.parsePhotonAvatarChange(
                            id,
                            user.user,
                            user.avatarDict,
                            dateTime
                        );
                        $app.parsePhotonGroupChange(
                            id,
                            user.user,
                            user.groupOnNameplate,
                            dateTime
                        );
                        $app.parsePhotonAvatar(user.avatarDict);
                        $app.parsePhotonAvatar(user.favatarDict);
                        let hasInstantiated = false;
                        const lobbyJointime = $app.photonLobbyJointime.get(id);
                        if (typeof lobbyJointime !== 'undefined') {
                            hasInstantiated = lobbyJointime.hasInstantiated;
                        }
                        $app.photonLobbyJointime.set(id, {
                            joinTime: Date.parse(dateTime),
                            hasInstantiated,
                            inVRMode: user.inVRMode,
                            avatarEyeHeight: user.avatarEyeHeight,
                            canModerateInstance: user.canModerateInstance,
                            groupOnNameplate: user.groupOnNameplate,
                            showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                            showSocialRank: user.showSocialRank,
                            useImpostorAsFallback: user.useImpostorAsFallback,
                            platform: user.platform
                        });
                    }
                }
                if (typeof data.Parameters[252] !== 'undefined') {
                    $app.parsePhotonLobbyIds(data.Parameters[252]);
                }
                $app.photonEvent7List = new Map();
                break;
        }
    }

    return {
        state,

        photonLoggingEnabled,
        photonEventOverlay,
        photonEventOverlayFilter,
        photonEventTableTypeOverlayFilter,
        timeoutHudOverlay,
        timeoutHudOverlayFilter,
        photonEventIcon,

        setPhotonLoggingEnabled,
        setPhotonEventOverlay,
        setPhotonEventOverlayFilter,
        setPhotonEventTableTypeOverlayFilter,
        setTimeoutHudOverlay,
        setTimeoutHudOverlayFilter,
        getDisplayName,
        photonEventPulse,
        parseOperationResponse
    };
});
