import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { $app, API } from '../app';
import database from '../service/database';
import {
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
        }
    });

    const lastLocation = computed({
        get: () => state.lastLocation,
        set: (value) => {
            state.lastLocation = value;
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
                currentLocation = $app.lastLocationDestination;
            }
            ref.location = state.lastLocation.location;
            ref.travelingToLocation = $app.lastLocationDestination;
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
            ref.$travelingToTime = $app.lastLocationDestinationTime;
            API.currentUser.$travelingToTime = $app.lastLocationDestinationTime;
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
        $app.lastLocationDestination = '';
        $app.lastLocationDestinationTime = 0;

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

    return {
        state,
        lastLocation,
        updateCurrentUserLocation,
        setCurrentUserLocation
    };
});
