import { createPinia } from 'pinia';
import { useAvatarStore } from './avatar';
import { useFavoriteStore } from './favorite';
import { useGroupStore } from './group';
import { useLocationStore } from './location';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useDiscordPresenceSettingsStore } from './settings/discordPresence';
import { useGeneralSettingsStore } from './settings/general';
import { useNotificationsSettingsStore } from './settings/notifications';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';
import { useAvatarProviderStore } from './avatarProvider';
import { useDebugStore } from './debug';
import { useFriendStore } from './friend';
import { usePhotonStore } from './photon';
import { useUserStore } from './user';
import { useVRCXUpdaterStore } from './vrcxUpdater';
import { useWorldStore } from './world';
import { useInstanceStore } from './instance';
import { useModerationStore } from './moderation';
import { useInviteStore } from './invite';
import { useGalleryStore } from './gallery';
import { useNotificationStore } from './notification';
import { useFeedStore } from './feed';

export const pinia = createPinia();

export function createGlobalStores() {
    return {
        advancedSettings: useAdvancedSettingsStore(),
        appearanceSettings: useAppearanceSettingsStore(),
        discordPresenceSettings: useDiscordPresenceSettingsStore(),
        generalSettings: useGeneralSettingsStore(),
        notificationsSettings: useNotificationsSettingsStore(),
        wristOverlaySettings: useWristOverlaySettingsStore(),
        avatarProvider: useAvatarProviderStore(),
        debug: useDebugStore(),
        favorite: useFavoriteStore(),
        friend: useFriendStore(),
        photon: usePhotonStore(),
        user: useUserStore(),
        vrcxUpdater: useVRCXUpdaterStore(),
        avatar: useAvatarStore(),
        world: useWorldStore(),
        group: useGroupStore(),
        location: useLocationStore(),
        instance: useInstanceStore(),
        moderation: useModerationStore(),
        invite: useInviteStore(),
        gallery: useGalleryStore(),
        notification: useNotificationStore(),
        feed: useFeedStore()
    };
}
