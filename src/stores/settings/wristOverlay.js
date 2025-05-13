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
            overlayHand: 0,
            vrBackgroundEnabled: false,
            minimalFeed: false,
            hideDevicesFromFeed: false
        });

        async function initSettings() {
            const [
                overlayWrist,
                hidePrivateFromFeed,
                openVRAlways,
                overlaybutton,
                overlayHand,
                vrBackgroundEnabled,
                minimalFeed,
                hideDevicesFromFeed
            ] = await Promise.all([
                configRepository.getBool('VRCX_overlayWrist', false),
                configRepository.getBool('VRCX_hidePrivateFromFeed', false),
                configRepository.getBool('openVRAlways', false),
                configRepository.getBool('VRCX_overlaybutton', false),
                configRepository.getInt('VRCX_overlayHand', 0),
                configRepository.getBool('VRCX_vrBackgroundEnabled', false),
                configRepository.getBool('VRCX_minimalFeed', false),
                configRepository.getBool('VRCX_hideDevicesFromFeed', false)
            ]);

            state.overlayWrist = overlayWrist;
            state.hidePrivateFromFeed = hidePrivateFromFeed;
            state.openVRAlways = openVRAlways;
            state.overlaybutton = overlaybutton;
            state.overlayHand = overlayHand;
            state.vrBackgroundEnabled = vrBackgroundEnabled;
            state.minimalFeed = minimalFeed;
            state.hideDevicesFromFeed = hideDevicesFromFeed;
        }

        const overlayWrist = computed(() => state.overlayWrist);
        const hidePrivateFromFeed = computed(() => state.hidePrivateFromFeed);
        const openVRAlways = computed(() => state.openVRAlways);
        const overlaybutton = computed(() => state.overlaybutton);
        const overlayHand = computed(() => state.overlayHand);
        const vrBackgroundEnabled = computed(() => state.vrBackgroundEnabled);
        const minimalFeed = computed(() => state.minimalFeed);
        const hideDevicesFromFeed = computed(() => state.hideDevicesFromFeed);

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
        function setVrBackgroundEnabled() {
            state.vrBackgroundEnabled = !state.vrBackgroundEnabled;
            configRepository.setBool(
                'VRCX_vrBackgroundEnabled',
                state.vrBackgroundEnabled
            );
        }
        function setMinimalFeed() {
            state.minimalFeed = !state.minimalFeed;
            configRepository.setBool('VRCX_minimalFeed', state.minimalFeed);
        }
        function setHideDevicesFromFeed() {
            state.hideDevicesFromFeed = !state.hideDevicesFromFeed;
            configRepository.setBool(
                'VRCX_hideDevicesFromFeed',
                state.hideDevicesFromFeed
            );
        }

        return {
            state,
            initSettings,

            overlayWrist,
            hidePrivateFromFeed,
            openVRAlways,
            overlaybutton,
            overlayHand,
            vrBackgroundEnabled,
            minimalFeed,
            hideDevicesFromFeed,

            setOverlayWrist,
            setHidePrivateFromFeed,
            setOpenVRAlways,
            setOverlaybutton,
            setOverlayHand,
            setVrBackgroundEnabled,
            setMinimalFeed,
            setHideDevicesFromFeed
        };
    }
);
