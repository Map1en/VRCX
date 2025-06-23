import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { $app, API } from '../app';
import database from '../service/database';
import {
    formatSeconds,
    getGroupName,
    getWorldName,
    isRealInstance,
    parseLocation
} from '../shared/utils';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useUserStore } from './user';
import { useInstanceStore } from './instance';
import { useNotificationStore } from './notification';

export const useLocationStore = defineStore('Location', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const userStore = useUserStore();
    const instanceStore = useInstanceStore();
    const notificationStore = useNotificationStore();
    const state = reactive({
        lastLocation: {
            date: 0,
            location: '',
            name: '',
            playerList: new Map(),
            friendList: new Map()
        },
        lastLocation$: {
            tag: '',
            instanceId: '',
            accessType: '',
            worldName: '',
            worldCapacity: 0,
            joinUrl: '',
            statusName: '',
            statusImage: ''
        },
        lastLocationDestination: '',
        lastLocationDestinationTime: 0
    });

    const lastLocation = computed({
        get: () => state.lastLocation,
        set: (value) => {
            state.lastLocation = value;
        }
    });

    const lastLocation$ = computed({
        get: () => state.lastLocation$,
        set: (value) => {
            state.lastLocation$ = value;
        }
    });

    const lastLocationDestination = computed({
        get: () => state.lastLocationDestination,
        set: (value) => {
            state.lastLocationDestination = value;
        }
    });

    const lastLocationDestinationTime = computed({
        get: () => state.lastLocationDestinationTime,
        set: (value) => {
            state.lastLocationDestinationTime = value;
        }
    });

    function updateCurrentUserLocation() {
        const ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref === 'undefined') {
            return;
        }

        // update cached user with both gameLog and API locations
        let currentLocation = API.currentUser.$locationTag;
        const L = parseLocation(currentLocation);
        if (L.isTraveling) {
            currentLocation = API.currentUser.$travelingToLocation;
        }
        ref.location = API.currentUser.$locationTag;
        ref.travelingToLocation = API.currentUser.$travelingToLocation;

        if (
            $app.isGameRunning &&
            !advancedSettingsStore.gameLogDisabled &&
            state.lastLocation.location !== ''
        ) {
            // use gameLog instead of API when game is running
            currentLocation = state.lastLocation.location;
            if (state.lastLocation.location === 'traveling') {
                currentLocation = state.lastLocationDestination;
            }
            ref.location = state.lastLocation.location;
            ref.travelingToLocation = state.lastLocationDestination;
        }

        ref.$online_for = API.currentUser.$online_for;
        ref.$offline_for = API.currentUser.$offline_for;
        ref.$location = parseLocation(currentLocation);
        if (!$app.isGameRunning || advancedSettingsStore.gameLogDisabled) {
            ref.$location_at = API.currentUser.$location_at;
            ref.$travelingToTime = API.currentUser.$travelingToTime;
            userStore.applyUserDialogLocation();
            instanceStore.applyWorldDialogInstances();
            instanceStore.applyGroupDialogInstances();
        } else {
            ref.$location_at = state.lastLocation.date;
            ref.$travelingToTime = state.lastLocationDestinationTime;
            API.currentUser.$travelingToTime =
                state.lastLocationDestinationTime;
        }
    }

    async function setCurrentUserLocation(location, travelingToLocation) {
        API.currentUser.$location_at = Date.now();
        API.currentUser.$travelingToTime = Date.now();
        API.currentUser.$locationTag = location;
        API.currentUser.$travelingToLocation = travelingToLocation;
        updateCurrentUserLocation();

        // janky gameLog support for Quest
        if ($app.isGameRunning) {
            // with the current state of things, lets not run this if we don't need to
            return;
        }
        let lastLocation = '';
        for (let i = $app.gameLogSessionTable.length - 1; i > -1; i--) {
            const item = $app.gameLogSessionTable[i];
            if (item.type === 'Location') {
                lastLocation = item.location;
                break;
            }
        }
        if (lastLocation === location) {
            return;
        }
        state.lastLocationDestination = '';
        state.lastLocationDestinationTime = 0;

        if (isRealInstance(location)) {
            const dt = new Date().toJSON();
            const L = parseLocation(location);

            state.lastLocation.location = location;
            state.lastLocation.date = dt;

            const entry = {
                created_at: dt,
                type: 'Location',
                location,
                worldId: L.worldId,
                worldName: await getWorldName(L.worldId),
                groupName: await getGroupName(L.groupId),
                time: 0
            };
            database.addGamelogLocationToDatabase(entry);
            notificationStore.queueGameLogNoty(entry);
            $app.addGameLog(entry);
            $app.addInstanceJoinHistory(location, dt);

            userStore.applyUserDialogLocation();
            instanceStore.applyWorldDialogInstances();
            instanceStore.applyGroupDialogInstances();
        } else {
            state.lastLocation.location = '';
            state.lastLocation.date = '';
        }
    }

    function lastLocationReset(gameLogDate) {
        let dateTime = gameLogDate;
        if (!gameLogDate) {
            dateTime = new Date().toJSON();
        }
        const dateTimeStamp = Date.parse(dateTime);
        $app.photonLobby = new Map();
        $app.photonLobbyCurrent = new Map();
        $app.photonLobbyMaster = 0;
        $app.photonLobbyCurrentUser = 0;
        $app.photonLobbyUserData = new Map();
        $app.photonLobbyWatcherLoopStop();
        $app.photonLobbyAvatars = new Map();
        $app.photonLobbyLastModeration = new Map();
        $app.photonLobbyJointime = new Map();
        $app.photonLobbyActivePortals = new Map();
        $app.photonEvent7List = new Map();
        $app.photonLastEvent7List = '';
        $app.photonLastChatBoxMsg = new Map();
        $app.moderationEventQueue = new Map();
        if ($app.photonEventTable.data.length > 0) {
            $app.photonEventTablePrevious.data = $app.photonEventTable.data;
            $app.photonEventTable.data = [];
        }
        const playerList = Array.from(state.lastLocation.playerList.values());
        const dataBaseEntries = [];
        for (const ref of playerList) {
            const entry = {
                created_at: dateTime,
                type: 'OnPlayerLeft',
                displayName: ref.displayName,
                location: state.lastLocation.location,
                userId: ref.userId,
                time: dateTimeStamp - ref.joinTime
            };
            dataBaseEntries.unshift(entry);
            $app.addGameLog(entry);
        }
        database.addGamelogJoinLeaveBulk(dataBaseEntries);
        if (state.lastLocation.date !== 0) {
            const update = {
                time: dateTimeStamp - state.lastLocation.date,
                created_at: new Date(state.lastLocation.date).toJSON()
            };
            database.updateGamelogLocationTimeToDatabase(update);
        }
        state.lastLocationDestination = '';
        state.lastLocationDestinationTime = 0;
        state.lastLocation = {
            date: 0,
            location: '',
            name: '',
            playerList: new Map(),
            friendList: new Map()
        };
        state.updateCurrentUserLocation();
        instanceStore.updateCurrentInstanceWorld();
        $app.updateVRLastLocation();
        $app.getCurrentInstanceUserList();
        $app.lastVideoUrl = '';
        $app.lastResourceloadUrl = '';
        userStore.applyUserDialogLocation();
        instanceStore.applyWorldDialogInstances();
        instanceStore.applyGroupDialogInstances();
    }

    return {
        state,
        lastLocation,
        lastLocation$,
        lastLocationDestination,
        lastLocationDestinationTime,
        updateCurrentUserLocation,
        setCurrentUserLocation,
        lastLocationReset
    };
});
