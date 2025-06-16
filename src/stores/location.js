import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

export const useLocationStore = defineStore('Location', () => {
    const state = reactive({
        lastLocation: {
            date: 0,
            location: '',
            name: '',
            playerList: new Map(),
            friendList: new Map()
        }
    });

    const lastLocation = computed({
        get: () => state.lastLocation,
        set: (value) => {
            state.lastLocation = value;
        }
    });

    return { state, lastLocation };
});
