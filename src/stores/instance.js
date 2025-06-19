import { defineStore, storeToRefs } from 'pinia';
import Vue, { computed, reactive } from 'vue';
import { instanceRequest, userRequest, worldRequest } from '../api';
import { $app, API } from '../app';
import configRepository from '../service/config';
import { instanceContentSettings } from '../shared/constants';
import {
    checkVRChatCache,
    compareByDisplayName,
    compareByLocationAt,
    getAvailablePlatforms,
    getBundleDateSize,
    hasGroupPermission,
    isRealInstance,
    parseLocation
} from '../shared/utils';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { useLocationStore } from './location';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useWorldStore } from './world';

export const useInstanceStore = defineStore('Instance', () => {
    const locationStore = useLocationStore();
    const { lastLocation } = storeToRefs(locationStore);
    const worldStore = useWorldStore();
    const { worldDialog } = storeToRefs(worldStore);
    const friendStore = useFriendStore();
    const { friends } = storeToRefs(friendStore);

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { instanceUsersSortAlphabetical } = storeToRefs(
        appearanceSettingsStore
    );

    const groupStore = useGroupStore();

    const state = reactive({
        cachedInstances: new Map(),
        currentInstanceWorld: {
            ref: {},
            instance: {},
            isPC: false,
            isQuest: false,
            isIos: false,
            avatarScalingDisabled: false,
            focusViewDisabled: false,
            inCache: false,
            cacheSize: '',
            bundleSizes: [],
            lastUpdated: ''
        },
        currentInstanceLocation: {}
    });

    const cachedInstances = computed({
        get() {
            return state.cachedInstances;
        },
        set(value) {
            state.cachedInstances = value;
        }
    });

    const currentInstanceWorld = computed({
        get: () => state.currentInstanceWorld,
        set: (value) => {
            state.currentInstanceWorld = value;
        }
    });

    const currentInstanceLocation = computed({
        get: () => state.currentInstanceLocation,
        set: (value) => {
            state.currentInstanceLocation = value;
        }
    });

    function updateCurrentInstanceWorld() {
        let L;
        let instanceId = lastLocation.value.location;
        if (lastLocation.value.location === 'traveling') {
            instanceId = $app.lastLocationDestination;
        }
        if (!instanceId) {
            state.currentInstanceWorld = {
                ref: {},
                instance: {},
                isPC: false,
                isQuest: false,
                isIos: false,
                avatarScalingDisabled: false,
                focusViewDisabled: false,
                inCache: false,
                cacheSize: '',
                bundleSizes: [],
                lastUpdated: ''
            };
            state.currentInstanceLocation = {};
        } else if (instanceId !== state.currentInstanceLocation.tag) {
            state.currentInstanceWorld = {
                ref: {},
                instance: {},
                isPC: false,
                isQuest: false,
                isIos: false,
                avatarScalingDisabled: false,
                focusViewDisabled: false,
                inCache: false,
                cacheSize: '',
                bundleSizes: [],
                lastUpdated: ''
            };
            L = parseLocation(instanceId);
            state.currentInstanceLocation = L;
            worldRequest
                .getWorld({
                    worldId: L.worldId
                })
                .then((args) => {
                    state.currentInstanceWorld.ref = args.ref;
                    let { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    state.currentInstanceWorld.isPC = isPC;
                    state.currentInstanceWorld.isQuest = isQuest;
                    state.currentInstanceWorld.isIos = isIos;
                    state.currentInstanceWorld.avatarScalingDisabled =
                        args.ref?.tags.includes(
                            'feature_avatar_scaling_disabled'
                        );
                    state.currentInstanceWorld.focusViewDisabled =
                        args.ref?.tags.includes('feature_focus_view_disabled');
                    checkVRChatCache(args.ref).then((cacheInfo) => {
                        if (cacheInfo.Item1 > 0) {
                            state.currentInstanceWorld.inCache = true;
                            state.currentInstanceWorld.cacheSize = `${(
                                cacheInfo.Item1 / 1048576
                            ).toFixed(2)} MB`;
                        }
                    });
                    getBundleDateSize(args.ref).then((bundleSizes) => {
                        state.currentInstanceWorld.bundleSizes = bundleSizes;
                    });
                    return args;
                });
        } else {
            worldRequest
                .getCachedWorld({
                    worldId: state.currentInstanceLocation.worldId
                })
                .then((args) => {
                    state.currentInstanceWorld.ref = args.ref;
                    const { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    state.currentInstanceWorld.isPC = isPC;
                    state.currentInstanceWorld.isQuest = isQuest;
                    state.currentInstanceWorld.isIos = isIos;
                    checkVRChatCache(args.ref).then((cacheInfo) => {
                        if (cacheInfo.Item1 > 0) {
                            state.currentInstanceWorld.inCache = true;
                            state.currentInstanceWorld.cacheSize = `${(
                                cacheInfo.Item1 / 1048576
                            ).toFixed(2)} MB`;
                        }
                    });
                });
        }
        if (isRealInstance(instanceId)) {
            const ref = $app.store.instance.cachedInstances.get(instanceId);
            if (typeof ref !== 'undefined') {
                state.currentInstanceWorld.instance = ref;
            } else {
                L = parseLocation(instanceId);
                if (L.isRealInstance) {
                    instanceRequest
                        .getInstance({
                            worldId: L.worldId,
                            instanceId: L.instanceId
                        })
                        .then((args) => {
                            state.currentInstanceWorld.instance = args.ref;
                        });
                }
            }
        }
    }

    /**
     * aka: `API.applyInstance`
     * @param {object} json
     * @returns {object} ref
     */
    function applyInstance(json) {
        let ref = state.cachedInstances.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                location: '',
                instanceId: '',
                name: '',
                worldId: '',
                type: '',
                ownerId: '',
                tags: [],
                active: false,
                full: false,
                n_users: 0,
                hasCapacityForYou: true, // not present depending on endpoint
                capacity: 0,
                recommendedCapacity: 0,
                userCount: 0,
                queueEnabled: false, // only present with group instance type
                queueSize: 0, // only present when queuing is enabled
                platforms: {},
                gameServerVersion: 0,
                hardClose: null, // boolean or null
                closedAt: null, // string or null
                secureName: '',
                shortName: '',
                world: {},
                users: [], // only present when you're the owner
                clientNumber: '',
                contentSettings: {},
                photonRegion: '',
                region: '',
                canRequestInvite: false,
                permanent: false,
                private: '', // part of instance tag
                hidden: '', // part of instance tag
                nonce: '', // only present when you're the owner
                strict: false, // deprecated
                displayName: null,
                groupAccessType: null, // only present with group instance type
                roleRestricted: false, // only present with group instance type
                instancePersistenceEnabled: null,
                playerPersistenceEnabled: null,
                ageGate: null,
                // VRCX
                $fetchedAt: '',
                $disabledContentSettings: [],
                ...json
            };
            state.cachedInstances.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
        }
        ref.$location = parseLocation(ref.location);
        if (json.world?.id) {
            worldRequest
                .getCachedWorld({
                    worldId: json.world.id
                })
                .then((args) => {
                    ref.world = args.ref;
                    return args;
                });
        }
        if (!json.$fetchedAt) {
            ref.$fetchedAt = new Date().toJSON();
        }
        ref.$disabledContentSettings = [];
        if (json.contentSettings && Object.keys(json.contentSettings).length) {
            for (const setting of instanceContentSettings) {
                if (
                    typeof json.contentSettings[setting] === 'undefined' ||
                    json.contentSettings[setting] === true
                ) {
                    continue;
                }
                ref.$disabledContentSettings.push(setting);
            }
        }
        return ref;
    }

    /**
     *
     * @param {string} worldId
     * @param {string} options
     * @returns {Promise<{json: *, params}|null>}
     */
    async function createNewInstance(worldId = '', options) {
        let D = options;

        if (!D) {
            D = {
                loading: false,
                accessType: await configRepository.getString(
                    'instanceDialogAccessType',
                    'public'
                ),
                region: await configRepository.getString(
                    'instanceRegion',
                    'US West'
                ),
                worldId: worldId,
                groupId: await configRepository.getString(
                    'instanceDialogGroupId',
                    ''
                ),
                groupAccessType: await configRepository.getString(
                    'instanceDialogGroupAccessType',
                    'plus'
                ),
                ageGate: await configRepository.getBool(
                    'instanceDialogAgeGate',
                    false
                ),
                queueEnabled: await configRepository.getBool(
                    'instanceDialogQueueEnabled',
                    true
                ),
                contentSettings: instanceContentSettings || [],
                selectedContentSettings: JSON.parse(
                    await configRepository.getString(
                        'instanceDialogSelectedContentSettings',
                        JSON.stringify(instanceContentSettings || [])
                    )
                ),
                roleIds: [],
                groupRef: {}
            };
        }

        let type = 'public';
        let canRequestInvite = false;
        switch (D.accessType) {
            case 'friends':
                type = 'friends';
                break;
            case 'friends+':
                type = 'hidden';
                break;
            case 'invite':
                type = 'private';
                break;
            case 'invite+':
                type = 'private';
                canRequestInvite = true;
                break;
            case 'group':
                type = 'group';
                break;
        }
        let region = 'us';
        if (D.region === 'US East') {
            region = 'use';
        } else if (D.region === 'Europe') {
            region = 'eu';
        } else if (D.region === 'Japan') {
            region = 'jp';
        }
        const contentSettings = {};
        for (const setting of D.contentSettings) {
            contentSettings[setting] =
                D.selectedContentSettings.includes(setting);
        }
        const params = {
            type,
            canRequestInvite,
            worldId: D.worldId,
            ownerId: API.currentUser.id,
            region,
            contentSettings
        };
        if (type === 'group') {
            params.groupAccessType = D.groupAccessType;
            params.ownerId = D.groupId;
            params.queueEnabled = D.queueEnabled;
            if (D.groupAccessType === 'members') {
                params.roleIds = D.roleIds;
            }
        }
        if (
            D.ageGate &&
            type === 'group' &&
            hasGroupPermission(D.groupRef, 'group-instance-age-gated-create')
        ) {
            params.ageGate = true;
        }
        try {
            const args = await instanceRequest.createInstance(params);
            return args;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function applyWorldDialogInstances() {
        let ref;
        let instance;
        const D = worldDialog.value;
        if (!D.visible) {
            return;
        }
        const instances = {};
        if (D.ref.instances) {
            for (instance of D.ref.instances) {
                // instance = [ instanceId, occupants ]
                const instanceId = instance[0];
                instances[instanceId] = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
            }
        }
        const { instanceId, shortName } = D.$location;
        if (instanceId && typeof instances[instanceId] === 'undefined') {
            instances[instanceId] = {
                id: instanceId,
                tag: `${D.id}:${instanceId}`,
                $location: {},
                friendCount: 0,
                users: [],
                shortName,
                ref: {}
            };
        }
        const cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
        const lastLocation$ = cachedCurrentUser.$location;
        const playersInInstance = lastLocation.value.playerList;
        if (lastLocation$.worldId === D.id && playersInInstance.size > 0) {
            // pull instance json from cache
            const friendsInInstance = lastLocation.value.friendList;
            instance = {
                id: lastLocation$.instanceId,
                tag: lastLocation$.tag,
                $location: {},
                friendCount: friendsInInstance.size,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[instance.id] = instance;
            for (const friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                const addUser = !instance.users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    ref = API.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        instance.users.push(ref);
                    }
                }
            }
        }
        for (const friend of friends.value.values()) {
            const { ref } = friend;
            if (
                typeof ref === 'undefined' ||
                typeof ref.$location === 'undefined' ||
                ref.$location.worldId !== D.id ||
                (ref.$location.instanceId === lastLocation$.instanceId &&
                    playersInInstance.size > 0 &&
                    ref.location !== 'traveling')
            ) {
                continue;
            }
            if (ref.location === lastLocation.value.location) {
                // don't add friends to currentUser gameLog instance (except when traveling)
                continue;
            }
            const { instanceId } = ref.$location;
            instance = instances[instanceId];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[instanceId] = instance;
            }
            instance.users.push(ref);
        }
        ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref !== 'undefined' && ref.$location.worldId === D.id) {
            const { instanceId } = ref.$location;
            instance = instances[instanceId];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[instanceId] = instance;
            }
            instance.users.push(ref); // add self
        }
        const rooms = [];
        for (instance of Object.values(instances)) {
            // due to references on callback of API.getUser()
            // this should be block scope variable
            const L = parseLocation(`${D.id}:${instance.id}`);
            instance.location = L.tag;
            if (!L.shortName) {
                L.shortName = instance.shortName;
            }
            instance.$location = L;
            if (L.userId) {
                ref = API.cachedUsers.get(L.userId);
                if (typeof ref === 'undefined') {
                    userRequest
                        .getUser({
                            userId: L.userId
                        })
                        .then((args) => {
                            Vue.set(L, 'user', args.ref);
                            return args;
                        });
                } else {
                    L.user = ref;
                }
            }
            if (instance.friendCount === 0) {
                instance.friendCount = instance.users.length;
            }
            if (instanceUsersSortAlphabetical.value) {
                instance.users.sort(compareByDisplayName);
            } else {
                instance.users.sort(compareByLocationAt);
            }
            rooms.push(instance);
        }
        // get instance from cache
        for (const room of rooms) {
            ref = state.cachedInstances.get(room.tag);
            if (typeof ref !== 'undefined') {
                room.ref = ref;
            }
        }
        rooms.sort(function (a, b) {
            // sort selected and current instance to top
            if (
                b.location === D.$location.tag ||
                b.location === lastLocation$.tag
            ) {
                // sort selected instance above current instance
                if (a.location === D.$location.tag) {
                    return -1;
                }
                return 1;
            }
            if (
                a.location === D.$location.tag ||
                a.location === lastLocation$.tag
            ) {
                // sort selected instance above current instance
                if (b.location === D.$location.tag) {
                    return 1;
                }
                return -1;
            }
            // sort by number of users when no friends in instance
            if (a.users.length === 0 && b.users.length === 0) {
                if (a.ref?.userCount < b.ref?.userCount) {
                    return 1;
                }
                return -1;
            }
            // sort by number of friends in instance
            if (a.users.length < b.users.length) {
                return 1;
            }
            return -1;
        });
        D.rooms = rooms;
        $app.updateTimers();
    }

    /**
     *
     * @param {object} inputInstances
     */
    function applyGroupDialogInstances(inputInstances) {
        const { groupDialog } = storeToRefs(groupStore);
        let ref;
        let instance;
        const D = groupDialog.value;
        if (!D.visible) {
            return;
        }
        const instances = {};
        for (instance of D.instances) {
            instances[instance.tag] = {
                ...instance,
                friendCount: 0,
                users: []
            };
        }
        if (typeof inputInstances !== 'undefined') {
            for (instance of inputInstances) {
                instances[instance.location] = {
                    id: instance.instanceId,
                    tag: instance.location,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: instance.shortName,
                    ref: instance
                };
            }
        }
        const cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
        const lastLocation$ = cachedCurrentUser.$location;
        const currentLocation = lastLocation$.tag;
        const playersInInstance = lastLocation.value.playerList;
        if (lastLocation$.groupId === D.id && playersInInstance.size > 0) {
            const friendsInInstance = lastLocation.value.friendList;
            instance = {
                id: lastLocation$.instanceId,
                tag: currentLocation,
                $location: {},
                friendCount: friendsInInstance.size,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[currentLocation] = instance;
            for (const friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                const addUser = !instance.users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    ref = API.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        instance.users.push(ref);
                    }
                }
            }
        }
        for (const friend of friends.value.values()) {
            const { ref } = friend;
            if (
                typeof ref === 'undefined' ||
                typeof ref.$location === 'undefined' ||
                ref.$location.groupId !== D.id ||
                (ref.$location.instanceId === lastLocation$.instanceId &&
                    playersInInstance.size > 0 &&
                    ref.location !== 'traveling')
            ) {
                continue;
            }
            if (ref.location === lastLocation.value.location) {
                // don't add friends to currentUser gameLog instance (except when traveling)
                continue;
            }
            const { instanceId, tag } = ref.$location;
            instance = instances[tag];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[tag] = instance;
            }
            instance.users.push(ref);
        }
        ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref !== 'undefined' && ref.$location.groupId === D.id) {
            const { instanceId, tag } = ref.$location;
            instance = instances[tag];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[tag] = instance;
            }
            instance.users.push(ref); // add self
        }
        const rooms = [];
        for (instance of Object.values(instances)) {
            // due to references on callback of API.getUser()
            // this should be block scope variable
            const L = parseLocation(instance.tag);
            instance.location = instance.tag;
            instance.$location = L;
            if (instance.friendCount === 0) {
                instance.friendCount = instance.users.length;
            }
            if (instanceUsersSortAlphabetical.value) {
                instance.users.sort(compareByDisplayName);
            } else {
                instance.users.sort(compareByLocationAt);
            }
            rooms.push(instance);
        }
        // get instance
        for (const room of rooms) {
            ref = cachedInstances.value.get(room.tag);
            if (typeof ref !== 'undefined') {
                room.ref = ref;
            } else if (isRealInstance(room.tag)) {
                instanceRequest.getInstance({
                    worldId: room.$location.worldId,
                    instanceId: room.$location.instanceId
                });
            }
        }
        rooms.sort(function (a, b) {
            // sort current instance to top
            if (b.location === currentLocation) {
                return 1;
            }
            if (a.location === currentLocation) {
                return -1;
            }
            // sort by number of users when no friends in instance
            if (a.users.length === 0 && b.users.length === 0) {
                if (a.ref?.userCount < b.ref?.userCount) {
                    return 1;
                }
                return -1;
            }
            // sort by number of friends in instance
            if (a.users.length < b.users.length) {
                return 1;
            }
            return -1;
        });
        D.instances = rooms;
        $app.updateTimers();
    }

    return {
        state,
        cachedInstances,
        currentInstanceWorld,
        currentInstanceLocation,
        applyInstance,
        updateCurrentInstanceWorld,
        createNewInstance,
        applyWorldDialogInstances,
        applyGroupDialogInstances
    };
});
