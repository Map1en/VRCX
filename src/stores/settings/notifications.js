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
        ovrtWristNotifications: false,
        imageNotifications: true,
        desktopToast: 'Never',
        afkDesktopToast: false,
        notificationTTS: 'Never',
        notificationTTSNickName: false
    });

    async function initSettings() {
        const [
            overlayToast,
            openVR,
            overlayNotifications,
            xsNotifications,
            ovrtHudNotifications,
            ovrtWristNotifications,
            imageNotifications,
            desktopToast,
            afkDesktopToast,
            notificationTTS,
            notificationTTSNickName
        ] = await Promise.all([
            configRepository.getString('VRCX_overlayToast', 'Game Running'),
            configRepository.getBool('VRCX_overlayNotifications', true),
            configRepository.getBool('openVR', false),
            configRepository.getBool('VRCX_xsNotifications', true),
            configRepository.getBool('VRCX_ovrtHudNotifications', true),
            configRepository.getBool('VRCX_ovrtWristNotifications', false),
            configRepository.getBool('VRCX_imageNotifications', true),
            configRepository.getString('VRCX_desktopToast', 'Never'),
            configRepository.getBool('VRCX_afkDesktopToast', false),
            configRepository.getString('VRCX_notificationTTS', 'Never'),
            configRepository.getBool('VRCX_notificationTTSNickName', false)
        ]);
        state.overlayToast = overlayToast;
        state.openVR = openVR;
        state.overlayNotifications = overlayNotifications;
        state.xsNotifications = xsNotifications;
        state.ovrtHudNotifications = ovrtHudNotifications;
        state.ovrtWristNotifications = ovrtWristNotifications;
        state.imageNotifications = imageNotifications;
        state.desktopToast = desktopToast;
        state.afkDesktopToast = afkDesktopToast;
        state.notificationTTS = notificationTTS;
        state.notificationTTSNickName = notificationTTSNickName;
    }

    const overlayToast = computed(() => state.overlayToast);
    const openVR = computed(() => state.openVR);
    const overlayNotifications = computed(() => state.overlayNotifications);
    const xsNotifications = computed(() => state.xsNotifications);
    const ovrtHudNotifications = computed(() => state.ovrtHudNotifications);
    const ovrtWristNotifications = computed(() => state.ovrtWristNotifications);
    const imageNotifications = computed(() => state.imageNotifications);
    const desktopToast = computed(() => state.desktopToast);
    const afkDesktopToast = computed(() => state.afkDesktopToast);
    const notificationTTS = computed(() => state.notificationTTS);
    const notificationTTSNickName = computed(
        () => state.notificationTTSNickName
    );

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
    function setImageNotifications() {
        state.imageNotifications = !state.imageNotifications;
        configRepository.setBool(
            'VRCX_imageNotifications',
            state.imageNotifications
        );
    }
    function setDesktopToast(value) {
        state.desktopToast = value;
        configRepository.setString('VRCX_desktopToast', value);
    }
    function setAfkDesktopToast() {
        state.afkDesktopToast = !state.afkDesktopToast;
        configRepository.setBool('VRCX_afkDesktopToast', state.afkDesktopToast);
    }
    function setNotificationTTS(value) {
        state.notificationTTS = value;
        configRepository.setString('VRCX_notificationTTS', value);
    }
    function setNotificationTTSNickName() {
        state.notificationTTSNickName = !state.notificationTTSNickName;
        configRepository.setBool(
            'VRCX_notificationTTSNickName',
            state.notificationTTSNickName
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
        imageNotifications,
        desktopToast,
        afkDesktopToast,
        notificationTTS,
        notificationTTSNickName,

        setOverlayToast,
        setOpenVR,
        setOverlayNotifications,
        setXsNotifications,
        setOvrtHudNotifications,
        setOvrtWristNotifications,
        setImageNotifications,
        setDesktopToast,
        setAfkDesktopToast,
        setNotificationTTS,
        setNotificationTTSNickName
    };
});
