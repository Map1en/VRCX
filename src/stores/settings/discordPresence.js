import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useDiscordPresenceSettingsStore = defineStore(
    'DiscordPresenceSettings',
    () => {
        const state = reactive({
            discordActive: false
        });

        async function initSettings() {
            const [discordActive] = await Promise.all([
                configRepository.getBool('discordActive', false)
            ]);

            state.discordActive = discordActive;
        }

        const discordActive = computed(() => state.discordActive);

        function setDiscordActive() {
            state.discordActive = !state.discordActive;
            configRepository.setBool('discordActive', state.discordActive);
        }

        return {
            state,
            initSettings,

            discordActive,

            setDiscordActive
        };
    }
);
