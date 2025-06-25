// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

// #region | Imports
import '@fontsource/noto-sans-kr';
import '@fontsource/noto-sans-jp';
import '@fontsource/noto-sans-sc';
import '@fontsource/noto-sans-tc';
import '@infolektuell/noto-color-emoji';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import ElementUI from 'element-ui';
import Noty from 'noty';

// pinia
import { PiniaVuePlugin } from 'pinia';
import Vue from 'vue';
import { DataTables } from 'vue-data-tables';
import VueI18n from 'vue-i18n';
import { createI18n } from 'vue-i18n-bridge';
import VueLazyload from 'vue-lazyload';
import * as workerTimers from 'worker-timers';

import pugTemplate from './app.pug';

// API classes
import config from './classes/API/config.js';

// main app classes
import apiLogin from './classes/apiLogin.js';
import apiRequestHandler from './classes/apiRequestHandler.js';
import currentUser from './classes/currentUser.js';
import discordRpc from './classes/discordRpc.js';
import gameLog from './classes/gameLog.js';
import gameRealtimeLogging from './classes/gameRealtimeLogging.js';
import groups from './classes/groups.js';
import prompts from './classes/prompts.js';
import sharedFeed from './classes/sharedFeed.js';
import uiComponents from './classes/uiComponents.js';
import updateLoop from './classes/updateLoop.js';
import vrcRegistry from './classes/vrcRegistry.js';
import _vrcxJsonStorage from './classes/vrcxJsonStorage.js';
import websocket from './classes/websocket.js';
import AvatarDialog from './components/dialogs/AvatarDialog/AvatarDialog.vue';
import ChooseFavoriteGroupDialog from './components/dialogs/ChooseFavoriteGroupDialog.vue';
import FullscreenImageDialog from './components/dialogs/FullscreenImageDialog.vue';
import GroupDialog from './components/dialogs/GroupDialog/GroupDialog.vue';
import LaunchDialog from './components/dialogs/LaunchDialog.vue';
import PreviousInstancesInfoDialog from './components/dialogs/PreviousInstancesDialog/PreviousInstancesInfoDialog.vue';
import SafeDialog from './components/dialogs/SafeDialog.vue';
import UserDialog from './components/dialogs/UserDialog/UserDialog.vue';
import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';
import WorldDialog from './components/dialogs/WorldDialog/WorldDialog.vue';

// dialogs
import Location from './components/Location.vue';
import NavMenu from './components/NavMenu.vue';

// components
import SimpleSwitch from './components/SimpleSwitch.vue';
import InteropApi from './ipc-electron/interopApi.js';
import * as localizedStrings from './localization/localizedStrings.js';

// util classes
import configRepository from './service/config.js';
import {
    commaNumber,
    refreshCustomCss,
    refreshCustomScript,
    removeFromArray,
    textToHex,
    timeToText
} from './shared/utils';
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

// tabs
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

// #endregion

// some workaround for failing to get voice list first run
speechSynthesis.getVoices();

console.log(`isLinux: ${LINUX}`);

// #region | Hey look it's most of VRCX!

// #region | Init Cef C# bindings
if (WINDOWS) {
    await CefSharp.BindObjectAsync(
        'AppApi',
        'WebApi',
        'SharedVariable',
        'VRCXStorage',
        'SQLite',
        'LogWatcher',
        'Discord',
        'AssetBundleManager'
    );
} else {
    window.AppApi = InteropApi.AppApiElectron;
    window.WebApi = InteropApi.WebApi;
    window.SharedVariable = InteropApi.SharedVariable;
    window.VRCXStorage = InteropApi.VRCXStorage;
    window.SQLite = InteropApi.SQLiteLegacy;
    window.LogWatcher = InteropApi.LogWatcher;
    window.Discord = InteropApi.Discord;
    window.AssetBundleManager = InteropApi.AssetBundleManager;
}

