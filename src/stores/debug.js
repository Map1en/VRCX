import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

export const useDebugStore = defineStore('Debug', () => {
    const state = reactive({
        debugWebRequests: false,
        debugFriendState: false

        // $app.data.debug = false;
        // $app.data.debugWebRequests = false;
        // $app.data.debugWebSocket = false;
        // $app.data.debugUserDiff = false;
        // $app.data.debugCurrentUserDiff = false;
        // $app.data.debugPhotonLogging = false;
        // $app.data.debugGameLog = false;
        // $app.data.debugFriendState = false;
    });

    const debugWebRequests = computed({
        get: () => state.debugWebRequests,
        set: (value) => {
            state.debugWebRequests = value;
        }
    });

    const debugFriendState = computed({
        get: () => state.debugFriendState,
        set: (value) => {
            state.debugFriendState = value;
        }
    });

    return { state, debugWebRequests, debugFriendState };
});
