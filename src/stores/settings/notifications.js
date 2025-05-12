import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useNotificationsStore = defineStore('NotificationsStore', () => {
    const state = reactive({
        overlayToast: true,
        openVR: false,
        overlayNotifications: true
    });

    async function initSettings() {
        const [overlayToast, openVR, overlayNotifications] = await Promise.all([
            configRepository.getString('VRCX_overlayToast', 'Game Running'),
            configRepository.getBool('VRCX_overlayNotifications', true),
            configRepository.getBool('openVR', false)
        ]);
        state.overlayToast = overlayToast;
        state.openVR = openVR;
        state.overlayNotifications = overlayNotifications;
    }

    const overlayToast = computed(() => state.overlayToast);
    const overlayNotifications = computed(() => state.overlayNotifications);
    const openVR = computed(() => state.openVR);

    function setOverlayToast(value) {
        state.overlayToast = value;
        configRepository.setString('VRCX_overlayToast', value);
    }
    function setOverlayNotifications() {
        state.overlayNotifications = !state.overlayNotifications;
        configRepository.setBool(
            'VRCX_overlayNotifications',
            state.overlayNotifications
        );
    }
    function setOpenVR() {
        state.openVR = !state.openVR;
        configRepository.setBool('openVR', state.openVR);
    }

    return {
        state,
        initSettings,

        overlayToast,
        openVR,
        overlayNotifications,

        setOverlayToast,
        setOpenVR,
        setOverlayNotifications
    };
});
