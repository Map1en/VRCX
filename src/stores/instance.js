import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { worldRequest } from '../api';
import { $app } from '../app';
import { parseLocation } from '../shared/utils';

export const useInstanceStore = defineStore('Instance', () => {
    const state = reactive({
        cachedInstances: new Map()
    });

    const cachedInstances = computed({
        get() {
            return state.cachedInstances;
        },
        set(value) {
            state.cachedInstances = value;
        }
    });

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

    return { state, cachedInstances, applyInstance };
});
