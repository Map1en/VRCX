import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useDiscordPresenceSettingsStore = defineStore(
    'DiscordPresenceSettings',
    () => {
        const state = reactive({
            discordActive: false,
            discordInstance: true,
            discordHideInvite: true,
            discordJoinButton: false
        });

        async function initSettings() {
            const [
                discordActive,
                discordInstance,
                discordHideInvite,
                discordJoinButton
            ] = await Promise.all([
                configRepository.getBool('discordActive', false),
                configRepository.getBool('discordInstance', true),
                configRepository.getBool('discordHideInvite', true),
                configRepository.getBool('discordJoinButton', false)
            ]);

            state.discordActive = discordActive;
            state.discordInstance = discordInstance;
            state.discordHideInvite = discordHideInvite;
            state.discordJoinButton = discordJoinButton;
        }

        const discordActive = computed(() => state.discordActive);
        const discordInstance = computed(() => state.discordInstance);
        const discordHideInvite = computed(() => state.discordHideInvite);
        const discordJoinButton = computed(() => state.discordJoinButton);

        function setDiscordActive() {
            state.discordActive = !state.discordActive;
            configRepository.setBool('discordActive', state.discordActive);
        }
        function setDiscordInstance() {
            state.discordInstance = !state.discordInstance;
            configRepository.setBool('discordInstance', state.discordInstance);
        }
        function setDiscordHideInvite() {
            state.discordHideInvite = !state.discordHideInvite;
            configRepository.setBool(
                'discordHideInvite',
                state.discordHideInvite
            );
        }
        function setDiscordJoinButton() {
            state.discordJoinButton = !state.discordJoinButton;
            configRepository.setBool(
                'discordJoinButton',
                state.discordJoinButton
            );
        }

        return {
            state,
            initSettings,

            discordActive,
            discordInstance,
            discordHideInvite,
            discordJoinButton,

            setDiscordActive,
            setDiscordInstance,
            setDiscordHideInvite,
            setDiscordJoinButton
        };
    }
);
