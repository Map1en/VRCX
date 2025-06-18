import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import { instanceRequest, worldRequest } from '../api';
import { $app } from '../app';
import {
    checkVRChatCache,
    getAvailablePlatforms,
    getBundleDateSize,
    isRealInstance,
    parseLocation
} from '../shared/utils';
import { useLocationStore } from './location';

export const useInstanceStore = defineStore('Instance', () => {
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
        const locationStore = useLocationStore();
        const { lastLocation } = storeToRefs(locationStore);
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
            for (let setting of $app.instanceContentSettings) {
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

    return {
        state,
        cachedInstances,
        currentInstanceWorld,
        currentInstanceLocation,
        applyInstance,
        updateCurrentInstanceWorld
    };
});
