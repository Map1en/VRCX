import { createPinia } from 'pinia';
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
        friend: useFriendStore(),
        photon: usePhotonStore(),
        user: useUserStore(),
        vrcxUpdater: useVRCXUpdaterStore()
    };
}
