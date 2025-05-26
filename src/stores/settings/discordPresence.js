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
            discordJoinButton: false,
            discordHideImage: false
        });

        async function initDiscordPresenceSettings() {
            const [
                discordActive,
                discordInstance,
                discordHideInvite,
                discordJoinButton,
                discordHideImage
            ] = await Promise.all([
                configRepository.getBool('discordActive', false),
                configRepository.getBool('discordInstance', true),
                configRepository.getBool('discordHideInvite', true),
                configRepository.getBool('discordJoinButton', false),
                configRepository.getBool('discordHideImage', false)
            ]);

            state.discordActive = discordActive;
            state.discordInstance = discordInstance;
            state.discordHideInvite = discordHideInvite;
            state.discordJoinButton = discordJoinButton;
            state.discordHideImage = discordHideImage;
        }

        const discordActive = computed(() => state.discordActive);
        const discordInstance = computed(() => state.discordInstance);
        const discordHideInvite = computed(() => state.discordHideInvite);
        const discordJoinButton = computed(() => state.discordJoinButton);
        const discordHideImage = computed(() => state.discordHideImage);

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
        function setDiscordHideImage() {
            state.discordHideImage = !state.discordHideImage;
            configRepository.setBool(
                'discordHideImage',
                state.discordHideImage
            );
        }

        initDiscordPresenceSettings();

        return {
            state,

            discordActive,
            discordInstance,
            discordHideInvite,
            discordJoinButton,
            discordHideImage,

            setDiscordActive,
            setDiscordInstance,
            setDiscordHideInvite,
            setDiscordJoinButton,
            setDiscordHideImage
        };
    }
);
