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
import { userRequest, worldRequest } from './api';

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
import { userNotes } from './classes/userNotes.js';
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
import database from './service/database.js';
import webApiService from './service/webapi.js';
import {
    commaNumber,
    escapeTag,
    getAllUserMemos,
    getNameColour,
    migrateMemos,
    parseLocation,
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
        API
    },
    computed: {},
    methods: {
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
            showFullscreenImageDialog: this.showFullscreenImageDialog,
            displayPreviousImages: this.displayPreviousImages,
            languageClass: this.languageClass,
            showGallerySelectDialog: this.showGallerySelectDialog,
            isLinux: this.isLinux
        };
    },
    el: '#root',
    async created() {
        await AppApi.CheckGameRunning();
    },
    async mounted() {
        refreshCustomCss();
        refreshCustomScript();

        AppApi.SetUserAgent();

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

// #endregion
// #region | Misc

const $timers = [];

Vue.component('Timer', {
    props: {
        epoch: {
            type: Number,
            default() {
                return Date.now();
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
        $timers.push(this);
        this.update();
    },
    destroyed() {
        removeFromArray($timers, this);
    },
    methods: {
        update() {
            if (!this.epoch) {
                this.text = '-';
                return;
            }
            this.text = timeToText(Date.now() - this.epoch);
        }
    },
    template: '<span v-text="text"></span>'
});

workerTimers.setInterval(function () {
    for (let $timer of $timers) {
        $timer.update();
    }
}, 5000);

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

API.$on('LOGOUT', function () {
    if (this.isLoggedIn) {
        new Noty({
            type: 'success',
            text: `See you again, <strong>${escapeTag(
                this.currentUser.displayName
            )}</strong>!`
        }).show();
    }
    this.isLoggedIn = false;
    $app.store.friend.friendLogInitStatus = false;
    $app.store.notification.notificationInitStatus = false;
});

API.$on('LOGIN', function (args) {
    new Noty({
        type: 'success',
        text: `Hello there, <strong>${escapeTag(
            args.ref.displayName
        )}</strong>!`
    }).show();
    $app.store.auth.updateStoredUser(this.currentUser);
});

API.$on('LOGOUT', async function () {
    await $app.store.auth.updateStoredUser(this.currentUser);
    webApiService.clearCookies();
    $app.store.auth.loginForm.lastUserLoggedIn = '';
    await configRepository.remove('lastUserLoggedIn');
    // workerTimers.setTimeout(() => location.reload(), 500);
});

// #endregion
// #region | App: Friends

$app.data.friendNumber = 0;
$app.data.isGroupInstances = false;
$app.data.groupInstances = [];

API.$on('USER:CURRENT', function (args) {
    $app.store.friend.checkActiveFriends(args.json);
});

API.$on('LOGIN', function () {
    $app.store.friend.friends.clear();
    $app.store.friend.pendingActiveFriends.clear();
    $app.friendNumber = 0;
    $app.isGroupInstances = false;
    $app.groupInstances = [];
    $app.store.friend.vipFriends_ = [];
    $app.store.friend.onlineFriends_ = [];
    $app.store.friend.activeFriends_ = [];
    $app.store.friend.offlineFriends_ = [];
    $app.store.friend.sortVIPFriends = false;
    $app.store.friend.sortOnlineFriends = false;
    $app.store.friend.sortActiveFriends = false;
    $app.store.friend.sortOfflineFriends = false;
    $app.store.group.updateInGameGroupOrder();
});

API.$on('USER:CURRENT', function (args) {
    // USER:CURRENT에서 처리를 함
    if ($app.store.friend.friendLogInitStatus) {
        $app.store.friend.refreshFriendsStatus(
            args.ref,
            args.fromGetCurrentUser
        );
    }
    $app.store.friend.updateOnlineFriendCoutner();

    if ($app.store.appearanceSettings.randomUserColours) {
        getNameColour(this.currentUser.id).then((colour) => {
            this.currentUser.$userColour = colour;
        });
    }
});

// #endregion
// #region | App: Feed

$app.data.dontLogMeOut = false;

API.$on('LOGIN', async function (args) {
    // early loading indicator
    $app.store.friend.isRefreshFriendsLoading = true;
    $app.store.feed.feedTable.loading = true;

    $app.store.friend.friendLog = new Map();
    $app.store.feed.feedTable.data = [];
    $app.store.feed.feedSessionTable = [];
    $app.store.friend.friendLogInitStatus = false;
    $app.store.notification.notificationInitStatus = false;
    await database.initUserTables(args.json.id);
    $app.store.ui.menuActiveIndex = 'feed';

    $app.gameLogTable.data = await database.lookupGameLogDatabase(
        $app.gameLogTable.search,
        $app.gameLogTable.filter
    );
    $app.store.feed.feedSessionTable = await database.getFeedDatabase();
    await $app.store.feed.feedTableLookup();
    $app.store.notification.notificationTable.data =
        await database.getNotifications();
    $app.store.notification.refreshNotifications();
    $app.loadCurrentUserGroups(args.json.id, args.json?.presence?.groups);
    try {
        if (await configRepository.getBool(`friendLogInit_${args.json.id}`)) {
            await $app.store.friend.getFriendLog(args.ref);
        } else {
            await $app.store.friend.initFriendLog(args.ref);
        }
    } catch (err) {
        if (!$app.dontLogMeOut) {
            $app.$message({
                message: $t('message.friend.load_failed'),
                type: 'error'
            });
            this.logout();
            throw err;
        }
    }
    await $app.store.avatar.getAvatarHistory();
    await getAllUserMemos();
    userNotes.init();
    if ($app.store.appearanceSettings.randomUserColours) {
        getNameColour(this.currentUser.id).then((colour) => {
            this.currentUser.$userColour = colour;
        });
        await $app.store.appearanceSettings.userColourInit();
    }
    await $app.store.friend.getAllUserStats();
    $app.store.friend.sortVIPFriends = true;
    $app.store.friend.sortOnlineFriends = true;
    $app.store.friend.sortActiveFriends = true;
    $app.store.friend.sortOfflineFriends = true;
    this.getAuth();
    $app.updateSharedFeed(true);
    if ($app.store.game.isGameRunning) {
        $app.loadPlayerList();
    }
    $app.store.vr.vrInit();
    // remove old data from json file and migrate to SQLite
    if (await VRCXStorage.Get(`${args.json.id}_friendLogUpdatedAt`)) {
        VRCXStorage.Remove(`${args.json.id}_feedTable`);
        migrateMemos();
        $app.store.friend.migrateFriendLog(args.json.id);
    }
    await AppApi.IPCAnnounceStart();
});

$app.methods.loadPlayerList = function () {
    let ctx;
    let i;
    const data = this.gameLogSessionTable;
    if (data.length === 0) {
        return;
    }
    let length = 0;
    for (i = data.length - 1; i > -1; i--) {
        ctx = data[i];
        if (ctx.type === 'Location') {
            this.store.location.lastLocation = {
                date: Date.parse(ctx.created_at),
                location: ctx.location,
                name: ctx.worldName,
                playerList: new Map(),
                friendList: new Map()
            };
            length = i;
            break;
        }
    }
    if (length > 0) {
        for (i = length + 1; i < data.length; i++) {
            ctx = data[i];
            if (ctx.type === 'OnPlayerJoined') {
                if (!ctx.userId) {
                    for (let ref of API.cachedUsers.values()) {
                        if (ref.displayName === ctx.displayName) {
                            ctx.userId = ref.id;
                            break;
                        }
                    }
                }
                const userMap = {
                    displayName: ctx.displayName,
                    userId: ctx.userId,
                    joinTime: Date.parse(ctx.created_at),
                    lastAvatar: ''
                };
                this.store.location.lastLocation.playerList.set(
                    ctx.userId,
                    userMap
                );
                if (this.store.friend.friends.has(ctx.userId)) {
                    this.store.location.lastLocation.friendList.set(
                        ctx.userId,
                        userMap
                    );
                }
            }
            if (ctx.type === 'OnPlayerLeft') {
                this.store.location.lastLocation.playerList.delete(ctx.userId);
                this.store.location.lastLocation.friendList.delete(ctx.userId);
            }
        }
        this.store.location.lastLocation.playerList.forEach((ref1) => {
            if (
                ref1.userId &&
                typeof ref1.userId === 'string' &&
                !API.cachedUsers.has(ref1.userId)
            ) {
                userRequest.getUser({ userId: ref1.userId });
            }
        });

        this.store.location.updateCurrentUserLocation();
        this.store.instance.updateCurrentInstanceWorld();
        this.store.vr.updateVRLastLocation();
        this.store.instance.getCurrentInstanceUserList();
        this.store.user.applyUserDialogLocation();
        this.store.instance.applyWorldDialogInstances();
        this.store.instance.applyGroupDialogInstances();
    }
};

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
$app.data.photonEventTableTypeFilter = JSON.parse(
    await configRepository.getString('VRCX_photonEventTypeFilter', '[]')
);
$app.data.photonEventTable.filters[1].value =
    $app.data.photonEventTableTypeFilter;
$app.data.photonEventTablePrevious.filters[1].value =
    $app.data.photonEventTableTypeFilter;

// #endregion
// #region | App: Profile + Settings

$app.data.visits = 0;

$app.data.maxTableSize = await configRepository.getInt(
    'VRCX_maxTableSize',
    1000
);
if ($app.data.maxTableSize > 10000) {
    $app.data.maxTableSize = 1000;
}
database.setmaxTableSize($app.data.maxTableSize);
$app.data.photonLobbyTimeoutThreshold = await configRepository.getInt(
    'VRCX_photonLobbyTimeoutThreshold',
    6000
);
$app.data.clearVRCXCacheFrequency = await configRepository.getInt(
    'VRCX_clearVRCXCacheFrequency',
    172800
);

if (!(await VRCXStorage.Get('VRCX_DatabaseLocation'))) {
    await VRCXStorage.Set('VRCX_DatabaseLocation', '');
}
if (!(await VRCXStorage.Get('VRCX_ProxyServer'))) {
    await VRCXStorage.Set('VRCX_ProxyServer', '');
}
if ((await VRCXStorage.Get('VRCX_DisableGpuAcceleration')) === '') {
    await VRCXStorage.Set('VRCX_DisableGpuAcceleration', 'false');
}
if ((await VRCXStorage.Get('VRCX_DisableVrOverlayGpuAcceleration')) === '') {
    await VRCXStorage.Set('VRCX_DisableVrOverlayGpuAcceleration', 'false');
}
$app.data.proxyServer = await VRCXStorage.Get('VRCX_ProxyServer');
$app.data.locationX = await VRCXStorage.Get('VRCX_LocationX');
$app.data.locationY = await VRCXStorage.Get('VRCX_LocationY');
$app.data.sizeWidth = await VRCXStorage.Get('VRCX_SizeWidth');
$app.data.sizeHeight = await VRCXStorage.Get('VRCX_SizeHeight');
$app.data.windowState = await VRCXStorage.Get('VRCX_WindowState');

$app.methods.saveVRCXWindowOption = async function (configKey = '') {
    switch (configKey) {
        case 'VRCX_cropInstancePrints':
            this.store.advancedSettings.cropPrintsChanged();
            break;
        default:
            break;
    }

    // todo: set electron location

    if (LINUX) {
        VRCXStorage.Set('VRCX_LocationX', this.locationX);
        VRCXStorage.Set('VRCX_LocationY', this.locationY);
        VRCXStorage.Set('VRCX_SizeWidth', this.sizeWidth);
        VRCXStorage.Set('VRCX_SizeHeight', this.sizeHeight);
        VRCXStorage.Set('VRCX_WindowState', this.windowState);
        VRCXStorage.Flush();
    }
};

$app.data.photonOverlayMessageTimeout = Number(
    await configRepository.getString('VRCX_photonOverlayMessageTimeout', 6000)
);
$app.methods.saveEventOverlay = async function (configKey = '') {
    if (configKey === 'VRCX_PhotonEventOverlay') {
        this.store.photon.setPhotonEventOverlay();
    } else if (configKey === 'VRCX_TimeoutHudOverlay') {
        this.store.photon.setTimeoutHudOverlay();
    }
    this.store.vr.updateOpenVR();
    this.updateVRConfigVars();
};

$app.methods.handleSetTablePageSize = async function (pageSize) {
    this.store.feed.feedTable.pageSize = pageSize;
    this.gameLogTable.pageSize = pageSize;
    this.store.friend.friendLogTable.pageSize = pageSize;
    this.store.moderation.playerModerationTable.pageSize = pageSize;
    this.store.notification.notificationTable.pageSize = pageSize;
    this.store.appearanceSettings.setTablePageSize(pageSize);
};

// #endregion
// #region | App: User Dialog

API.$on('FRIEND:STATUS', function (args) {
    const D = $app.store.user.userDialog;
    if (D.visible === false || D.id !== args.params.userId) {
        return;
    }
    let { json } = args;
    D.isFriend = json.isFriend;
    D.incomingRequest = json.incomingRequest;
    D.outgoingRequest = json.outgoingRequest;
});

API.$on('FRIEND:REQUEST:CANCEL', function (args) {
    const D = $app.store.user.userDialog;
    if (D.visible === false || D.id !== args.params.userId) {
        return;
    }
    D.outgoingRequest = false;
});

API.$on('FRIEND:DELETE', function (args) {
    const D = $app.store.user.userDialog;
    if (D.visible === false || D.id !== args.params.userId) {
        return;
    }
    D.isFriend = false;
});

API.$on('PLAYER-MODERATION:@DELETE', function (args) {
    let { ref } = args;
    const D = $app.store.user.userDialog;
    if (
        D.visible === false ||
        ref.targetUserId !== D.id ||
        ref.sourceUserId !== this.currentUser.id
    ) {
        return;
    }
    if (ref.type === 'block') {
        D.isBlock = false;
    } else if (ref.type === 'mute') {
        D.isMute = false;
    } else if (ref.type === 'hideAvatar') {
        D.isHideAvatar = false;
    } else if (ref.type === 'interactOff') {
        D.isInteractOff = false;
    } else if (ref.type === 'muteChat') {
        D.isMuteChat = false;
    }
});

// #endregion
// #region | App: player list

$app.methods.updateTimers = function () {
    for (let $timer of $timers) {
        $timer.update();
    }
};

// #endregion
// #region | App: Copy To Clipboard

$app.methods.copyToClipboard = function (text) {
    const textArea = document.createElement('textarea');
    textArea.id = 'copy_to_clipboard';
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.getElementById('copy_to_clipboard').remove();
};

$app.methods.userOnlineFor = function (ctx) {
    if (ctx.ref.state === 'online' && ctx.ref.$online_for) {
        return timeToText(Date.now() - ctx.ref.$online_for);
    } else if (ctx.ref.state === 'active' && ctx.ref.$active_for) {
        return timeToText(Date.now() - ctx.ref.$active_for);
    } else if (ctx.ref.$offline_for) {
        return timeToText(Date.now() - ctx.ref.$offline_for);
    }
    return '-';
};

// #endregion
// #region | App: Friends List

$app.data.friendsListSearch = '';

// Set avatar/world image

$app.methods.checkPreviousImageAvailable = async function (images) {
    this.previousImagesTable = [];
    for (let image of images) {
        if (image.file && image.file.url) {
            const response = await fetch(image.file.url, {
                method: 'HEAD',
                redirect: 'follow'
            }).catch((error) => {
                console.log(error);
            });
            if (response.status === 200) {
                this.previousImagesTable.push(image);
            }
        }
    }
};

// todo: ここで置いて大丈夫かな？複雑なステータスじゃないね
$app.data.previousImagesDialogVisible = false;
$app.data.previousImagesTable = [];

API.$on('LOGIN', function () {
    $app.previousImagesTable = [];
});

// VRChat Config JSON

$app.data.isVRChatConfigDialogVisible = false;

$app.methods.showVRChatConfig = async function () {
    this.isVRChatConfigDialogVisible = true;
    if (!this.store.game.VRChatUsedCacheSize) {
        this.store.game.getVRChatCacheSize();
    }
};

// Screenshot Helper

$app.methods.processScreenshot = async function (path) {
    let newPath = path;
    if (this.store.advancedSettings.screenshotHelper) {
        const location = parseLocation(
            this.store.location.lastLocation.location
        );
        const metadata = {
            application: 'VRCX',
            version: 1,
            author: {
                id: API.currentUser.id,
                displayName: API.currentUser.displayName
            },
            world: {
                name: this.store.location.lastLocation.name,
                id: location.worldId,
                instanceId: this.store.location.lastLocation.location
            },
            players: []
        };
        for (let user of this.store.location.lastLocation.playerList.values()) {
            metadata.players.push({
                id: user.userId,
                displayName: user.displayName
            });
        }
        newPath = await AppApi.AddScreenshotMetadata(
            path,
            JSON.stringify(metadata),
            location.worldId,
            this.store.advancedSettings.screenshotHelperModifyFilename
        );
        console.log('Screenshot metadata added', newPath);
    }
    if (this.store.advancedSettings.screenshotHelperCopyToClipboard) {
        await AppApi.CopyImageToClipboard(newPath);
        console.log('Screenshot copied to clipboard', newPath);
    }
};

$app.data.currentlyDroppingFile = null;
/**
 * This function is called by .NET(CefCustomDragHandler#CefCustomDragHandler) when a file is dragged over a drop zone in the app window.
 * @param {string} filePath - The full path to the file being dragged into the window
 */
$app.methods.dragEnterCef = function (filePath) {
    this.currentlyDroppingFile = filePath;
};

// #endregion
// #region Misc

$app.data.ipcEnabled = false;
$app.methods.ipcEvent = function (json) {
    if (!API.isLoggedIn) {
        return;
    }
    let data;
    try {
        data = JSON.parse(json);
    } catch {
        console.log(`IPC invalid JSON, ${json}`);
        return;
    }
    switch (data.type) {
        case 'OnEvent':
            if (!this.store.game.isGameRunning) {
                console.log('Game closed, skipped event', data);
                return;
            }
            if (this.debugPhotonLogging) {
                console.log('OnEvent', data.OnEventData.Code, data.OnEventData);
            }
            this.parsePhotonEvent(data.OnEventData, data.dt);
            this.photonEventPulse();
            break;
        case 'OnOperationResponse':
            if (!this.store.game.isGameRunning) {
                console.log('Game closed, skipped event', data);
                return;
            }
            if (this.debugPhotonLogging) {
                console.log(
                    'OnOperationResponse',
                    data.OnOperationResponseData.OperationCode,
                    data.OnOperationResponseData
                );
            }
            this.parseOperationResponse(data.OnOperationResponseData, data.dt);
            this.photonEventPulse();
            break;
        case 'OnOperationRequest':
            if (!this.store.game.isGameRunning) {
                console.log('Game closed, skipped event', data);
                return;
            }
            if (this.debugPhotonLogging) {
                console.log(
                    'OnOperationRequest',
                    data.OnOperationRequestData.OperationCode,
                    data.OnOperationRequestData
                );
            }
            break;
        case 'VRCEvent':
            if (!this.store.game.isGameRunning) {
                console.log('Game closed, skipped event', data);
                return;
            }
            this.parseVRCEvent(data);
            this.photonEventPulse();
            break;
        case 'Event7List':
            this.photonEvent7List.clear();
            for (let [id, dt] of Object.entries(data.Event7List)) {
                this.photonEvent7List.set(parseInt(id, 10), dt);
            }
            this.photonLastEvent7List = Date.parse(data.dt);
            break;
        case 'VrcxMessage':
            if (this.debugPhotonLogging) {
                console.log('VrcxMessage:', data);
            }
            this.store.vrcx.eventVrcxMessage(data);
            break;
        case 'Ping':
            if (!this.store.photon.photonLoggingEnabled) {
                this.store.photon.setPhotonLoggingEnabled();
            }
            this.ipcEnabled = true;
            this.ipcTimeout = 60; // 30secs
            break;
        case 'MsgPing':
            this.externalNotifierVersion = data.version;
            break;
        case 'LaunchCommand':
            this.eventLaunchCommand(data.command);
            break;
        case 'VRCXLaunch':
            console.log('VRCXLaunch:', data);
            break;
        default:
            console.log('IPC:', data);
    }
};

$app.data.externalNotifierVersion = 0;
$app.data.photonEventCount = 0;
$app.data.photonEventIcon = false;

$app.methods.photonEventPulse = function () {
    this.photonEventCount++;
    this.photonEventIcon = true;
    workerTimers.setTimeout(() => (this.photonEventIcon = false), 150);
};

$app.methods.parseOperationResponse = function (data, dateTime) {
    switch (data.OperationCode) {
        case 226:
            if (
                typeof data.Parameters[248] !== 'undefined' &&
                typeof data.Parameters[248][248] !== 'undefined'
            ) {
                this.setPhotonLobbyMaster(data.Parameters[248][248]);
            }
            if (typeof data.Parameters[254] !== 'undefined') {
                this.photonLobbyCurrentUser = data.Parameters[254];
            }
            if (typeof data.Parameters[249] !== 'undefined') {
                for (let i in data.Parameters[249]) {
                    const id = parseInt(i, 10);
                    const user = data.Parameters[249][i];
                    this.parsePhotonUser(id, user.user, dateTime);
                    this.parsePhotonAvatarChange(
                        id,
                        user.user,
                        user.avatarDict,
                        dateTime
                    );
                    this.parsePhotonGroupChange(
                        id,
                        user.user,
                        user.groupOnNameplate,
                        dateTime
                    );
                    this.parsePhotonAvatar(user.avatarDict);
                    this.parsePhotonAvatar(user.favatarDict);
                    let hasInstantiated = false;
                    const lobbyJointime = this.photonLobbyJointime.get(id);
                    if (typeof lobbyJointime !== 'undefined') {
                        hasInstantiated = lobbyJointime.hasInstantiated;
                    }
                    this.photonLobbyJointime.set(id, {
                        joinTime: Date.parse(dateTime),
                        hasInstantiated,
                        inVRMode: user.inVRMode,
                        avatarEyeHeight: user.avatarEyeHeight,
                        canModerateInstance: user.canModerateInstance,
                        groupOnNameplate: user.groupOnNameplate,
                        showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                        showSocialRank: user.showSocialRank,
                        useImpostorAsFallback: user.useImpostorAsFallback,
                        platform: user.platform
                    });
                }
            }
            if (typeof data.Parameters[252] !== 'undefined') {
                this.parsePhotonLobbyIds(data.Parameters[252]);
            }
            this.photonEvent7List = new Map();
            break;
    }
};

API.$on('LOGIN', async function () {
    const command = await AppApi.GetLaunchCommand();
    if (command) {
        $app.eventLaunchCommand(command);
    }
});

$app.methods.eventLaunchCommand = function (input) {
    if (!API.isLoggedIn) {
        return;
    }
    console.log('LaunchCommand:', input);
    const args = input.split('/');
    const command = args[0];
    const commandArg = args[1]?.trim();
    let shouldFocusWindow = true;
    switch (command) {
        case 'world':
            this.store.search.directAccessWorld(input.replace('world/', ''));
            break;
        case 'avatar':
            this.store.avatar.showAvatarDialog(commandArg);
            break;
        case 'user':
            this.store.user.showUserDialog(commandArg);
            break;
        case 'group':
            this.store.group.showGroupDialog(commandArg);
            break;
        case 'local-favorite-world':
            console.log('local-favorite-world', commandArg);
            let [id, group] = commandArg.split(':');
            worldRequest.getCachedWorld({ worldId: id }).then((args1) => {
                this.store.search.directAccessWorld(id);
                this.store.favorite.addLocalWorldFavorite(id, group);
                return args1;
            });
            break;
        case 'addavatardb':
            this.store.avatarProvider.addAvatarProvider(
                input.replace('addavatardb/', '')
            );
            break;
        case 'switchavatar':
            const avatarId = commandArg;
            const regexAvatarId =
                /avtr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
            if (!avatarId.match(regexAvatarId) || avatarId.length !== 41) {
                this.$message({
                    message: 'Invalid Avatar ID',
                    type: 'error'
                });
                break;
            }
            if (this.store.advancedSettings.showConfirmationOnSwitchAvatar) {
                this.store.avatar.selectAvatarWithConfirmation(avatarId);
                // Makes sure the window is focused
                shouldFocusWindow = true;
            } else {
                this.selectAvatarWithoutConfirmation(avatarId);
                shouldFocusWindow = false;
            }
            break;
        case 'import':
            const type = args[1];
            if (!type) break;
            const data = input.replace(`import/${type}/`, '');
            if (type === 'avatar') {
                this.store.favorite.avatarImportDialogInput = data;
                this.store.favorite.showAvatarImportDialog();
            } else if (type === 'world') {
                this.store.favorite.worldImportDialogInput = data;
                this.store.favorite.showWorldImportDialog();
            } else if (type === 'friend') {
                this.store.favorite.friendImportDialogInput = data;
                this.store.favorite.showFriendImportDialog();
            }
            break;
    }
    if (shouldFocusWindow) {
        AppApi.FocusWindow();
    }
};

$app.data.enableCustomEndpoint = await configRepository.getBool(
    'VRCX_enableCustomEndpoint',
    false
);
$app.methods.toggleCustomEndpoint = async function () {
    await configRepository.setBool(
        'VRCX_enableCustomEndpoint',
        this.enableCustomEndpoint
    );
    this.store.auth.loginForm.endpoint = '';
    this.store.auth.loginForm.websocket = '';
};

// #endregion
// #region | App: note export
$app.data.folderSelectorDialogVisible = false;

$app.methods.resetUGCFolder = function () {
    this.setUGCFolderPath('');
};

$app.methods.openUGCFolder = async function () {
    if (LINUX && this.store.advancedSettings.ugcFolderPath == null) {
        this.resetUGCFolder();
    }
    await AppApi.OpenUGCPhotosFolder(this.store.advancedSettings.ugcFolderPath);
};

$app.methods.folderSelectorDialog = async function (oldPath) {
    if (this.folderSelectorDialogVisible) return;
    if (!oldPath) {
        oldPath = '';
    }

    this.folderSelectorDialogVisible = true;
    let newFolder = '';
    if (LINUX) {
        newFolder = await window.electron.openDirectoryDialog();
    } else {
        newFolder = await AppApi.OpenFolderSelectorDialog(oldPath);
    }

    this.folderSelectorDialogVisible = false;
    return newFolder;
};

$app.methods.openUGCFolderSelector = async function () {
    const path = await this.folderSelectorDialog(
        this.store.advancedSettings.ugcFolderPath
    );
    await this.setUGCFolderPath(path);
};

// #endregion
// #region | App: ChatBox Blacklist

$app.methods.checkChatboxBlacklist = function (msg) {
    for (let i = 0; i < this.chatboxBlacklist.length; ++i) {
        if (msg.includes(this.chatboxBlacklist[i])) {
            return true;
        }
    }
    return false;
};

// #endregion
// #region | App: ChatBox User Blacklist
$app.data.chatboxUserBlacklist = new Map();
if (await configRepository.getString('VRCX_chatboxUserBlacklist')) {
    $app.data.chatboxUserBlacklist = new Map(
        Object.entries(
            JSON.parse(
                await configRepository.getString('VRCX_chatboxUserBlacklist')
            )
        )
    );
}

$app.methods.saveChatboxUserBlacklist = async function () {
    await configRepository.setString(
        'VRCX_chatboxUserBlacklist',
        JSON.stringify(Object.fromEntries(this.chatboxUserBlacklist))
    );
};

// #endregion
// #region | Dialog: fullscreen image

$app.data.fullscreenImageDialog = {
    visible: false,
    imageUrl: '',
    fileName: ''
};

$app.methods.showFullscreenImageDialog = function (imageUrl, fileName) {
    if (!imageUrl) {
        return;
    }
    const D = this.fullscreenImageDialog;
    D.imageUrl = imageUrl;
    D.fileName = fileName;
    D.visible = true;
};

// #endregion
// #region | Tab Props

$app.computed.friendsListTabBind = function () {
    return {
        friendsListSearch: this.friendsListSearch
    };
};
$app.computed.friendsListTabEvent = function () {
    return {
        'update:friends-list-search': (value) =>
            (this.friendsListSearch = value)
    };
};

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
        photonEventTableTypeFilter: this.photonEventTableTypeFilter,
        photonEventTableFilter: this.photonEventTableFilter,
        ipcEnabled: this.ipcEnabled,
        photonEventIcon: this.photonEventIcon,
        photonEventTable: this.photonEventTable,
        photonEventTablePrevious: this.photonEventTablePrevious,
        chatboxUserBlacklist: this.chatboxUserBlacklist
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
        currentlyDroppingFile: this.currentlyDroppingFile,
        fullscreenImageDialog: this.fullscreenImageDialog,
        backupVrcRegistry: this.backupVrcRegistry
    };
};

$app.computed.settingsTabEvent = function () {
    return {
        saveVRCXWindowOption: this.saveVRCXWindowOption,
        promptProxySettings: this.promptProxySettings,
        promptMaxTableSizeDialog: this.promptMaxTableSizeDialog,
        promptNotificationTimeout: this.promptNotificationTimeout,
        saveDiscordOption: this.saveDiscordOption,
        showVRChatConfig: this.showVRChatConfig,
        openUGCFolder: this.openUGCFolder,
        openUGCFolderSelector: this.openUGCFolderSelector,
        resetUGCFolder: this.resetUGCFolder,
        saveEventOverlay: this.saveEventOverlay,
        promptPhotonOverlayMessageTimeout:
            this.promptPhotonOverlayMessageTimeout,
        photonEventTableFilterChange: this.photonEventTableFilterChange,
        promptPhotonLobbyTimeoutThreshold:
            this.promptPhotonLobbyTimeoutThreshold,
        disableGameLogDialog: this.disableGameLogDialog,
        promptAutoClearVRCXCacheFrequency:
            this.promptAutoClearVRCXCacheFrequency,
        handleSetTablePageSize: this.handleSetTablePageSize,
        updateSharedFeed: this.updateSharedFeed
    };
};

// #endregion
// #region | Electron

if (LINUX) {
    window.electron.onWindowPositionChanged((event, position) => {
        window.$app.locationX = position.x;
        window.$app.locationY = position.y;
        window.$app.saveVRCXWindowOption();
    });

    window.electron.onWindowSizeChanged((event, size) => {
        window.$app.sizeWidth = size.width;
        window.$app.sizeHeight = size.height;
        window.$app.saveVRCXWindowOption();
    });

    window.electron.onWindowStateChange((event, state) => {
        window.$app.windowState = state;
        window.$app.saveVRCXWindowOption();
    });

    // window.electron.onWindowClosed((event) => {
    //    window.$app.saveVRCXWindowOption();
    // });
}

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
