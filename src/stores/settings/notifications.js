import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';
import { sharedFeedFiltersDefaults } from '../../shared/constants/feedFiltersOptions';

export const useNotificationsSettingsStore = defineStore(
    'NotificationsSettings',
    () => {
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
            notificationTTSNickName: false,
            sharedFeedFilters: {
                noty: {
                    Location: 'Off',
                    OnPlayerJoined: 'VIP',
                    OnPlayerLeft: 'VIP',
                    OnPlayerJoining: 'VIP',
                    Online: 'VIP',
                    Offline: 'VIP',
                    GPS: 'Off',
                    Status: 'Off',
                    invite: 'Friends',
                    requestInvite: 'Friends',
                    inviteResponse: 'Friends',
                    requestInviteResponse: 'Friends',
                    friendRequest: 'On',
                    Friend: 'On',
                    Unfriend: 'On',
                    DisplayName: 'VIP',
                    TrustLevel: 'VIP',
                    boop: 'Off',
                    groupChange: 'On',
                    'group.announcement': 'On',
                    'group.informative': 'On',
                    'group.invite': 'On',
                    'group.joinRequest': 'Off',
                    'group.transfer': 'On',
                    'group.queueReady': 'On',
                    'instance.closed': 'On',
                    PortalSpawn: 'Everyone',
                    Event: 'On',
                    External: 'On',
                    VideoPlay: 'Off',
                    BlockedOnPlayerJoined: 'Off',
                    BlockedOnPlayerLeft: 'Off',
                    MutedOnPlayerJoined: 'Off',
                    MutedOnPlayerLeft: 'Off',
                    AvatarChange: 'Off',
                    ChatBoxMessage: 'Off',
                    Blocked: 'Off',
                    Unblocked: 'Off',
                    Muted: 'Off',
                    Unmuted: 'Off'
                },
                wrist: {
                    Location: 'On',
                    OnPlayerJoined: 'Everyone',
                    OnPlayerLeft: 'Everyone',
                    OnPlayerJoining: 'Friends',
                    Online: 'Friends',
                    Offline: 'Friends',
                    GPS: 'Friends',
                    Status: 'Friends',
                    invite: 'Friends',
                    requestInvite: 'Friends',
                    inviteResponse: 'Friends',
                    requestInviteResponse: 'Friends',
                    friendRequest: 'On',
                    Friend: 'On',
                    Unfriend: 'On',
                    DisplayName: 'Friends',
                    TrustLevel: 'Friends',
                    boop: 'On',
                    groupChange: 'On',
                    'group.announcement': 'On',
                    'group.informative': 'On',
                    'group.invite': 'On',
                    'group.joinRequest': 'On',
                    'group.transfer': 'On',
                    'group.queueReady': 'On',
                    'instance.closed': 'On',
                    PortalSpawn: 'Everyone',
                    Event: 'On',
                    External: 'On',
                    VideoPlay: 'On',
                    BlockedOnPlayerJoined: 'Off',
                    BlockedOnPlayerLeft: 'Off',
                    MutedOnPlayerJoined: 'Off',
                    MutedOnPlayerLeft: 'Off',
                    AvatarChange: 'Everyone',
                    ChatBoxMessage: 'Off',
                    Blocked: 'On',
                    Unblocked: 'On',
                    Muted: 'On',
                    Unmuted: 'On'
                }
            }
        });

        async function initNotificationsSettings() {
            const [
                overlayToast,
                overlayNotifications,
                openVR,
                xsNotifications,
                ovrtHudNotifications,
                ovrtWristNotifications,
                imageNotifications,
                desktopToast,
                afkDesktopToast,
                notificationTTS,
                notificationTTSNickName,
                sharedFeedFilters
            ] = await Promise.all([
                configRepository.getString('VRCX_overlayToast', 'Game Running'),
                configRepository.getBool('VRCX_overlayNotifications', true),
                configRepository.getBool('openVR'),
                configRepository.getBool('VRCX_xsNotifications', true),
                configRepository.getBool('VRCX_ovrtHudNotifications', true),
                configRepository.getBool('VRCX_ovrtWristNotifications', false),
                configRepository.getBool('VRCX_imageNotifications', true),
                configRepository.getString('VRCX_desktopToast', 'Never'),
                configRepository.getBool('VRCX_afkDesktopToast', false),
                configRepository.getString('VRCX_notificationTTS', 'Never'),
                configRepository.getBool('VRCX_notificationTTSNickName', false),
                configRepository.getString(
                    'sharedFeedFilters',
                    JSON.stringify(sharedFeedFiltersDefaults)
                )
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
            state.sharedFeedFilters = JSON.parse(sharedFeedFilters);

            initSharedFeedFilters();
        }

        const overlayToast = computed(() => state.overlayToast);
        const openVR = computed(() => state.openVR);
        const overlayNotifications = computed(() => state.overlayNotifications);
        const xsNotifications = computed(() => state.xsNotifications);
        const ovrtHudNotifications = computed(() => state.ovrtHudNotifications);
        const ovrtWristNotifications = computed(
            () => state.ovrtWristNotifications
        );
        const imageNotifications = computed(() => state.imageNotifications);
        const desktopToast = computed(() => state.desktopToast);
        const afkDesktopToast = computed(() => state.afkDesktopToast);
        const notificationTTS = computed(() => state.notificationTTS);
        const notificationTTSNickName = computed(
            () => state.notificationTTSNickName
        );
        const sharedFeedFilters = computed({
            get: () => state.sharedFeedFilters,
            set: (value) => (state.sharedFeedFilters = value)
        });

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
            configRepository.setBool(
                'VRCX_xsNotifications',
                state.xsNotifications
            );
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
        /**
         * @param {string} value
         */
        function setDesktopToast(value) {
            state.desktopToast = value;
            configRepository.setString('VRCX_desktopToast', value);
        }
        function setAfkDesktopToast() {
            state.afkDesktopToast = !state.afkDesktopToast;
            configRepository.setBool(
                'VRCX_afkDesktopToast',
                state.afkDesktopToast
            );
        }
        /**
         * @param {string} value
         */
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
        function initSharedFeedFilters() {
            if (!state.sharedFeedFilters.noty.Blocked) {
                state.sharedFeedFilters.noty.Blocked = 'Off';
                state.sharedFeedFilters.noty.Unblocked = 'Off';
                state.sharedFeedFilters.noty.Muted = 'Off';
                state.sharedFeedFilters.noty.Unmuted = 'Off';
                state.sharedFeedFilters.wrist.Blocked = 'On';
                state.sharedFeedFilters.wrist.Unblocked = 'On';
                state.sharedFeedFilters.wrist.Muted = 'On';
                state.sharedFeedFilters.wrist.Unmuted = 'On';
            }
            if (!state.sharedFeedFilters.noty['group.announcement']) {
                state.sharedFeedFilters.noty['group.announcement'] = 'On';
                state.sharedFeedFilters.noty['group.informative'] = 'On';
                state.sharedFeedFilters.noty['group.invite'] = 'On';
                state.sharedFeedFilters.noty['group.joinRequest'] = 'Off';
                state.sharedFeedFilters.wrist['group.announcement'] = 'On';
                state.sharedFeedFilters.wrist['group.informative'] = 'On';
                state.sharedFeedFilters.wrist['group.invite'] = 'On';
                state.sharedFeedFilters.wrist['group.joinRequest'] = 'On';
            }
            if (!state.sharedFeedFilters.noty['group.queueReady']) {
                state.sharedFeedFilters.noty['group.queueReady'] = 'On';
                state.sharedFeedFilters.wrist['group.queueReady'] = 'On';
            }
            if (!state.sharedFeedFilters.noty['instance.closed']) {
                state.sharedFeedFilters.noty['instance.closed'] = 'On';
                state.sharedFeedFilters.wrist['instance.closed'] = 'On';
            }
            if (!state.sharedFeedFilters.noty.External) {
                state.sharedFeedFilters.noty.External = 'On';
                state.sharedFeedFilters.wrist.External = 'On';
            }
            if (!state.sharedFeedFilters.noty.groupChange) {
                state.sharedFeedFilters.noty.groupChange = 'On';
                state.sharedFeedFilters.wrist.groupChange = 'On';
            }
            if (!state.sharedFeedFilters.noty['group.transfer']) {
                state.sharedFeedFilters.noty['group.transfer'] = 'On';
                state.sharedFeedFilters.wrist['group.transfer'] = 'On';
            }
            if (!state.sharedFeedFilters.noty.boop) {
                state.sharedFeedFilters.noty.boop = 'Off';
                state.sharedFeedFilters.wrist.boop = 'On';
            }
        }

        initNotificationsSettings();

        return {
            state,

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
            sharedFeedFilters,

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
    }
);
