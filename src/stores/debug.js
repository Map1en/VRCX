import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

export const useDebugStore = defineStore('Debug', () => {
    const state = reactive({
        debugWebRequests: false

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

    return { state, debugWebRequests };
});
