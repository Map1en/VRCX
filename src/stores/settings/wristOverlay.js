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
            overlaybutton: false
        });

        async function initSettings() {
            const [
                overlayWrist,
                hidePrivateFromFeed,
                openVRAlways,
                overlaybutton
            ] = await Promise.all([
                configRepository.getBool('VRCX_overlayWrist', false),
                configRepository.getBool('VRCX_hidePrivateFromFeed', false),
                configRepository.getBool('openVRAlways', false),
                configRepository.getBool('VRCX_overlaybutton', false)
            ]);

            state.overlayWrist = overlayWrist;
            state.hidePrivateFromFeed = hidePrivateFromFeed;
            state.openVRAlways = openVRAlways;
            state.overlaybutton = overlaybutton;
        }

        const overlayWrist = computed(() => state.overlayWrist);
        const hidePrivateFromFeed = computed(() => state.hidePrivateFromFeed);
        const openVRAlways = computed(() => state.openVRAlways);
        const overlaybutton = computed(() => state.overlaybutton);

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

        return {
            state,
            initSettings,

            overlayWrist,
            hidePrivateFromFeed,
            openVRAlways,
            overlaybutton,

            setOverlayWrist,
            setHidePrivateFromFeed,
            setOpenVRAlways,
            setOverlaybutton
        };
    }
);