Vue.config.errorHandler = function (err, vm, info) {
    console.error('Vue Error：', err);
    console.error('Component：', vm);
    console.error('Error Info：', info);
};
Vue.config.warnHandler = function (msg, vm, trace) {
    console.warn('Vue Warning：', msg);
    console.warn('Component：', vm);
    console.warn('Trace：', trace);
};

const eventHandlers = new Map();
const API = {};
API.$emit = function (name, ...args) {
    if ($app.debug) {
        console.log(name, ...args);
    }
    const handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        return;
    }
    try {
        for (const handler of handlers) {
            handler.apply(this, args);
        }
    } catch (err) {
        console.error(err);
    }
};

API.$on = function (name, handler) {
    let handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        handlers = [];
        eventHandlers.set(name, handlers);
    }
    handlers.push(handler);
};

API.$off = function (name, handler) {
    const handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        return;
    }
    const { length } = handlers;
    for (let i = 0; i < length; ++i) {
        if (handlers[i] === handler) {
            if (length > 1) {
                handlers.splice(i, 1);
            } else {
                eventHandlers.delete(name);
            }
            break;
        }
    }
};

// #region | localization
Vue.use(VueI18n, { bridge: true });
const i18n = createI18n(
    {
        locale: 'en',
        fallbackLocale: 'en',
        messages: localizedStrings,
        legacy: false,
        globalInjection: true,
        missingWarn: false,
        warnHtmlMessage: false,
        fallbackWarn: false
    },
    VueI18n
);
const $t = i18n.global.t;
Vue.use(i18n);
Vue.use(ElementUI, {
    i18n: (key, value) => i18n.global.t(key, value)
});

Vue.use(PiniaVuePlugin);

new _vrcxJsonStorage(VRCXStorage);

await configRepository.init();

// todo: seiri

/** Temporary solution, no way store initialization is too slow
 *  Probably the few need to be preloaded like this,
 *  it's normal, frontend always with a bunch of messy requirements.
 */
const [initThemeMode, appLanguage] = await Promise.all([
    configRepository.getString('VRCX_ThemeMode', 'system'),
    configRepository.getString('VRCX_appLanguage')
]);

i18n.locale = appLanguage;

let $app = {
    template: pugTemplate,
    pinia,
    i18n,
    setup() {
        const store = createGlobalStores();
        store.appearanceSettings.setThemeMode(initThemeMode);
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

        // components
        Location,
        SimpleSwitch,

        // - dialogs
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
        FullscreenImageDialog
    },
    provide() {
        return {
            displayPreviousImages: this.displayPreviousImages,
            languageClass: this.languageClass,
            showGallerySelectDialog: this.showGallerySelectDialog
        };
    },
    el: '#root',
    async created() {
        AppApi.SetUserAgent();
        AppApi.CheckGameRunning();
    },
    async mounted() {
        refreshCustomCss();
        refreshCustomScript();

        this.updateLoop();
        this.getGameLogTable();
        this.store.game.checkVRChatDebugLogging();
        this.checkAutoBackupRestoreVrcRegistry();
        await this.store.auth.migrateStoredUsers();
        if (
            !this.store.advancedSettings.enablePrimaryPassword &&
            (await configRepository.getString('lastUserLoggedIn')) !== null
        ) {
            const user =
                this.store.auth.loginForm.savedCredentials[
                    this.store.auth.loginForm.lastUserLoggedIn
                ];
            if (user?.loginParmas?.endpoint) {
                API.endpointDomain = user.loginParmas.endpoint;
                API.websocketDomain = user.loginParmas.websocket;
            }
            // login at startup
            this.store.auth.loginForm.loading = true;
            API.getConfig()
                .catch((err) => {
                    this.store.auth.loginForm.loading = false;
                    throw err;
                })
                .then((args) => {
                    API.getCurrentUser()
                        .finally(() => {
                            this.store.auth.loginForm.loading = false;
                        })
                        .catch((err) => {
                            this.nextCurrentUserRefresh = 60; // 1min
                            console.error(err);
                        });
                    return args;
                });
        }
        try {
            this.store.vrcx.isRunningUnderWine =
                await AppApi.IsRunningUnderWine();
            this.store.vrcx.applyWineEmojis();
        } catch (err) {
            console.error(err);
        }
    }
};

