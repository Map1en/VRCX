import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useAdvancedSettingsStore = defineStore('AdvancedSettings', () => {
    const state = reactive({
        enablePrimaryPassword: false
    });

    async function initSettings() {
        const [enablePrimaryPassword] = await Promise.all([
            configRepository.getBool('enablePrimaryPassword', false)
        ]);

        state.enablePrimaryPassword = enablePrimaryPassword;
    }

    // This one is a bit tricky to do without following the getter/action pattern
    const enablePrimaryPassword = computed({
        get: () => state.enablePrimaryPassword,
        set: (value) => (state.enablePrimaryPassword = value)
    });
    function setEnablePrimaryPasswordConfigRepository(value) {
        configRepository.setBool('enablePrimaryPassword', value);
    }

    return {
        state,
        initSettings,

        enablePrimaryPassword,

        setEnablePrimaryPasswordConfigRepository
    };
});
