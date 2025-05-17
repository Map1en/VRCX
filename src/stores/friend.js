import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import API from '../classes/apiInit';
import { removeFromArray } from '../shared/utils';
import { useGeneralSettingsStore } from './settings/general';

export const useFriendStore = defineStore('Friend', () => {
    const generalSettingsStore = useGeneralSettingsStore();
    const { localFavoriteFriendsGroups } = storeToRefs(generalSettingsStore);
    const { setLocalFavoriteFriendsGroups } = generalSettingsStore;
    const state = reactive({
        friends: new Map(),
        onlineFriends_: [],
        vipFriends_: [],
        sortOnlineFriends: false,
        sortVIPFriends: false,
        localFavoriteFriends: new Set()
    });

    const friends = state.friends;
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
    const localFavoriteFriends = state.localFavoriteFriends;

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
        sortOnlineFriends,
        sortVIPFriends,
        localFavoriteFriends,

        updateLocalFavoriteFriends,
        updateSidebarFriendsList
    };
});
