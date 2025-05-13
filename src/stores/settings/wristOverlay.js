import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useWristOverlaySettingsStore = defineStore(
    'WristOverlaySettings',
    () => {
        const state = reactive({
            overlayWrist: true,
            hidePrivateFromFeed: false,
            openVRAlways: false
        });

        async function initSettings() {
            const [overlayWrist, hidePrivateFromFeed, openVRAlways] =
                await Promise.all([
                    configRepository.getBool('VRCX_overlayWrist', false),
                    configRepository.getBool('VRCX_hidePrivateFromFeed', false),
                    configRepository.getBool('openVRAlways', false)
                ]);

            state.overlayWrist = overlayWrist;
            state.hidePrivateFromFeed = hidePrivateFromFeed;
            state.openVRAlways = openVRAlways;
        }

        const overlayWrist = computed(() => state.overlayWrist);
        const hidePrivateFromFeed = computed(() => state.hidePrivateFromFeed);
        const openVRAlways = computed(() => state.openVRAlways);

        function setOverlayWrist() {
            state.overlayWrist = !state.overlayWrist;
            configRepository.setBool('VRCX_overlayWrist', state.overlayWrist);
        }
        function setHidePrivateFromFeed() {
            state.hidePrivateFromFeed = !state.hidePrivateFromFeed;
            configRepository.setBool(
                'VRCX_hidePrivateFromFeed',
                state.hidePrivateFromFeed
            );
        }
        function setOpenVRAlways() {
            state.openVRAlways = !state.openVRAlways;
            configRepository.setBool('openVRAlways', state.openVRAlways);
        }

        return {
            state,
            initSettings,

            overlayWrist,
            hidePrivateFromFeed,
            openVRAlways,

            setOverlayWrist,
            setHidePrivateFromFeed,
            setOpenVRAlways
        };
    }
);
