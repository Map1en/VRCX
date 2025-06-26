import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { $app } from '../app';
import configRepository from '../service/config';
import { API } from '../service/eventBus';
import { useUserStore } from './user';
import { useVrStore } from './vr';

export const usePhotonStore = defineStore('Photon', () => {
    const vrStore = useVrStore();
    const userStore = useUserStore();
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
        photonEventIcon: false,
        photonLobbyTimeoutThreshold: 6000,
        photonOverlayMessageTimeout: 6000,
        photonEventTableTypeFilter: [],
        photonEventTable: {
            data: [],
            filters: [
                {
                    prop: ['displayName', 'text'],
                    value: ''
                },
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 10,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [5, 10, 15, 25, 50]
            }
        },
        photonEventTablePrevious: {
            data: [],
            filters: [
                {
                    prop: ['displayName', 'text'],
                    value: ''
                },
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
                }
            ],
            tableProps: {
                stripe: true,
                size: 'mini'
            },
            pageSize: 10,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [5, 10, 15, 25, 50]
            }
        },
        chatboxUserBlacklist: new Map(),
        photonEventTableFilter: '',
        photonLobby: new Map()
    });

    async function initPhotonStates() {
        const [
            photonEventOverlay,
            photonEventOverlayFilter,
            photonEventTableTypeOverlayFilter,
            timeoutHudOverlay,
            timeoutHudOverlayFilter,
            photonLobbyTimeoutThreshold,
            photonOverlayMessageTimeout,
            photonEventTableTypeFilter,
            chatboxUserBlacklist
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
            ),
            configRepository.getInt('VRCX_photonLobbyTimeoutThreshold', 6000),
            configRepository.getString(
                'VRCX_photonOverlayMessageTimeout',
                6000
            ),
            configRepository.getString('VRCX_photonEventTypeFilter', '[]'),
            configRepository.getString('VRCX_chatboxUserBlacklist')
        ]);

        state.photonEventOverlay = photonEventOverlay;
        state.photonEventOverlayFilter = photonEventOverlayFilter;
        state.photonEventTableTypeOverlayFilter = JSON.parse(
            photonEventTableTypeOverlayFilter
        );
        state.timeoutHudOverlay = timeoutHudOverlay;
        state.timeoutHudOverlayFilter = timeoutHudOverlayFilter;
        state.photonLobbyTimeoutThreshold = photonLobbyTimeoutThreshold;
        state.photonOverlayMessageTimeout = Number(photonOverlayMessageTimeout);
        state.photonEventTableTypeFilter = JSON.parse(
            photonEventTableTypeFilter
        );

        state.photonEventTable.filters[1].value =
            state.photonEventTableTypeFilter;
        state.photonEventTablePrevious.filters[1].value =
            state.photonEventTableTypeFilter;

        state.chatboxUserBlacklist = new Map(
            Object.entries(JSON.parse(chatboxUserBlacklist || '{}'))
        );
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
    const photonLobbyTimeoutThreshold = computed({
        get: () => state.photonLobbyTimeoutThreshold,
        set: (value) => {
            state.photonLobbyTimeoutThreshold = value;
            configRepository.setString(
                'VRCX_photonLobbyTimeoutThreshold',
                value
            );
        }
    });
    const photonOverlayMessageTimeout = computed({
        get: () => state.photonOverlayMessageTimeout,
        set: (value) => {
            state.photonOverlayMessageTimeout = value;
            configRepository.setString(
                'VRCX_photonOverlayMessageTimeout',
                value
            );
        }
    });
    const photonEventTableTypeFilter = computed({
        get: () => state.photonEventTableTypeFilter,
        set: (value) => {
            state.photonEventTableTypeFilter = value;
        }
    });

    const photonEventTable = computed({
        get: () => state.photonEventTable,
        set: (value) => {
            state.photonEventTable = value;
        }
    });

    const photonEventTablePrevious = computed({
        get: () => state.photonEventTablePrevious,
        set: (value) => {
            state.photonEventTablePrevious = value;
        }
    });
    const chatboxUserBlacklist = computed({
        get: () => state.chatboxUserBlacklist,
        set: (value) => {
            state.chatboxUserBlacklist = value;
        }
    });

    const photonEventTableFilter = computed({
        get: () => state.photonEventTableFilter,
        set: (value) => {
            state.photonEventTableFilter = value;
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

    async function saveEventOverlay(configKey = '') {
        if (configKey === 'VRCX_PhotonEventOverlay') {
            setPhotonEventOverlay();
        } else if (configKey === 'VRCX_TimeoutHudOverlay') {
            setTimeoutHudOverlay();
        }
        vrStore.updateOpenVR();
        vrStore.updateVRConfigVars();
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

    function checkChatboxBlacklist(msg) {
        for (let i = 0; i < this.chatboxBlacklist.length; ++i) {
            if (msg.includes(this.chatboxBlacklist[i])) {
                return true;
            }
        }
        return false;
    }

    async function saveChatboxUserBlacklist() {
        await configRepository.setString(
            'VRCX_chatboxUserBlacklist',
            JSON.stringify(Object.fromEntries(state.chatboxUserBlacklist))
        );
    }

    async function photonEventTableFilterChange() {
        state.photonEventTable.filters[0].value = state.photonEventTableFilter;
        state.photonEventTable.filters[1].value =
            state.photonEventTableTypeFilter;

        state.photonEventTablePrevious.filters[0].value =
            state.photonEventTableFilter;
        state.photonEventTablePrevious.filters[1].value =
            state.photonEventTableTypeFilter;

        await configRepository.setString(
            'VRCX_photonEventTypeFilter',
            JSON.stringify(state.photonEventTableTypeFilter)
        );
        // await configRepository.setString(
        //     'VRCX_photonEventTypeOverlayFilter',
        //     JSON.stringify(this.photonEventTableTypeOverlayFilter)
        // );
    }

    function showUserFromPhotonId(photonId) {
        if (photonId) {
            const ref = state.photonLobby.get(photonId);
            if (typeof ref !== 'undefined') {
                if (typeof ref.id !== 'undefined') {
                    userStore.showUserDialog(ref.id);
                } else if (typeof ref.displayName !== 'undefined') {
                    userStore.lookupUser(ref);
                }
            } else {
                $app.$message({
                    message: 'No user info available',
                    type: 'error'
                });
            }
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
        photonLobbyTimeoutThreshold,
        photonOverlayMessageTimeout,
        photonEventTableTypeFilter,
        photonEventTable,
        photonEventTablePrevious,
        chatboxUserBlacklist,
        photonEventTableFilter,

        setPhotonLoggingEnabled,
        setPhotonEventOverlay,
        setPhotonEventOverlayFilter,
        setPhotonEventTableTypeOverlayFilter,
        setTimeoutHudOverlay,
        setTimeoutHudOverlayFilter,
        getDisplayName,
        photonEventPulse,
        parseOperationResponse,
        saveEventOverlay,
        checkChatboxBlacklist,
        saveChatboxUserBlacklist,
        photonEventTableFilterChange,
        showUserFromPhotonId
    };
});
