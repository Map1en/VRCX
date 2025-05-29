import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { friendRequest, userRequest } from '../api';
import { $app } from '../app';
import API from '../classes/apiInit';
import database from '../service/database';
import {
    getFriendsSortFunction,
    getGroupName,
    getWorldName,
    isRealInstance,
    removeFromArray
} from '../shared/utils';
import { useDebugStore } from './debug';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';

export const useFriendStore = defineStore('Friend', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { sidebarSortMethods } = storeToRefs(appearanceSettingsStore);
    const generalSettingsStore = useGeneralSettingsStore();
    const { localFavoriteFriendsGroups } = storeToRefs(generalSettingsStore);
    const { setLocalFavoriteFriendsGroups } = generalSettingsStore;
    const debugStore = useDebugStore();
    const { debugFriendState } = storeToRefs(debugStore);

    const state = reactive({
        friends: new Map(),
        onlineFriends_: [],
        vipFriends_: [],
        activeFriends_: [],
        offlineFriends_: [],
        sortOnlineFriends: false,
        sortVIPFriends: false,
        sortActiveFriends: false,
        sortOfflineFriends: false,
        localFavoriteFriends: new Set(),
        friendLogInitStatus: false,
        isRefreshFriendsLoading: false,
        pendingActiveFriends: new Set(),
        onlineFriendCount: 0
    });

    const friends = state.friends;

    // friends_(array) may not have change records in pinia because does not use action
    const onlineFriends_ = computed({
        get() {
            return state.onlineFriends_;
        },
        set(value) {
            state.onlineFriends_ = value;
        }
    });
    const vipFriends_ = computed({
        get() {
            return state.vipFriends_;
        },
        set(value) {
            state.vipFriends_ = value;
        }
    });
    const activeFriends_ = computed({
        get() {
            return state.activeFriends_;
        },
        set(value) {
            state.activeFriends_ = value;
        }
    });
    const offlineFriends_ = computed({
        get() {
            return state.offlineFriends_;
        },
        set(value) {
            state.offlineFriends_ = value;
        }
    });
    const sortOnlineFriends = computed({
        get() {
            return state.sortOnlineFriends;
        },
        set(value) {
            state.sortOnlineFriends = value;
        }
    });
    const sortVIPFriends = computed({
        get() {
            return state.sortVIPFriends;
        },
        set(value) {
            state.sortVIPFriends = value;
        }
    });
    const sortActiveFriends = computed({
        get() {
            return state.sortActiveFriends;
        },
        set(value) {
            state.sortActiveFriends = value;
        }
    });
    const sortOfflineFriends = computed({
        get() {
            return state.sortOfflineFriends;
        },
        set(value) {
            state.sortOfflineFriends = value;
        }
    });
    const localFavoriteFriends = state.localFavoriteFriends;
    const friendLogInitStatus = computed({
        get() {
            return state.friendLogInitStatus;
        },
        set(value) {
            state.friendLogInitStatus = value;
        }
    });

    // VIP friends
    const vipFriends = computed(() => {
        if (!state.sortVIPFriends) {
            return state.vipFriends_;
        }
        state.sortVIPFriends = false;

        state.vipFriends_.sort(
            getFriendsSortFunction(sidebarSortMethods.value)
        );
        return state.vipFriends_;
    });

    // Online friends
    const onlineFriends = computed(() => {
        if (!state.sortOnlineFriends) {
            return state.onlineFriends_;
        }
        state.sortOnlineFriends = false;

        state.onlineFriends_.sort(
            getFriendsSortFunction(sidebarSortMethods.value)
        );

        return state.onlineFriends_;
    });

    // Active friends
    const activeFriends = computed(() => {
        if (!state.sortActiveFriends) {
            return state.activeFriends_;
        }
        state.sortActiveFriends = false;

        state.activeFriends_.sort(
            getFriendsSortFunction(sidebarSortMethods.value)
        );

        return state.activeFriends_;
    });

    // Offline friends
    const offlineFriends = computed(() => {
        if (!state.sortOfflineFriends) {
            return state.offlineFriends_;
        }
        state.sortOfflineFriends = false;

        state.offlineFriends_.sort(
            getFriendsSortFunction(sidebarSortMethods.value)
        );

        return state.offlineFriends_;
    });

    const isRefreshFriendsLoading = computed({
        get() {
            return state.isRefreshFriendsLoading;
        },
        set(value) {
            state.isRefreshFriendsLoading = value;
        }
    });
    const pendingActiveFriends = state.pendingActiveFriends;
    const onlineFriendCount = computed({
        get() {
            return state.onlineFriendCount;
        },
        set(value) {
            state.onlineFriendCount = value;
        }
    });

    /**
     * @param {string} value
     */
    function updateLocalFavoriteFriends(value) {
        setLocalFavoriteFriendsGroups(
            value || localFavoriteFriendsGroups.value
        );
        state.localFavoriteFriends.clear();
        for (const ref of API.cachedFavorites.values()) {
            if (
                !ref.$isDeleted &&
                ref.type === 'friend' &&
                (localFavoriteFriendsGroups.value.includes(ref.$groupKey) ||
                    localFavoriteFriendsGroups.value.length === 0)
            ) {
                state.localFavoriteFriends.add(ref.favoriteId);
            }
        }
        updateSidebarFriendsList();
    }

    function updateSidebarFriendsList() {
        for (const ctx of state.friends.values()) {
            const isVIP = state.localFavoriteFriends.has(ctx.id);
            if (ctx.isVIP === isVIP) {
                continue;
            }
            ctx.isVIP = isVIP;
            if (ctx.state !== 'online') {
                continue;
            }
            if (ctx.isVIP) {
                removeFromArray(state.onlineFriends_, ctx);
                state.vipFriends_.push(ctx);
                state.sortVIPFriends = true;
            } else {
                removeFromArray(state.vipFriends_, ctx);
                state.onlineFriends_.push(ctx);
                state.sortOnlineFriends = true;
            }
        }
    }

    const pendingOfflineDelay = 180000;

    /**
     * @param {Object} args
     */
    function updateFriend(args) {
        const { id, state: state_input, fromGetCurrentUser } = args;
        const stateInput = state_input;
        const ctx = state.friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        const ref = API.cachedUsers.get(id);
        if (stateInput) {
            ctx.pendingState = stateInput;
            if (typeof ref !== 'undefined') {
                ctx.ref.state = stateInput;
            }
        }
        if (stateInput === 'online') {
            if (debugFriendState.value && ctx.pendingOffline) {
                const time = (Date.now() - ctx.pendingOfflineTime) / 1000;
                console.log(`${ctx.name} pendingOfflineCancelTime ${time}`);
            }
            ctx.pendingOffline = false;
            ctx.pendingOfflineTime = '';
        }
        const isVIP = state.localFavoriteFriends.has(id);
        let location = '';
        let $location_at = '';
        if (typeof ref !== 'undefined') {
            location = ref.location;
            $location_at = ref.$location_at;
        }
        if (typeof stateInput === 'undefined' || ctx.state === stateInput) {
            // this is should be: undefined -> user
            if (ctx.ref !== ref) {
                ctx.ref = ref;
                // NOTE
                // AddFriend (CurrentUser) 이후,
                // 서버에서 오는 순서라고 보면 될 듯.
                if (ctx.state === 'online') {
                    if (state.friendLogInitStatus) {
                        userRequest.getUser({
                            userId: id
                        });
                    }
                    if (ctx.isVIP) {
                        state.sortVIPFriends = true;
                    } else {
                        state.sortOnlineFriends = true;
                    }
                }
            }
            if (ctx.isVIP !== isVIP) {
                ctx.isVIP = isVIP;
                if (ctx.state === 'online') {
                    if (ctx.isVIP) {
                        removeFromArray(state.onlineFriends_, ctx);
                        state.vipFriends_.push(ctx);
                        state.sortVIPFriends = true;
                    } else {
                        removeFromArray(state.vipFriends_, ctx);
                        state.onlineFriends_.push(ctx);
                        state.sortOnlineFriends = true;
                    }
                }
            }
            if (typeof ref !== 'undefined' && ctx.name !== ref.displayName) {
                ctx.name = ref.displayName;
                if (ctx.state === 'online') {
                    if (ctx.isVIP) {
                        state.sortVIPFriends = true;
                    } else {
                        state.sortOnlineFriends = true;
                    }
                } else if (ctx.state === 'active') {
                    state.sortActiveFriends = true;
                } else {
                    state.sortOfflineFriends = true;
                }
            }
            // from getCurrentUser only, fetch user if offline in an instance
            if (
                fromGetCurrentUser &&
                ctx.state !== 'online' &&
                typeof ref !== 'undefined' &&
                isRealInstance(ref.location)
            ) {
                if (debugFriendState.value) {
                    console.log(
                        `Fetching offline friend in an instance from getCurrentUser ${ctx.name}`
                    );
                }
                userRequest.getUser({
                    userId: id
                });
            }
        } else if (
            ctx.state === 'online' &&
            (stateInput === 'active' || stateInput === 'offline')
        ) {
            ctx.ref = ref;
            ctx.isVIP = isVIP;
            if (typeof ref !== 'undefined') {
                ctx.name = ref.displayName;
            }
            if (!state.friendLogInitStatus) {
                updateFriendDelayedCheck(ctx, location, $location_at);
                return;
            }
            // prevent status flapping
            if (ctx.pendingOffline) {
                if (debugFriendState.value) {
                    console.log(ctx.name, 'pendingOfflineAlreadyWaiting');
                }
                return;
            }
            if (debugFriendState.value) {
                console.log(ctx.name, 'pendingOfflineBegin');
            }
            ctx.pendingOffline = true;
            ctx.pendingOfflineTime = Date.now();
            // wait 2minutes then check if user came back online
            workerTimers.setTimeout(() => {
                if (!ctx.pendingOffline) {
                    if (debugFriendState.value) {
                        console.log(ctx.name, 'pendingOfflineAlreadyCancelled');
                    }
                    return;
                }
                ctx.pendingOffline = false;
                ctx.pendingOfflineTime = '';
                if (ctx.pendingState === ctx.state) {
                    if (debugFriendState.value) {
                        console.log(
                            ctx.name,
                            'pendingOfflineCancelledStateMatched'
                        );
                    }
                    return;
                }
                if (debugFriendState.value) {
                    console.log(ctx.name, 'pendingOfflineEnd');
                }
                updateFriendDelayedCheck(ctx, location, $location_at);
            }, pendingOfflineDelay);
        } else {
            ctx.ref = ref;
            ctx.isVIP = isVIP;
            if (typeof ref !== 'undefined') {
                ctx.name = ref.displayName;

                // wtf, from getCurrentUser only, fetch user if online in offline location
                if (fromGetCurrentUser && stateInput === 'online') {
                    if (debugFriendState.value) {
                        console.log(
                            `Fetching friend coming online from getCurrentUser ${ctx.name}`
                        );
                    }
                    userRequest.getUser({
                        userId: id
                    });
                    return;
                }
            }
            updateFriendDelayedCheck(ctx, location, $location_at);
        }
    }

    /**
     * @param {Object} ctx
     * @param {string} location
     * @param {number} $location_at
     */
    async function updateFriendDelayedCheck(ctx, location, $location_at) {
        let feed;
        let groupName;
        let worldName;
        const id = ctx.id;
        const newState = ctx.pendingState;
        if (debugFriendState.value) {
            console.log(
                `${ctx.name} updateFriendState ${ctx.state} -> ${newState}`
            );
            if (
                typeof ctx.ref !== 'undefined' &&
                location !== ctx.ref.location
            ) {
                console.log(
                    `${ctx.name} pendingOfflineLocation ${location} -> ${ctx.ref.location}`
                );
            }
        }
        if (!state.friends.has(id)) {
            console.log('Friend not found', id);
            return;
        }
        const isVIP = state.localFavoriteFriends.has(id);
        const ref = ctx.ref;
        if (ctx.state !== newState && typeof ctx.ref !== 'undefined') {
            if (
                (newState === 'offline' || newState === 'active') &&
                ctx.state === 'online'
            ) {
                ctx.ref.$online_for = '';
                ctx.ref.$offline_for = Date.now();
                ctx.ref.$active_for = '';
                if (newState === 'active') {
                    ctx.ref.$active_for = Date.now();
                }
                const ts = Date.now();
                const time = ts - $location_at;
                worldName = await getWorldName(location);
                groupName = await getGroupName(location);
                feed = {
                    created_at: new Date().toJSON(),
                    type: 'Offline',
                    userId: ref.id,
                    displayName: ref.displayName,
                    location,
                    worldName,
                    groupName,
                    time
                };
                $app.addFeed(feed);
                database.addOnlineOfflineToDatabase(feed);
            } else if (
                newState === 'online' &&
                (ctx.state === 'offline' || ctx.state === 'active')
            ) {
                ctx.ref.$previousLocation = '';
                ctx.ref.$travelingToTime = Date.now();
                ctx.ref.$location_at = Date.now();
                ctx.ref.$online_for = Date.now();
                ctx.ref.$offline_for = '';
                ctx.ref.$active_for = '';
                worldName = await getWorldName(location);
                groupName = await getGroupName(location);
                feed = {
                    created_at: new Date().toJSON(),
                    type: 'Online',
                    userId: id,
                    displayName: ctx.name,
                    location,
                    worldName,
                    groupName,
                    time: ''
                };
                $app.addFeed(feed);
                database.addOnlineOfflineToDatabase(feed);
            }
            if (newState === 'active') {
                ctx.ref.$active_for = Date.now();
            }
        }
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                removeFromArray(state.vipFriends_, ctx);
            } else {
                removeFromArray(state.onlineFriends_, ctx);
            }
        } else if (ctx.state === 'active') {
            removeFromArray(state.activeFriends_, ctx);
        } else {
            removeFromArray(state.offlineFriends_, ctx);
        }
        if (newState === 'online') {
            if (isVIP) {
                state.vipFriends_.push(ctx);
                state.sortVIPFriends = true;
            } else {
                state.onlineFriends_.push(ctx);
                state.sortOnlineFriends = true;
            }
        } else if (newState === 'active') {
            state.activeFriends_.push(ctx);
            state.sortActiveFriends = true;
        } else {
            state.offlineFriends_.push(ctx);
            state.sortOfflineFriends = true;
        }
        if (ctx.state !== newState) {
            updateOnlineFriendCoutner();
        }
        ctx.state = newState;
        if (ref?.displayName) {
            ctx.name = ref.displayName;
        }
        ctx.isVIP = isVIP;
    }

    /**
     * @param {string} id
     */
    function deleteFriend(id) {
        const ctx = state.friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        state.friends.delete(id);
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                removeFromArray(state.vipFriends_, ctx);
            } else {
                removeFromArray(state.onlineFriends_, ctx);
            }
        } else if (ctx.state === 'active') {
            removeFromArray(state.activeFriends_, ctx);
        } else {
            removeFromArray(state.offlineFriends_, ctx);
        }
    }

    /**
     * aka: `$app.refreshFriends`
     * @param ref
     * @param fromGetCurrentUser
     */
    function refreshFriendsStatus(ref, fromGetCurrentUser) {
        let id;
        const map = new Map();
        for (id of ref.friends) {
            map.set(id, 'offline');
        }
        for (id of ref.offlineFriends) {
            map.set(id, 'offline');
        }
        for (id of ref.activeFriends) {
            map.set(id, 'active');
        }
        for (id of ref.onlineFriends) {
            map.set(id, 'online');
        }
        for (const friend of map) {
            const [id, state_input] = friend;
            if (state.friends.has(id)) {
                updateFriend({ id, state_input, fromGetCurrentUser });
            } else {
                addFriend(id, state_input);
            }
        }
        for (id of state.friends.keys()) {
            if (map.has(id) === false) {
                deleteFriend(id);
            }
        }
    }

    /**
     * @param {string} id
     * @param {string} state_input
     */
    function addFriend(id, state_input) {
        if (state.friends.has(id)) {
            return;
        }
        const ref = API.cachedUsers.get(id);
        const isVIP = state.localFavoriteFriends.has(id);
        let name = '';
        const friend = $app.friendLog.get(id);
        if (friend) {
            name = friend.displayName;
        }
        const ctx = {
            id,
            state: state_input || 'offline',
            isVIP,
            ref,
            name,
            memo: '',
            pendingOffline: false,
            pendingOfflineTime: '',
            pendingState: '',
            $nickName: ''
        };
        if ($app.friendLogInitStatus) {
            $app.getUserMemo(id).then((memo) => {
                if (memo.userId === id) {
                    ctx.memo = memo.memo;
                    ctx.$nickName = '';
                    if (memo.memo) {
                        const array = memo.memo.split('\n');
                        ctx.$nickName = array[0];
                    }
                }
            });
        }
        if (typeof ref === 'undefined') {
            const friendLogRef = $app.friendLog.get(id);
            if (friendLogRef?.displayName) {
                ctx.name = friendLogRef.displayName;
            }
        } else {
            ctx.name = ref.name;
        }
        state.friends.set(id, ctx);
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                state.vipFriends_.push(ctx);
                state.sortVIPFriends = true;
            } else {
                state.onlineFriends_.push(ctx);
                state.sortOnlineFriends = true;
            }
        } else if (ctx.state === 'active') {
            state.activeFriends_.push(ctx);
            state.sortActiveFriends = true;
        } else {
            state.offlineFriends_.push(ctx);
            state.sortOfflineFriends = true;
        }
    }

    /**
     * aka: `API.refreshFriends`
     * @returns {Promise<void>}
     */
    async function refreshFriends() {
        state.isRefreshFriendsLoading = true;
        try {
            const onlineFriends = await bulkRefreshFriends({
                offline: false
            });
            const offlineFriends = await bulkRefreshFriends({
                offline: true
            });
            let friends = onlineFriends.concat(offlineFriends);
            friends = await refetchBrokenFriends(friends);
            if (!state.friendLogInitStatus) {
                friends = await refreshRemainingFriends(friends);
            }

            state.isRefreshFriendsLoading = false;
            // return friends;
        } catch (err) {
            state.isRefreshFriendsLoading = false;
            throw err;
        }
    }

    /**
     * @param {Object} args
     * @returns {Promise<*[]>}
     */
    async function bulkRefreshFriends(args) {
        // API.bulkRefreshFriends
        let friends = [];
        const params = {
            ...args,
            n: 50,
            offset: 0
        };
        // API offset limit *was* 5000
        // it is now 7500
        mainLoop: for (let i = 150; i > -1; i--) {
            retryLoop: for (let j = 0; j < 10; j++) {
                // handle 429 ratelimit error, retry 10 times
                try {
                    const args = await friendRequest.getFriends(params);
                    if (!args.json || args.json.length === 0) {
                        break mainLoop;
                    }
                    friends = friends.concat(args.json);
                    break retryLoop;
                } catch (err) {
                    console.error(err);
                    if (!API.currentUser.isLoggedIn) {
                        console.error(`User isn't logged in`);
                        break mainLoop;
                    }
                    if (err?.message?.includes('Not Found')) {
                        console.error('Awful workaround for awful VRC API bug');
                        break retryLoop;
                    }
                    await new Promise((resolve) => {
                        workerTimers.setTimeout(resolve, 5000);
                    });
                }
            }
            params.offset += 50;
        }
        return friends;
    }

    /**
     * @param {Array} friends
     * @returns {Promise<*>}
     */
    async function refetchBrokenFriends(friends) {
        // API.refetchBrokenFriends
        // attempt to fix broken data from bulk friend fetch
        for (let i = 0; i < friends.length; i++) {
            const friend = friends[i];
            try {
                // we don't update friend state here, it's not reliable
                let state_input = 'offline';
                if (friend.platform === 'web') {
                    state_input = 'active';
                } else if (friend.platform) {
                    state_input = 'online';
                }
                const ref = state.friends.get(friend.id);
                if (ref?.state !== state_input) {
                    if (debugFriendState.value) {
                        console.log(
                            `Refetching friend state it does not match ${friend.displayName} from ${ref?.state} to ${state_input}`,
                            friend
                        );
                    }
                    const args = await userRequest.getUser({
                        userId: friend.id
                    });
                    friends[i] = args.json;
                } else if (friend.location === 'traveling') {
                    if (debugFriendState.value) {
                        console.log(
                            'Refetching traveling friend',
                            friend.displayName
                        );
                    }
                    const args = await userRequest.getUser({
                        userId: friend.id
                    });
                    friends[i] = args.json;
                }
            } catch (err) {
                console.error(err);
            }
        }
        return friends;
    }

    /**
     * @param {Array} friends
     * @returns {Promise<*>}
     */
    async function refreshRemainingFriends(friends) {
        // API.refreshRemainingFriends
        for (let userId of API.currentUser.friends) {
            if (!friends.some((x) => x.id === userId)) {
                try {
                    if (!API.isLoggedIn) {
                        console.error(`User isn't logged in`);
                        return friends;
                    }
                    console.log('Fetching remaining friend', userId);
                    const args = await userRequest.getUser({ userId });
                    friends.push(args.json);
                } catch (err) {
                    console.error(err);
                }
            }
        }
        return friends;
    }

    /**
     * @param {string} userId
     * @returns {Promise<{json: *, params}>}
     */
    function fetchActiveFriend(userId) {
        state.pendingActiveFriends.add(userId);
        // FIXME: handle error
        return userRequest
            .getUser({
                userId
            })
            .then((args) => {
                state.pendingActiveFriends.delete(userId);
                return args;
            });
    }

    /**
     * @param {Object} ref
     */
    function checkActiveFriends(ref) {
        if (
            Array.isArray(ref.activeFriends) === false ||
            !state.friendLogInitStatus
        ) {
            return;
        }
        for (let userId of ref.activeFriends) {
            if (state.pendingActiveFriends.has(userId)) {
                continue;
            }
            const user = API.cachedUsers.get(userId);
            if (typeof user !== 'undefined' && user.status !== 'offline') {
                continue;
            }
            if (state.pendingActiveFriends.size >= 5) {
                break;
            }
            fetchActiveFriend(userId);
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async function refreshFriendsList() {
        // If we just got user less then 2 min before code call, don't call it again
        if ($app.nextCurrentUserRefresh < 300) {
            await API.getCurrentUser().catch((err) => {
                console.error(err);
            });
        }
        await refreshFriends().catch((err) => {
            console.error(err);
        });
        API.reconnectWebSocket();
    }

    /**
     * @param {string} userId
     */
    function updateFriendGPS(userId) {
        const ctx = state.friends.get(userId);
        if (ctx.isVIP) {
            state.sortVIPFriends = true;
        } else {
            state.sortOnlineFriends = true;
        }
    }

    function updateOnlineFriendCoutner() {
        const onlineFriendCount =
            vipFriends.value.length + onlineFriends.value.length;
        if (onlineFriendCount !== state.onlineFriendCount) {
            AppApi.ExecuteVrFeedFunction(
                'updateOnlineFriendCount',
                `${onlineFriendCount}`
            );
            state.onlineFriendCount = onlineFriendCount;
        }
    }

    return {
        state,

        friends,
        onlineFriends_,
        vipFriends_,
        activeFriends_,
        offlineFriends_,

        vipFriends,
        onlineFriends,
        activeFriends,
        offlineFriends,

        sortOnlineFriends,
        sortVIPFriends,
        sortActiveFriends,
        sortOfflineFriends,

        localFavoriteFriends,
        friendLogInitStatus,
        isRefreshFriendsLoading,
        pendingActiveFriends,
        onlineFriendCount,

        updateLocalFavoriteFriends,
        updateSidebarFriendsList,
        updateFriend,
        deleteFriend,
        refreshFriendsStatus,
        addFriend,
        refreshFriends,
        checkActiveFriends,
        refreshFriendsList,
        updateOnlineFriendCoutner,
        updateFriendGPS
    };
});
