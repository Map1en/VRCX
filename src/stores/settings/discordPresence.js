import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useDiscordPresenceSettingsStore = defineStore(
    'DiscordPresenceSettings',
    () => {
        const state = reactive({
            discordActive: false,
            discordInstance: true
        });

        async function initSettings() {
            const [discordActive, discordInstance] = await Promise.all([
                configRepository.getBool('discordActive', false),
                configRepository.getBool('discordInstance', true)
            ]);

            state.discordActive = discordActive;
            state.discordInstance = discordInstance;
        }

        const discordActive = computed(() => state.discordActive);
        const discordInstance = computed(() => state.discordInstance);

        function setDiscordActive() {
            state.discordActive = !state.discordActive;
            configRepository.setBool('discordActive', state.discordActive);
        }
        function setDiscordInstance() {
            state.discordInstance = !state.discordInstance;
            configRepository.setBool('discordInstance', state.discordInstance);
        }

        return {
            state,
            initSettings,

            discordActive,
            discordInstance,

            setDiscordActive,
            setDiscordInstance
        };
    }
);