apiRequestHandler();
uiComponents();
websocket();
sharedFeed();
prompts();
apiLogin();
currentUser();
updateLoop();
gameLog();
gameRealtimeLogging();
config();
groups();
discordRpc();
vrcRegistry();

// #endregion
// #region | Init: Noty, Vue, Vue-Markdown, ElementUI, VueI18n, VueLazyLoad, Vue filters, dark stylesheet, dayjs

Noty.overrideDefaults({
    animation: {
        open: 'animate__animated animate__bounceInLeft',
        close: 'animate__animated animate__bounceOutLeft'
    },
    layout: 'bottomLeft',
    theme: 'mint',
    timeout: 6000
});

Vue.filter('commaNumber', commaNumber);
Vue.filter('textToHex', textToHex);

Vue.use(VueLazyload, {
    preLoad: 1,
    observer: true,
    observerOptions: {
        rootMargin: '0px',
        threshold: 0
    },
    attempt: 3
});

Vue.use(DataTables);

Vue.component('SafeDialog', SafeDialog);

dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrAfter);

// #endregion

// #endregion
// #region | API: This is NOT all the api functions, not even close :(

// #region | API: User

// changeUserName: PUT users/${userId} {displayName: string, currentPassword: string}
// changeUserEmail: PUT users/${userId} {email: string, currentPassword: string}
// changePassword: PUT users/${userId} {password: string, currentPassword: string}
// updateTOSAggreement: PUT users/${userId} {acceptedTOSVersion: number}

// 2FA
// removeTwoFactorAuth: DELETE auth/twofactorauth
// getTwoFactorAuthpendingSecret: POST auth/twofactorauth/totp/pending -> { qrCodeDataUrl: string, secret: string }
// verifyTwoFactorAuthPendingSecret: POST auth/twofactorauth/totp/pending/verify { code: string } -> { verified: bool, enabled: bool }
// cancelVerifyTwoFactorAuthPendingSecret: DELETE auth/twofactorauth/totp/pending
// getTwoFactorAuthOneTimePasswords: GET auth/user/twofactorauth/otp -> { otp: [ { code: string, used: bool } ] }

// Account Link
// merge: PUT auth/user/merge {mergeToken: string}
// 링크됐다면 CurrentUser에 steamId, oculusId 값이 생기는듯
// 스팀 계정으로 로그인해도 steamId, steamDetails에 값이 생김

// Password Recovery
// sendLink: PUT auth/password {email: string}
// setNewPassword: PUT auth/password {emailToken: string, id: string, password: string}

API.cachedUsers = new Map();
API.currentTravelers = new Map();

// Countdown timer

const $countDownTimers = [];

Vue.component('CountdownTimer', {
    props: {
        datetime: {
            type: String,
            default() {
                return '';
            }
        },
        hours: {
            type: Number,
            default() {
                return 1;
            }
        }
    },
    data() {
        return {
            text: ''
        };
    },
    watch: {
        date() {
            this.update();
        }
    },
    mounted() {
        $countDownTimers.push(this);
        this.update();
    },
    destroyed() {
        removeFromArray($countDownTimers, this);
    },
    methods: {
        update() {
            const epoch =
                new Date(this.datetime).getTime() +
                1000 * 60 * 60 * this.hours -
                Date.now();
            if (epoch >= 0) {
                this.text = timeToText(epoch);
            } else {
                this.text = '-';
            }
        }
    },
    template: '<span v-text="text"></span>'
});

workerTimers.setInterval(function () {
    for (let $countDownTimer of $countDownTimers) {
        $countDownTimer.update();
    }
}, 5000);

// #endregion
// #region | initialise

$app.data.debug = false;
$app.data.debugWebSocket = false;
$app.data.debugUserDiff = false;
$app.data.debugCurrentUserDiff = false;
$app.data.debugPhotonLogging = false;
$app.data.debugGameLog = false;

