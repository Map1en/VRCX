import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';
import { API, $app } from '../../app';
import { parseLocation, isRealInstance } from '../../shared/utils';
import { userRequest } from '../../api';
import { useLocationStore } from '../location';

export const useDiscordPresenceSettingsStore = defineStore(
    'DiscordPresenceSettings',
    () => {
        const locationStore = useLocationStore();
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

        // use in csharp
        API.actuallyGetCurrentLocation = async () => {
            let gameLogLocation = locationStore.lastLocation.location;
            if (gameLogLocation.startsWith('local')) {
                console.warn('PWI: local test mode', 'test_world');
                return 'test_world';
            }
            if (gameLogLocation === 'traveling') {
                gameLogLocation = $app.lastLocationDestination;
            }

            let presenceLocation = API.currentUser.$locationTag;
            if (presenceLocation === 'traveling') {
                presenceLocation = API.currentUser.$travelingToLocation;
            }

            // We want to use presence if it's valid to avoid extra API calls, but its prone to being outdated when this function is called.
            // So we check if the presence location is the same as the gameLog location; If it is, the presence is (probably) valid and we can use it.
            // If it's not, we need to get the user manually to get the correct location.
            // If the user happens to be offline or the api is just being dumb, we assume that the user logged into VRCX is different than the one in-game and return the gameLog location.
            // This is really dumb.
            if (presenceLocation === gameLogLocation) {
                const L = parseLocation(presenceLocation);
                return L.worldId;
            }

            const args = await userRequest.getUser({
                userId: API.currentUser.id
            });
            const user = args.json;
            let userLocation = user.location;
            if (userLocation === 'traveling') {
                userLocation = user.travelingToLocation;
            }
            console.warn(
                "PWI: location didn't match, fetched user location",
                userLocation
            );

            if (isRealInstance(userLocation)) {
                console.warn('PWI: returning user location', userLocation);
                const L = parseLocation(userLocation);
                return L.worldId;
            }

            if (isRealInstance(gameLogLocation)) {
                console.warn(
                    `PWI: returning gamelog location: `,
                    gameLogLocation
                );
                const L = parseLocation(gameLogLocation);
                return L.worldId;
            }

            console.error(
                `PWI: all locations invalid: `,
                gameLogLocation,
                userLocation
            );
            return 'test_world';
        };

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
