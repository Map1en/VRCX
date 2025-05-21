import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import API from '../classes/apiInit';
import { getFriendsSortFunction, removeFromArray } from '../shared/utils';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';

export const useFriendStore = defineStore('Friend', () => {
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { sidebarSortMethods } = storeToRefs(appearanceSettingsStore);
    const generalSettingsStore = useGeneralSettingsStore();
    const { localFavoriteFriendsGroups } = storeToRefs(generalSettingsStore);
    const { setLocalFavoriteFriendsGroups } = generalSettingsStore;
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
        localFavoriteFriends: new Set()
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

        updateLocalFavoriteFriends,
        updateSidebarFriendsList
    };
});
