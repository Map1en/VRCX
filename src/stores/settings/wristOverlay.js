import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useWristOverlaySettingsStore = defineStore(
    'WristOverlaySettings',
    () => {
        const state = reactive({
            overlayWrist: true
        });

        async function initSettings() {
            const [overlayWrist] = await Promise.all([
                configRepository.getBool('VRCX_overlayWrist', false)
            ]);

            state.overlayWrist = overlayWrist;
        }

        const overlayWrist = computed(() => state.overlayWrist);

        function setOverlayWrist(value) {
            state.overlayWrist = !state.overlayWrist;
            configRepository.setBool('VRCX_overlayWrist', value);
        }

        return {
            state,
            initSettings,

            overlayWrist,

            setOverlayWrist
        };
    }
);