// #endregion
// #region | App: Friends

$app.data.friendNumber = 0;
$app.data.isGroupInstances = false;
$app.data.groupInstances = [];

// #endregion
// #region | App: Feed

// #endregion
// #region | App: Notification

$app.data.gameLogTable.vip = false;
// gameLog loads before favorites
// await configRepository.getBool(
//     'VRCX_gameLogTableVIPFilter',
//     false
// );
$app.data.gameLogTable.filter = JSON.parse(
    await configRepository.getString('VRCX_gameLogTableFilters', '[]')
);

// #endregion
// #region | App: Profile + Settings

// VRChat Config JSON

// Screenshot Helper

// #endregion
// #region Misc

// #endregion
// #region | App: ChatBox Blacklist

// #endregion
// #region | Dialog: fullscreen image

// #endregion
// #region | Tab Props

$app.computed.sidebarTabBind = function () {
    return {
        groupInstances: this.groupInstances
    };
};

$app.computed.gameLogTabBind = function () {
    return {
        gameLogTable: this.gameLogTable,
        gameLogIsFriend: this.gameLogIsFriend,
        gameLogIsFavorite: this.gameLogIsFavorite
    };
};

$app.computed.gameLogTabEvent = function () {
    return {
        gameLogTableLookup: this.gameLogTableLookup,
        updateGameLogSessionTable: (val) => (this.gameLogSessionTable = val),
        updateSharedFeed: this.updateSharedFeed
    };
};

$app.computed.profileTabEvent = function () {
    return {
        logout: this.logout
    };
};

$app.computed.playerListTabBind = function () {
    return {
        photonLoggingEnabled: this.store.photon.photonLoggingEnabled,
        photonEventTableFilter: this.photonEventTableFilter,
        ipcEnabled: this.ipcEnabled
    };
};

$app.computed.playerListTabEvent = function () {
    return {
        photonEventTableFilterChange: this.photonEventTableFilterChange,
        showUserFromPhotonId: this.showUserFromPhotonId
    };
};

$app.computed.loginPageBind = function () {
    return {
        enableCustomEndpoint: this.enableCustomEndpoint
    };
};

$app.computed.loginPageEvent = function () {
    return {
        promptProxySettings: this.promptProxySettings,
        toggleCustomEndpoint: this.toggleCustomEndpoint,
        deleteSavedLogin: this.deleteSavedLogin,
        login: this.login,
        relogin: this.relogin
    };
};

$app.computed.settingsTabBind = function () {
    return {
        backupVrcRegistry: this.backupVrcRegistry
    };
};

$app.computed.settingsTabEvent = function () {
    return {
        promptProxySettings: this.promptProxySettings,
        promptMaxTableSizeDialog: this.promptMaxTableSizeDialog,
        promptNotificationTimeout: this.promptNotificationTimeout,
        saveDiscordOption: this.saveDiscordOption,
        promptPhotonOverlayMessageTimeout:
            this.promptPhotonOverlayMessageTimeout,
        photonEventTableFilterChange: this.photonEventTableFilterChange,
        promptPhotonLobbyTimeoutThreshold:
            this.promptPhotonLobbyTimeoutThreshold,
        disableGameLogDialog: this.disableGameLogDialog,
        promptAutoClearVRCXCacheFrequency:
            this.promptAutoClearVRCXCacheFrequency,
        updateSharedFeed: this.updateSharedFeed
    };
};

// #endregion

// "$app" is being replaced by Vue, update references inside all the classes
$app = new Vue($app);
window.$app = $app;
window.API = API;

export { $app, API, $t, i18n };

// #endregion

// // #endregion
// // #region | Dialog: templateDialog

// $app.data.templateDialog = {
//     visible: false,
// };

// $app.methods.showTemplateDialog = function () {
//     this.$nextTick(() => $app.adjustDialogZ(this.$refs.templateDialog.$el));
//     var D = this.templateDialog;
//     D.visible = true;
// };

// // #endregion
