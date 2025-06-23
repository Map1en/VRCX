import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

export const useGameLogStore = defineStore('GameLog', () => {
    const state = reactive({});

    return { state };
});
