import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { $app } from '../app';

export const useWorldStore = defineStore('World', () => {
    const state = reactive({
        worldDialog: {
            visible: false,
            loading: false,
            id: '',
            memo: '',
            $location: {},
            ref: {},
            isFavorite: false,
            avatarScalingDisabled: false,
            focusViewDisabled: false,
            rooms: [],
            treeData: [],
            bundleSizes: [],
            lastUpdated: '',
            inCache: false,
            cacheSize: 0,
            cacheLocked: false,
            cachePath: '',
            lastVisit: '',
            visitCount: 0,
            timeSpent: 0,
            isPC: false,
            isQuest: false,
            isIos: false,
            hasPersistData: false
        }
    });

    const worldDialog = computed({
        get: () => state.worldDialog,
        set: (value) => {
            state.worldDialog = value;
        }
    });

    // const debugWebRequests = computed({
    //     get: () => state.debugWebRequests,
    //     set: (value) => {
    //         state.debugWebRequests = value;
    //     }
    // });
    //
    // const debugFriendState = computed({
    //     get: () => state.debugFriendState,
    //     set: (value) => {
    //         state.debugFriendState = value;
    //     }
    // });
    //
    // const debugUserDiff = computed({
    //     get: () => state.debugUserDiff,
    //     set: (value) => {
    //         state.debugUserDiff = value;
    //     }
    // });

    return { state, worldDialog };
});
