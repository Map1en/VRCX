import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useNotificationsStore = defineStore('NotificationsStore', () => {
    const state = reactive({
        overlayToast: true,
        openVR: false,
        overlayNotifications: true,
        xsNotifications: true,
        ovrtHudNotifications: true,
        ovrtWristNotifications: false
    });

    async function initSettings() {
        const [
            overlayToast,
            openVR,
            overlayNotifications,
            xsNotifications,
            ovrtHudNotifications,
            ovrtWristNotifications
        ] = await Promise.all([
            configRepository.getString('VRCX_overlayToast', 'Game Running'),
            configRepository.getBool('VRCX_overlayNotifications', true),
            configRepository.getBool('openVR', false),
            configRepository.getBool('VRCX_xsNotifications', true),
            configRepository.getBool('VRCX_ovrtHudNotifications', true),
            configRepository.getBool('VRCX_ovrtWristNotifications', false)
        ]);
        state.overlayToast = overlayToast;
        state.openVR = openVR;
        state.overlayNotifications = overlayNotifications;
        state.xsNotifications = xsNotifications;
        state.ovrtHudNotifications = ovrtHudNotifications;
        state.ovrtWristNotifications = ovrtWristNotifications;
    }

    const overlayToast = computed(() => state.overlayToast);
    const openVR = computed(() => state.openVR);
    const overlayNotifications = computed(() => state.overlayNotifications);
    const xsNotifications = computed(() => state.xsNotifications);
    const ovrtHudNotifications = computed(() => state.ovrtHudNotifications);
    const ovrtWristNotifications = computed(() => state.ovrtWristNotifications);

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
    function setXsNotifications() {
        state.xsNotifications = !state.xsNotifications;
        configRepository.setBool('VRCX_xsNotifications', state.xsNotifications);
    }
    function setOvrtHudNotifications() {
        state.ovrtHudNotifications = !state.ovrtHudNotifications;
        configRepository.setBool(
            'VRCX_ovrtHudNotifications',
            state.ovrtHudNotifications
        );
    }
    function setOvrtWristNotifications() {
        state.ovrtWristNotifications = !state.ovrtWristNotifications;
        configRepository.setBool(
            'VRCX_ovrtWristNotifications',
            state.ovrtWristNotifications
        );
    }

    return {
        state,
        initSettings,

        overlayToast,
        openVR,
        overlayNotifications,
        xsNotifications,
        ovrtHudNotifications,
        ovrtWristNotifications,

        setOverlayToast,
        setOpenVR,
        setOverlayNotifications,
        setXsNotifications,
        setOvrtHudNotifications,
        setOvrtWristNotifications
    };
});
