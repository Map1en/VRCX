import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import { favoriteRequest } from '../api';
import { $app } from '../app';
import API from '../classes/apiInit';
import database from '../service/database';
import { compareByName, removeFromArray } from '../shared/utils';
import { useAvatarStore } from './avatar';
import { useFriendStore } from './friend';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';
import { useWorldStore } from './world';

export const useFavoriteStore = defineStore('Favorite', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { sortFavorites } = storeToRefs(appearanceSettingsStore);
    const friendStore = useFriendStore();
    const { localFavoriteFriends } = storeToRefs(friendStore);
    const { updateLocalFavoriteFriends, updateSidebarFriendsList } =
        friendStore;
    const generalSettingsStore = useGeneralSettingsStore();
    const { localFavoriteFriendsGroups } = storeToRefs(generalSettingsStore);
    const avatarStore = useAvatarStore();
    const { avatarDialog } = storeToRefs(avatarStore);
    const worldStore = useWorldStore();
    const { worldDialog } = storeToRefs(worldStore);
    const state = reactive({
        isFavoriteGroupLoading: false,
        favoriteFriendGroups: [],
        cachedFavoriteGroups: new Map(),
        favoriteLimits: {
            maxFavoriteGroups: {
                avatar: 6,
                friend: 3,
                world: 4
            },
            maxFavoritesPerGroup: {
                avatar: 50,
                friend: 150,
                world: 100
            }
        },
        cachedFavoriteGroupsByTypeName: new Map(),
        cachedFavorites: new Map(),
        favoriteWorldGroups: [],
        favoriteAvatarGroups: [],
        isFavoriteLoading: false,
        friendImportDialogInput: '',
        worldImportDialogInput: '',
        avatarImportDialogInput: '',
        worldImportDialogVisible: false,
        avatarImportDialogVisible: false,
        friendImportDialogVisible: false,
        localWorldFavorites: {},
        localAvatarFavorites: {},
        localAvatarFavoritesList: [],
        localAvatarFavoriteGroups: [],
        favoriteDialog: {
            visible: false,
            loading: false,
            type: '',
            objectId: '',
            currentGroup: {}
        },
        favoriteObjects: new Map(),
        localWorldFavoriteGroups: [],
        localWorldFavoritesList: [],
        favoriteFriends_: [],
        favoriteFriendsSorted: [],
        favoriteWorlds_: [],
        favoriteWorldsSorted: [],
        favoriteAvatars_: [],
        favoriteAvatarsSorted: [],
        sortFavoriteFriends: false,
        sortFavoriteWorlds: false,
        sortFavoriteAvatars: false,
        cachedFavoritesByObjectId: new Map()
    });

    const favoriteFriends = computed(() => {
        if (state.sortFavoriteFriends) {
            state.sortFavoriteFriends = false;
            state.favoriteFriendsSorted.sort(compareByName);
        }
        if (sortFavorites.value) {
            return state.favoriteFriends_;
        }
        return state.favoriteFriendsSorted;
    });

    const favoriteWorlds = computed(() => {
        if (state.sortFavoriteWorlds) {
            state.sortFavoriteWorlds = false;
            state.favoriteWorldsSorted.sort(compareByName);
        }
        if (sortFavorites.value) {
            return state.favoriteWorlds_;
        }
        return state.favoriteWorldsSorted;
    });

    const favoriteAvatars = computed(() => {
        if (state.sortFavoriteAvatars) {
            state.sortFavoriteAvatars = false;
            state.favoriteAvatarsSorted.sort(compareByName);
        }
        if (sortFavorites.value) {
            return state.favoriteAvatars_;
        }
        return state.favoriteAvatarsSorted;
    });

    const isFavoriteGroupLoading = computed({
        get() {
            return state.isFavoriteGroupLoading;
        },
        set(value) {
            state.isFavoriteGroupLoading = value;
        }
    });

    const favoriteFriendGroups = computed({
        get() {
            return state.favoriteFriendGroups;
        },
        set(value) {
            state.favoriteFriendGroups = value;
        }
    });
    const favoriteWorldGroups = computed({
        get() {
            return state.favoriteWorldGroups;
        },
        set(value) {
            state.favoriteWorldGroups = value;
        }
    });
    const favoriteAvatarGroups = computed({
        get() {
            return state.favoriteAvatarGroups;
        },
        set(value) {
            state.favoriteAvatarGroups = value;
        }
    });

    const cachedFavoriteGroups = state.cachedFavoriteGroups;
    const cachedFavoriteGroupsByTypeName = state.cachedFavoriteGroupsByTypeName;
    const cachedFavorites = state.cachedFavorites;

    const favoriteLimits = computed({
        get() {
            return state.favoriteLimits;
        },
        set(value) {
            state.favoriteLimits = value;
        }
    });

    const isFavoriteLoading = computed({
        get() {
            return state.isFavoriteLoading;
        },
        set(value) {
            state.isFavoriteLoading = value;
        }
    });

    const friendImportDialogInput = computed({
        get() {
            return state.friendImportDialogInput;
        },
        set(value) {
            state.friendImportDialogInput = value;
        }
    });

    const worldImportDialogInput = computed({
        get() {
            return state.worldImportDialogInput;
        },
        set(value) {
            state.worldImportDialogInput = value;
        }
    });

    const avatarImportDialogInput = computed({
        get() {
            return state.avatarImportDialogInput;
        },
        set(value) {
            state.avatarImportDialogInput = value;
        }
    });

    const worldImportDialogVisible = computed({
        get() {
            return state.worldImportDialogVisible;
        },
        set(value) {
            state.worldImportDialogVisible = value;
        }
    });

    const avatarImportDialogVisible = computed({
        get() {
            return state.avatarImportDialogVisible;
        },
        set(value) {
            state.avatarImportDialogVisible = value;
        }
    });

    const friendImportDialogVisible = computed({
        get() {
            return state.friendImportDialogVisible;
        },
        set(value) {
            state.friendImportDialogVisible = value;
        }
    });

    const localWorldFavorites = computed({
        get() {
            return state.localWorldFavorites;
        },
        set(value) {
            state.localWorldFavorites = value;
        }
    });

    const localAvatarFavorites = computed({
        get() {
            return state.localAvatarFavorites;
        },
        set(value) {
            state.localAvatarFavorites = value;
        }
    });

    const localAvatarFavoritesList = computed({
        get() {
            return state.localAvatarFavoritesList;
        },
        set(value) {
            state.localAvatarFavoritesList = value;
        }
    });

    const localAvatarFavoriteGroups = computed({
        get() {
            return state.localAvatarFavoriteGroups;
        },
        set(value) {
            state.localAvatarFavoriteGroups = value;
        }
    });

    const favoriteDialog = computed({
        get() {
            return state.favoriteDialog;
        },
        set(value) {
            state.favoriteDialog = value;
        }
    });

    const favoriteObjects = computed({
        get() {
            return state.favoriteObjects;
        },
        set(value) {
            state.favoriteObjects = value;
        }
    });

    const localWorldFavoritesList = computed({
        get() {
            return state.localWorldFavoritesList;
        },
        set(value) {
            state.localWorldFavoritesList = value;
        }
    });

    const favoriteFriends_ = computed({
        get() {
            return state.favoriteFriends_;
        },
        set(value) {
            state.favoriteFriends_ = value;
        }
    });

    const favoriteFriendsSorted = computed({
        get() {
            return state.favoriteFriendsSorted;
        },
        set(value) {
            state.favoriteFriendsSorted = value;
        }
    });

    const favoriteWorlds_ = computed({
        get() {
            return state.favoriteWorlds_;
        },
        set(value) {
            state.favoriteWorlds_ = value;
        }
    });

    const favoriteWorldsSorted = computed({
        get() {
            return state.favoriteWorldsSorted;
        },
        set(value) {
            state.favoriteWorldsSorted = value;
        }
    });

    const favoriteAvatars_ = computed({
        get() {
            return state.favoriteAvatars_;
        },
        set(value) {
            state.favoriteAvatars_ = value;
        }
    });

    const favoriteAvatarsSorted = computed({
        get() {
            return state.favoriteAvatarsSorted;
        },
        set(value) {
            state.favoriteAvatarsSorted = value;
        }
    });

    const sortFavoriteFriends = computed({
        get() {
            return state.sortFavoriteFriends;
        },
        set(value) {
            state.sortFavoriteFriends = value;
        }
    });

    const sortFavoriteWorlds = computed({
        get() {
            return state.sortFavoriteWorlds;
        },
        set(value) {
            state.sortFavoriteWorlds = value;
        }
    });

    const sortFavoriteAvatars = computed({
        get() {
            return state.sortFavoriteAvatars;
        },
        set(value) {
            state.sortFavoriteAvatars = value;
        }
    });

    const cachedFavoritesByObjectId = computed({
        get() {
            return state.cachedFavoritesByObjectId;
        },
        set(value) {
            state.cachedFavoritesByObjectId = value;
        }
    });

    // const localFavoriteFriends = state.localFavoriteFriends;
    /**
     * aka: `$app.methods.applyFavorite`
     * @param {'friend' | 'world' | 'avatar'} type
     * @param {string} objectId
     * @param {boolean} sortTop
     * @returns {Promise<void>}
     */
    async function applyFavorite(type, objectId, sortTop) {
        let ref;
        const favorite = state.cachedFavoritesByObjectId.get(objectId);
        let ctx = state.favoriteObjects.get(objectId);
        if (typeof favorite !== 'undefined') {
            let isTypeChanged = false;
            if (typeof ctx === 'undefined') {
                ctx = {
                    id: objectId,
                    type,
                    groupKey: favorite.$groupKey,
                    ref: null,
                    name: '',
                    $selected: false
                };
                state.favoriteObjects.set(objectId, ctx);
                if (type === 'friend') {
                    ref = API.cachedUsers.get(objectId);
                    if (typeof ref === 'undefined') {
                        ref = $app.friendLog.get(objectId);
                        if (typeof ref !== 'undefined' && ref.displayName) {
                            ctx.name = ref.displayName;
                        }
                    } else {
                        ctx.ref = ref;
                        ctx.name = ref.displayName;
                    }
                } else if (type === 'world') {
                    ref = API.cachedWorlds.get(objectId);
                    if (typeof ref !== 'undefined') {
                        ctx.ref = ref;
                        ctx.name = ref.name;
                    }
                } else if (type === 'avatar') {
                    ref = API.cachedAvatars.get(objectId);
                    if (typeof ref !== 'undefined') {
                        ctx.ref = ref;
                        ctx.name = ref.name;
                    }
                }
                isTypeChanged = true;
            } else {
                if (ctx.type !== type) {
                    // WTF???
                    isTypeChanged = true;
                    if (type === 'friend') {
                        removeFromArray(state.favoriteFriends_, ctx);
                        removeFromArray(state.favoriteFriendsSorted, ctx);
                    } else if (type === 'world') {
                        removeFromArray(state.favoriteWorlds_, ctx);
                        removeFromArray(state.favoriteWorldsSorted, ctx);
                    } else if (type === 'avatar') {
                        removeFromArray(state.favoriteAvatars_, ctx);
                        removeFromArray(state.favoriteAvatarsSorted, ctx);
                    }
                }
                if (type === 'friend') {
                    ref = API.cachedUsers.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.displayName) {
                            ctx.name = ref.displayName;
                            state.sortFavoriteFriends = true;
                        }
                    }
                    // else too bad
                } else if (type === 'world') {
                    ref = API.cachedWorlds.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.name) {
                            ctx.name = ref.name;
                            state.sortFavoriteWorlds = true;
                        }
                    } else {
                        // try fetch from local world favorites
                        const world =
                            await database.getCachedWorldById(objectId);
                        if (world) {
                            ctx.ref = world;
                            ctx.name = world.name;
                            ctx.deleted = true;
                            state.sortFavoriteWorlds = true;
                        }
                        if (!world) {
                            // try fetch from local world history
                            const worldName =
                                await database.getGameLogWorldNameByWorldId(
                                    objectId
                                );
                            if (worldName) {
                                ctx.name = worldName;
                                ctx.deleted = true;
                                state.sortFavoriteWorlds = true;
                            }
                        }
                    }
                } else if (type === 'avatar') {
                    ref = API.cachedAvatars.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.name) {
                            ctx.name = ref.name;
                            state.sortFavoriteAvatars = true;
                        }
                    } else {
                        // try fetch from local avatar history
                        const avatar =
                            await database.getCachedAvatarById(objectId);
                        if (avatar) {
                            ctx.ref = avatar;
                            ctx.name = avatar.name;
                            ctx.deleted = true;
                            state.sortFavoriteAvatars = true;
                        }
                    }
                }
            }
            if (isTypeChanged) {
                if (sortTop) {
                    if (type === 'friend') {
                        state.favoriteFriends_.unshift(ctx);
                        state.favoriteFriendsSorted.push(ctx);
                        state.sortFavoriteFriends = true;
                    } else if (type === 'world') {
                        state.favoriteWorlds_.unshift(ctx);
                        state.favoriteWorldsSorted.push(ctx);
                        state.sortFavoriteWorlds = true;
                    } else if (type === 'avatar') {
                        state.favoriteAvatars_.unshift(ctx);
                        state.favoriteAvatarsSorted.push(ctx);
                        state.sortFavoriteAvatars = true;
                    }
                } else if (type === 'friend') {
                    state.favoriteFriends_.push(ctx);
                    state.favoriteFriendsSorted.push(ctx);
                    state.sortFavoriteFriends = true;
                } else if (type === 'world') {
                    state.favoriteWorlds_.push(ctx);
                    state.favoriteWorldsSorted.push(ctx);
                    state.sortFavoriteWorlds = true;
                } else if (type === 'avatar') {
                    state.favoriteAvatars_.push(ctx);
                    state.favoriteAvatarsSorted.push(ctx);
                    state.sortFavoriteAvatars = true;
                }
            }
        } else if (typeof ctx !== 'undefined') {
            state.favoriteObjects.delete(objectId);
            if (type === 'friend') {
                removeFromArray(state.favoriteFriends_, ctx);
                removeFromArray(state.favoriteFriendsSorted, ctx);
            } else if (type === 'world') {
                removeFromArray(state.favoriteWorlds_, ctx);
                removeFromArray(state.favoriteWorldsSorted, ctx);
            } else if (type === 'avatar') {
                removeFromArray(state.favoriteAvatars_, ctx);
                removeFromArray(state.favoriteAvatarsSorted, ctx);
            }
        }
    }

    /**
     * aka: `API.refreshFavoriteGroups`
     */
    function refreshFavoriteGroups() {
        if (state.isFavoriteGroupLoading) {
            return;
        }
        state.isFavoriteGroupLoading = true;
        expireFavoriteGroups();
        API.bulk({
            fn: favoriteRequest.getFavoriteGroups,
            N: -1,
            params: {
                n: 50,
                offset: 0
            },
            done(ok) {
                if (ok) {
                    deleteExpiredFavoriteGroups();
                    buildFavoriteGroups();
                }
                state.isFavoriteGroupLoading = false;
            }
        });
    }

    /**
     * aka: `API.expireFavoriteGroups`
     */
    function expireFavoriteGroups() {
        for (let ref of state.cachedFavoriteGroups.values()) {
            ref.$isExpired = true;
        }
    }

    /**
     * aka: `API.deleteExpiredFavoriteGroups`
     */
    function deleteExpiredFavoriteGroups() {
        for (let ref of state.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted || ref.$isExpired === false) {
                continue;
            }
            ref.$isDeleted = true;
            // It doesn't exist in the codebase?
            API.$emit('FAVORITE:GROUP:@DELETE', {
                ref,
                params: {
                    favoriteGroupId: ref.id
                }
            });
        }
    }

    /**
     * aka: `API.buildFavoriteGroups`
     */
    function buildFavoriteGroups() {
        let group;
        let groups;
        let ref;
        let i;
        // 450 = ['group_0', 'group_1', 'group_2'] x 150
        state.favoriteFriendGroups = [];
        for (i = 0; i < state.favoriteLimits.maxFavoriteGroups.friend; ++i) {
            state.favoriteFriendGroups.push({
                assign: false,
                key: `friend:group_${i}`,
                type: 'friend',
                name: `group_${i}`,
                displayName: `Group ${i + 1}`,
                capacity: state.favoriteLimits.maxFavoritesPerGroup.friend,
                count: 0,
                visibility: 'private'
            });
        }
        // 400 = ['worlds1', 'worlds2', 'worlds3', 'worlds4'] x 100
        state.favoriteWorldGroups = [];
        for (i = 0; i < state.favoriteLimits.maxFavoriteGroups.world; ++i) {
            state.favoriteWorldGroups.push({
                assign: false,
                key: `world:worlds${i + 1}`,
                type: 'world',
                name: `worlds${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: state.favoriteLimits.maxFavoritesPerGroup.world,
                count: 0,
                visibility: 'private'
            });
        }
        // 350 = ['avatars1', ...] x 50
        // Favorite Avatars (0/50)
        // VRC+ Group 1..5 (0/50)
        state.favoriteAvatarGroups = [];
        for (i = 0; i < state.favoriteLimits.maxFavoriteGroups.avatar; ++i) {
            state.favoriteAvatarGroups.push({
                assign: false,
                key: `avatar:avatars${i + 1}`,
                type: 'avatar',
                name: `avatars${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: state.favoriteLimits.maxFavoritesPerGroup.avatar,
                count: 0,
                visibility: 'private'
            });
        }
        const types = {
            friend: state.favoriteFriendGroups,
            world: state.favoriteWorldGroups,
            avatar: state.favoriteAvatarGroups
        };
        const assigns = new Set();
        // assign the same name first
        for (ref of state.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted) {
                continue;
            }
            groups = types[ref.type];
            if (typeof groups === 'undefined') {
                continue;
            }
            for (group of groups) {
                if (group.assign === false && group.name === ref.name) {
                    group.assign = true;
                    if (ref.displayName) {
                        group.displayName = ref.displayName;
                    }
                    group.visibility = ref.visibility;
                    ref.$groupRef = group;
                    assigns.add(ref.id);
                    break;
                }
            }
        }
        // assign the rest
        // FIXME
        // The order (cachedFavoriteGroups) is very important. It should be
        // processed in the order in which the server responded. But since we
        // used Map(), the order would be a mess. So we need something to solve
        // this.
        for (ref of state.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted || assigns.has(ref.id)) {
                continue;
            }
            groups = types[ref.type];
            if (typeof groups === 'undefined') {
                continue;
            }
            for (group of groups) {
                if (group.assign === false) {
                    group.assign = true;
                    group.key = `${group.type}:${ref.name}`;
                    group.name = ref.name;
                    group.displayName = ref.displayName;
                    ref.$groupRef = group;
                    assigns.add(ref.id);
                    break;
                }
            }
        }
        // update favorites
        state.cachedFavoriteGroupsByTypeName.clear();
        for (const type in types) {
            for (group of types[type]) {
                state.cachedFavoriteGroupsByTypeName.set(group.key, group);
            }
        }
        for (ref of state.cachedFavorites.values()) {
            ref.$groupRef = null;
            if (ref.$isDeleted) {
                continue;
            }
            group = state.cachedFavoriteGroupsByTypeName.get(ref.$groupKey);
            if (typeof group === 'undefined') {
                continue;
            }
            ref.$groupRef = group;
            ++group.count;
        }
    }

    /**
     * aka: `API.refreshFavorites`
     *
     * @returns {Promise<void>}
     */
    async function refreshFavorites() {
        if (state.isFavoriteLoading) {
            return;
        }
        state.isFavoriteLoading = true;
        try {
            const args = await favoriteRequest.getFavoriteLimits();
            // API.$on('FAVORITE:LIMITS', function (args) {
            state.favoriteLimits = {
                ...state.favoriteLimits,
                ...args.json
            };
            // });
        } catch (err) {
            console.error(err);
        }
        API.expireFavorites();
        state.cachedFavoriteGroupsByTypeName.clear();
        API.bulk({
            fn: favoriteRequest.getFavorites,
            N: -1,
            params: {
                n: 50,
                offset: 0
            },
            done(ok) {
                if (ok) {
                    deleteExpiredFavorites();
                }
                refreshFavoriteItems();
                refreshFavoriteGroups();
                updateLocalFavoriteFriends();
                state.isFavoriteLoading = false;
            }
        });
    }

    /**
     * aka: `API.applyFavoriteGroup`
     *
     * @param json
     * @returns {any}
     */
    function applyFavoriteGroup(json) {
        let ref = state.cachedFavoriteGroups.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                ownerId: '',
                ownerDisplayName: '',
                name: '',
                displayName: '',
                type: '',
                visibility: '',
                tags: [],
                // VRCX
                $isDeleted: false,
                $isExpired: false,
                $groupRef: null,
                //
                ...json
            };
            state.cachedFavoriteGroups.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        return ref;
    }

    /**
     * aka: `API.applyFavorite`
     * @param json
     * @returns {any}
     */
    function applyFavoriteCached(json) {
        let ref = state.cachedFavorites.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                type: '',
                favoriteId: '',
                tags: [],
                // VRCX
                $isDeleted: false,
                $isExpired: false,
                $groupKey: '',
                $groupRef: null,
                //
                ...json
            };
            state.cachedFavorites.set(ref.id, ref);
            state.cachedFavoritesByObjectId.set(ref.favoriteId, ref);
            if (
                ref.type === 'friend' &&
                (localFavoriteFriendsGroups.value.length === 0 ||
                    localFavoriteFriendsGroups.value.includes(ref.groupKey))
            ) {
                localFavoriteFriends.value.add(ref.favoriteId);
                updateSidebarFriendsList();
            }
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        ref.$groupKey = `${ref.type}:${String(ref.tags[0])}`;

        if (ref.$isDeleted === false && ref.$groupRef === null) {
            const group = state.cachedFavoriteGroupsByTypeName.get(
                ref.$groupKey
            );
            if (typeof group !== 'undefined') {
                ref.$groupRef = group;
                ++group.count;
            }
        }
        return ref;
    }

    /**
     * aka: `API.deleteExpiredFavorites`
     */
    function deleteExpiredFavorites() {
        for (let ref of state.cachedFavorites.values()) {
            if (ref.$isDeleted || ref.$isExpired === false) {
                continue;
            }
            ref.$isDeleted = true;
            API.$emit('FAVORITE:@DELETE', {
                ref,
                params: {
                    favoriteId: ref.id
                }
            });
        }
    }

    /**
     * aka: `API.refreshFavoriteAvatars`
     * @param tag
     */
    function refreshFavoriteAvatars(tag) {
        const n = Math.floor(Math.random() * (50 + 1)) + 50;
        const params = {
            n,
            offset: 0,
            tag
        };
        favoriteRequest.getFavoriteAvatars(params);
    }

    /**
     * aka: `API.refreshFavoriteItems`
     */
    function refreshFavoriteItems() {
        const types = {
            world: [0, favoriteRequest.getFavoriteWorlds],
            avatar: [0, favoriteRequest.getFavoriteAvatars]
        };
        const tags = [];
        for (const ref of state.cachedFavorites.values()) {
            if (ref.$isDeleted) {
                continue;
            }
            const type = types[ref.type];
            if (typeof type === 'undefined') {
                continue;
            }
            if (ref.type === 'avatar' && !tags.includes(ref.tags[0])) {
                tags.push(ref.tags[0]);
            }
            ++type[0];
        }
        for (const type in types) {
            const [N, fn] = types[type];
            if (N > 0) {
                if (type === 'avatar') {
                    for (const tag of tags) {
                        const n = Math.floor(Math.random() * (50 + 1)) + 50;
                        API.bulk({
                            fn,
                            N,
                            params: {
                                n,
                                offset: 0,
                                tag
                            }
                        });
                    }
                } else {
                    const n = Math.floor(Math.random() * (36 + 1)) + 64;
                    API.bulk({
                        fn,
                        N,
                        params: {
                            n,
                            offset: 0
                        }
                    });
                }
            }
        }
    }

    /**
     * aka: `$app.methods.bulkCopyFavoriteSelection`
     * @param {'friend'|'world'|'avatar'} type
     */
    function bulkCopyFavoriteSelection(type) {
        let idList = '';
        switch (type) {
            case 'friend':
                for (const ctx of state.favoriteFriends) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                state.friendImportDialogInput = idList;
                showFriendImportDialog();
                break;

            case 'world':
                for (const ctx of state.favoriteWorlds) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                state.worldImportDialogInput = idList;
                showWorldImportDialog();
                break;

            case 'avatar':
                for (const ctx of state.favoriteAvatars) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                state.avatarImportDialogInput = idList;
                showAvatarImportDialog();
                break;

            default:
                break;
        }
        console.log('Favorite selection\n', idList);
    }

    /**
     * aka: `$app.methods.clearBulkFavoriteSelection`
     */
    function clearBulkFavoriteSelection() {
        let ctx;
        for (ctx of state.favoriteFriends) {
            ctx.$selected = false;
        }
        for (ctx of state.favoriteWorlds) {
            ctx.$selected = false;
        }
        for (ctx of state.favoriteAvatars) {
            ctx.$selected = false;
        }
    }

    function showWorldImportDialog() {
        state.worldImportDialogVisible = true;
    }

    function showAvatarImportDialog() {
        state.avatarImportDialogVisible = true;
    }

    function showFriendImportDialog() {
        state.friendImportDialogVisible = true;
    }

    /**
     * aka: `$app.methods.getLocalWorldFavoriteGroupLength`
     * @param {string} group
     * @returns {*|number}
     */
    function getLocalWorldFavoriteGroupLength(group) {
        const favoriteGroup = state.localWorldFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    }

    /**
     * aka: `$app.methods.addLocalWorldFavorite`
     * @param {string} worldId
     * @param {string} group
     */
    function addLocalWorldFavorite(worldId, group) {
        if (hasLocalWorldFavorite(worldId, group)) {
            return;
        }
        const ref = API.cachedWorlds.get(worldId);
        if (typeof ref === 'undefined') {
            return;
        }
        if (!state.localWorldFavoritesList.includes(worldId)) {
            state.localWorldFavoritesList.push(worldId);
        }
        if (!state.localWorldFavorites[group]) {
            state.localWorldFavorites[group] = [];
        }
        if (!state.localWorldFavoriteGroups.includes(group)) {
            state.localWorldFavoriteGroups.push(group);
        }
        state.localWorldFavorites[group].unshift(ref);
        database.addWorldToCache(ref);
        database.addWorldToFavorites(worldId, group);
        if (
            state.favoriteDialog.visible &&
            state.favoriteDialog.objectId === worldId
        ) {
            updateFavoriteDialog(worldId);
        }
        if (worldDialog.value.visible && worldDialog.value.id === worldId) {
            worldDialog.value.isFavorite = true;
        }
    }

    /**
     * aka: `$app.methods.hasLocalWorldFavorite`
     * @param {string} worldId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalWorldFavorite(worldId, group) {
        const favoriteGroup = state.localWorldFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        for (let i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === worldId) {
                return true;
            }
        }
        return false;
    }

    /**
     * aka: `$app.methods.addLocalAvatarFavorite`
     * @param {string} avatarId
     * @param {string} group
     */
    function addLocalAvatarFavorite(avatarId, group) {
        if (hasLocalAvatarFavorite(avatarId, group)) {
            return;
        }
        const ref = API.cachedAvatars.get(avatarId);
        if (typeof ref === 'undefined') {
            return;
        }
        if (!state.localAvatarFavoritesList.includes(avatarId)) {
            state.localAvatarFavoritesList.push(avatarId);
        }
        if (!state.localAvatarFavorites[group]) {
            state.localAvatarFavorites[group] = [];
        }
        if (!state.localAvatarFavoriteGroups.includes(group)) {
            state.localAvatarFavoriteGroups.push(group);
        }
        state.localAvatarFavorites[group].unshift(ref);
        database.addAvatarToCache(ref);
        database.addAvatarToFavorites(avatarId, group);
        if (
            state.favoriteDialog.visible &&
            state.favoriteDialog.objectId === avatarId
        ) {
            updateFavoriteDialog(avatarId);
        }
        if (avatarDialog.value.visible && avatarDialog.value.id === avatarId) {
            avatarDialog.value.isFavorite = true;
        }
    }

    /**
     * aka: `$app.methods.hasLocalAvatarFavorite`
     * @param {string} avatarId
     * @param {string} group
     * @returns {boolean}
     */
    function hasLocalAvatarFavorite(avatarId, group) {
        const favoriteGroup = state.localAvatarFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        for (let i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === avatarId) {
                return true;
            }
        }
        return false;
    }

    /**
     * aka: `$app.methods.getLocalAvatarFavoriteGroupLength`
     * @param {string} group
     * @returns {*|number}
     */
    function getLocalAvatarFavoriteGroupLength(group) {
        const favoriteGroup = state.localAvatarFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    }

    function updateFavoriteDialog(objectId) {
        const D = state.favoriteDialog;
        if (!D.visible || D.objectId !== objectId) {
            return;
        }
        D.currentGroup = {};
        const favorite = state.favoriteObjects.get(objectId);
        if (favorite) {
            let group;
            for (group of API.favoriteWorldGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
            for (group of state.favoriteAvatarGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
            for (group of state.favoriteFriendGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
        }
    }

    return {
        state,

        favoriteFriends,
        favoriteWorlds,
        favoriteAvatars,
        isFavoriteGroupLoading,
        favoriteFriendGroups,
        cachedFavoriteGroups,
        cachedFavoriteGroupsByTypeName,
        favoriteLimits,
        cachedFavorites,
        favoriteWorldGroups,
        favoriteAvatarGroups,
        isFavoriteLoading,
        friendImportDialogInput,
        worldImportDialogInput,
        avatarImportDialogInput,
        worldImportDialogVisible,
        avatarImportDialogVisible,
        friendImportDialogVisible,
        localWorldFavorites,
        localAvatarFavorites,
        localAvatarFavoritesList,
        localAvatarFavoriteGroups,
        favoriteDialog,
        favoriteObjects,
        localWorldFavoritesList,
        favoriteFriends_,
        favoriteFriendsSorted,
        favoriteWorlds_,
        favoriteWorldsSorted,
        favoriteAvatars_,
        favoriteAvatarsSorted,
        sortFavoriteFriends,
        sortFavoriteWorlds,
        sortFavoriteAvatars,
        cachedFavoritesByObjectId,
        // localFavoriteFriends,

        applyFavorite,
        refreshFavoriteGroups,
        refreshFavorites,
        applyFavoriteGroup,
        applyFavoriteCached,
        refreshFavoriteAvatars,
        clearBulkFavoriteSelection,
        showWorldImportDialog,
        showAvatarImportDialog,
        showFriendImportDialog,
        bulkCopyFavoriteSelection,
        getLocalWorldFavoriteGroupLength,
        addLocalWorldFavorite,
        hasLocalWorldFavorite,
        hasLocalAvatarFavorite,
        addLocalAvatarFavorite,
        getLocalAvatarFavoriteGroupLength,
        updateFavoriteDialog
    };
});
