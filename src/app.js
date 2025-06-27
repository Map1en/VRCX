// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import Vue from 'vue';
import pugTemplate from './app.pug';
import './setup';

import prompts from './classes/prompts.js';
import uiComponents from './classes/uiComponents.js';
import websocket from './classes/websocket.js';
import AvatarDialog from './components/dialogs/AvatarDialog/AvatarDialog.vue';
import ChooseFavoriteGroupDialog from './components/dialogs/ChooseFavoriteGroupDialog.vue';
import FullscreenImageDialog from './components/dialogs/FullscreenImageDialog.vue';
import GalleryDialog from './components/dialogs/GalleryDialog.vue';
import GroupDialog from './components/dialogs/GroupDialog/GroupDialog.vue';
import LaunchDialog from './components/dialogs/LaunchDialog.vue';
import PreviousInstancesInfoDialog from './components/dialogs/PreviousInstancesDialog/PreviousInstancesInfoDialog.vue';
import UserDialog from './components/dialogs/UserDialog/UserDialog.vue';
import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';
import WorldDialog from './components/dialogs/WorldDialog/WorldDialog.vue';
import NavMenu from './components/NavMenu.vue';

import configRepository from './service/config.js';
import { API, i18n, t } from './setup';
import { refreshCustomCss, refreshCustomScript } from './shared/utils';
import { _utils } from './shared/utils/_utils';
import { createGlobalStores, pinia } from './stores';
import ChartsTab from './views/Charts/Charts.vue';
import AvatarImportDialog from './views/Favorites/dialogs/AvatarImportDialog.vue';
import FriendImportDialog from './views/Favorites/dialogs/FriendImportDialog.vue';
import WorldImportDialog from './views/Favorites/dialogs/WorldImportDialog.vue';
import FavoritesTab from './views/Favorites/Favorites.vue';
import FeedTab from './views/Feed/Feed.vue';
import FriendListTab from './views/FriendList/FriendList.vue';
import FriendLogTab from './views/FriendLog/FriendLog.vue';
import GameLogTab from './views/GameLog/GameLog.vue';
import LoginPage from './views/Login/Login.vue';
import ModerationTab from './views/Moderation/Moderation.vue';
import NotificationTab from './views/Notifications/Notification.vue';
import PlayerListTab from './views/PlayerList/PlayerList.vue';
import EditInviteMessageDialog from './views/Profile/dialogs/EditInviteMessageDialog.vue';
import ProfileTab from './views/Profile/Profile.vue';
import SearchTab from './views/Search/Search.vue';
import LaunchOptionsDialog from './views/Settings/dialogs/LaunchOptionsDialog.vue';
import PrimaryPasswordDialog from './views/Settings/dialogs/PrimaryPasswordDialog.vue';
import VRChatConfigDialog from './views/Settings/dialogs/VRChatConfigDialog.vue';
import SettingsTab from './views/Settings/Settings.vue';
import Sidebar from './views/Sidebar/Sidebar.vue';

console.log(`isLinux: ${LINUX}`);

// #region | Hey look it's most of VRCX!
// prompt: 'You are a software engineer. Please refactor the VRCX.'

const initThemeMode = await configRepository.getString(
    'VRCX_ThemeMode',
    'system'
);

let $app = {
    template: pugTemplate,
    pinia,
    i18n,
    setup() {
        const store = createGlobalStores();
        store.appearanceSettings.saveThemeMode(initThemeMode);
        return {
            store
        };
    },
    data: {
        dontLogMeOut: false,
        API
    },
    computed: {},
    methods: {
        /**
         * This function is called by .NET(CefCustomDragHandler#CefCustomDragHandler) when a file is dragged over a drop zone in the app window.
         * @param {string} filePath - The full path to the file being dragged into the window
         */
        dragEnterCef(filePath) {
            this.store.vrcx.currentlyDroppingFile = filePath;
        },
        ..._utils
    },
    watch: {},
    components: {
        LoginPage,
        NavMenu,
        FeedTab,
        GameLogTab,
        PlayerListTab,
        SearchTab,
        FavoritesTab,
        FriendLogTab,
        ModerationTab,
        NotificationTab,
        FriendListTab,
        ChartsTab,
        ProfileTab,
        SettingsTab,
        Sidebar,
        PreviousInstancesInfoDialog,
        UserDialog,
        WorldDialog,
        GroupDialog,
        AvatarDialog,
        FriendImportDialog,
        WorldImportDialog,
        AvatarImportDialog,
        ChooseFavoriteGroupDialog,
        LaunchDialog,
        LaunchOptionsDialog,
        VRCXUpdateDialog,
        EditInviteMessageDialog,
        VRChatConfigDialog,
        PrimaryPasswordDialog,
        FullscreenImageDialog,
        GalleryDialog
    },
    el: '#root',
    created() {
        if (LINUX) {
            this.store.updateLoop.updateLoop();
        }
        AppApi.SetUserAgent();
        AppApi.CheckGameRunning();
        refreshCustomCss();
        refreshCustomScript();
    },
    async mounted() {
        this.store.gameLog.getGameLogTable();
        await this.store.auth.migrateStoredUsers();
        this.store.auth.autoLoginAfterMounted();
        this.store.vrcx.checkAutoBackupRestoreVrcRegistry();
        this.store.game.checkVRChatDebugLogging();
        try {
            if (await AppApi.IsRunningUnderWine()) {
                this.store.vrcx.isRunningUnderWine = true;
                this.store.vrcx.applyWineEmojis();
            }
        } catch (err) {
            console.error(err, 'Failed to check if running under Wine');
        }
    }
};

uiComponents();
websocket();
prompts();

API.cachedUsers = new Map();

$app.data.debug = false;
$app.data.debugWebSocket = false;
$app.data.debugUserDiff = false;
$app.data.debugCurrentUserDiff = false;
$app.data.debugPhotonLogging = false;
$app.data.debugGameLog = false;

$app = new Vue($app);
window.$app = $app;
window.API = API;

export { $app, API, t };
