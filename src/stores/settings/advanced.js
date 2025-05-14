import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useAdvancedSettingsStore = defineStore('AdvancedSettings', () => {
    const state = reactive({
        enablePrimaryPassword: false,
        relaunchVRChatAfterCrash: false,
        vrcQuitFix: true,
        autoSweepVRChatCache: false
    });

    async function initSettings() {
        const [
            enablePrimaryPassword,
            relaunchVRChatAfterCrash,
            vrcQuitFix,
            autoSweepVRChatCache
        ] = await Promise.all([
            configRepository.getBool('enablePrimaryPassword', false),
            configRepository.getBool('VRCX_relaunchVRChatAfterCrash', false),
            configRepository.getBool('VRCX_vrcQuitFix', true),
            configRepository.getBool('VRCX_autoSweepVRChatCache', false)
        ]);

        state.enablePrimaryPassword = enablePrimaryPassword;
        state.relaunchVRChatAfterCrash = relaunchVRChatAfterCrash;
        state.vrcQuitFix = vrcQuitFix;
        state.autoSweepVRChatCache = autoSweepVRChatCache;
    }

    // This one is a bit tricky to do without following the getter/action pattern
    const enablePrimaryPassword = computed({
        get: () => state.enablePrimaryPassword,
        set: (value) => (state.enablePrimaryPassword = value)
    });
    const relaunchVRChatAfterCrash = computed(
        () => state.relaunchVRChatAfterCrash
    );
    const vrcQuitFix = computed(() => state.vrcQuitFix);
    const autoSweepVRChatCache = computed(() => state.autoSweepVRChatCache);

    function setEnablePrimaryPasswordConfigRepository(value) {
        configRepository.setBool('enablePrimaryPassword', value);
    }
    function setRelaunchVRChatAfterCrash() {
        state.relaunchVRChatAfterCrash = !state.relaunchVRChatAfterCrash;
        configRepository.setBool(
            'VRCX_relaunchVRChatAfterCrash',
            state.relaunchVRChatAfterCrash
        );
    }
    function setVrcQuitFix() {
        state.vrcQuitFix = !state.vrcQuitFix;
        configRepository.setBool('VRCX_vrcQuitFix', state.vrcQuitFix);
    }
    function setAutoSweepVRChatCache() {
        state.autoSweepVRChatCache = !state.autoSweepVRChatCache;
        configRepository.setBool(
            'VRCX_autoSweepVRChatCache',
            state.autoSweepVRChatCache
        );
    }

    return {
        state,
        initSettings,

        enablePrimaryPassword,
        relaunchVRChatAfterCrash,
        vrcQuitFix,
        autoSweepVRChatCache,

        setEnablePrimaryPasswordConfigRepository,
        setRelaunchVRChatAfterCrash,
        setVrcQuitFix,
        setAutoSweepVRChatCache
    };
});
