import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useWristOverlaySettingsStore = defineStore(
    'WristOverlaySettings',
    () => {
        const state = reactive({
            overlayWrist: true,
            hidePrivateFromFeed: false,
            openVRAlways: false,
            overlaybutton: false,
            overlayHand: 0
        });

        async function initSettings() {
            const [
                overlayWrist,
                hidePrivateFromFeed,
                openVRAlways,
                overlaybutton,
                overlayHand
            ] = await Promise.all([
                configRepository.getBool('VRCX_overlayWrist', false),
                configRepository.getBool('VRCX_hidePrivateFromFeed', false),
                configRepository.getBool('openVRAlways', false),
                configRepository.getBool('VRCX_overlaybutton', false),
                configRepository.getInt('VRCX_overlayHand', 0)
            ]);

            state.overlayWrist = overlayWrist;
            state.hidePrivateFromFeed = hidePrivateFromFeed;
            state.openVRAlways = openVRAlways;
            state.overlaybutton = overlaybutton;
            state.overlayHand = overlayHand;
        }

        const overlayWrist = computed(() => state.overlayWrist);
        const hidePrivateFromFeed = computed(() => state.hidePrivateFromFeed);
        const openVRAlways = computed(() => state.openVRAlways);
        const overlaybutton = computed(() => state.overlaybutton);
        const overlayHand = computed(() => state.overlayHand);

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
        function setOverlaybutton() {
            state.overlaybutton = !state.overlaybutton;
            configRepository.setBool('VRCX_overlaybutton', state.overlaybutton);
        }
        function setOverlayHand(value) {
            state.overlayHand = parseInt(value, 10);
            if (isNaN(state.overlayHand)) {
                state.overlayHand = 0;
            }
            configRepository.setInt('VRCX_overlayHand', value);
        }

        return {
            state,
            initSettings,

            overlayWrist,
            hidePrivateFromFeed,
            openVRAlways,
            overlaybutton,
            overlayHand,

            setOverlayWrist,
            setHidePrivateFromFeed,
            setOpenVRAlways,
            setOverlaybutton,
            setOverlayHand
        };
    }
);
