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
import {
    avatarRequest,
    friendRequest,
    groupRequest,
    instanceRequest,
    userRequest,
    worldRequest
} from './api';

import pugTemplate from './app.pug';

// API classes
import config from './classes/API/config.js';

// main app classes
import API from './classes/apiInit';
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
import removeConfusables, { removeWhitespace } from './service/confusables.js';
import database from './service/database.js';
import security from './service/security.js';
import webApiService from './service/webapi.js';
import {
    commaNumber,
    compareByName,
    deleteVRChatCache,
    escapeTag,
    extractFileId,
    formatSeconds,
    getAllUserMemos,
    getGroupName,
    getNameColour,
    getWorldName,
    isRealInstance,
    isRpcWorld,
    languageClass,
    localeIncludes,
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
        API,
        isGameRunning: false,
        isGameNoVR: true,
        isSteamVRRunning: false,
        isHmdAfk: false,
        isRunningUnderWine: false,
        shiftHeld: false
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
            adjustDialogZ: this.adjustDialogZ,
            showFullscreenImageDialog: this.showFullscreenImageDialog,
            displayPreviousImages: this.displayPreviousImages,
            languageClass: this.languageClass,
            showGallerySelectDialog: this.showGallerySelectDialog,
            isLinux: this.isLinux,
            openFolderGeneric: this.openFolderGeneric,
            deleteVRChatCache: this.deleteVRChatCache
        };
    },
    el: '#root',
    async created() {
        await AppApi.CheckGameRunning();
        this.isGameNoVR = await configRepository.getBool('isGameNoVR');
    },
    async mounted() {
        refreshCustomCss();
        refreshCustomScript();

        AppApi.SetUserAgent();

        API.$on('SHOW_WORLD_DIALOG_SHORTNAME', (tag) =>
            this.verifyShortName('', tag)
        );
        this.updateLoop();
        this.getGameLogTable();
        this.checkVRChatDebugLogging();
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
            this.isRunningUnderWine = await AppApi.IsRunningUnderWine();
            this.applyWineEmojis();
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
// #region | Init: drop/keyup event listeners
// Make sure file drops outside of the screenshot manager don't navigate to the file path dropped.
// This issue persists on prompts created with prompt(), unfortunately. Not sure how to fix that.
document.body.addEventListener('drop', function (e) {
    e.preventDefault();
});

document.addEventListener('keydown', function (e) {
    if (e.shiftKey) {
        $app.shiftHeld = true;
    }
});

document.addEventListener('keyup', function (e) {
    if (e.ctrlKey) {
        if (e.key === 'I') {
            $app.showConsole();
        } else if (e.key === 'r') {
            location.reload();
        }
    } else if (e.altKey && e.key === 'R') {
        refreshCustomCss();
    }

    if (!e.shiftKey) {
        $app.shiftHeld = false;
    }
});

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

// todo: use in cef
$app.methods.updateIsGameRunning = async function (
    isGameRunning,
    isSteamVRRunning,
    isHmdAfk
) {
    if (this.store.advancedSettings.gameLogDisabled) {
        return;
    }
    if (isGameRunning !== this.isGameRunning) {
        this.isGameRunning = isGameRunning;
        if (isGameRunning) {
            API.currentUser.$online_for = Date.now();
            API.currentUser.$offline_for = '';
            API.currentUser.$previousAvatarSwapTime = Date.now();
        } else {
            await configRepository.setBool('isGameNoVR', this.isGameNoVR);
            API.currentUser.$online_for = '';
            API.currentUser.$offline_for = Date.now();
            this.store.instance.removeAllQueuedInstances();
            this.autoVRChatCacheManagement();
            this.checkIfGameCrashed();
            this.ipcTimeout = 0;
            this.addAvatarWearTime(API.currentUser.currentAvatar);
            API.currentUser.$previousAvatarSwapTime = '';
        }
        this.lastLocationReset();
        this.clearNowPlaying();
        this.updateVRLastLocation();
        workerTimers.setTimeout(() => this.checkVRChatDebugLogging(), 60000);
        this.nextDiscordUpdate = 0;
        console.log(new Date(), 'isGameRunning', isGameRunning);
    }

    if (isSteamVRRunning !== this.isSteamVRRunning) {
        this.isSteamVRRunning = isSteamVRRunning;
        console.log('isSteamVRRunning:', isSteamVRRunning);
    }
    if (isHmdAfk !== this.isHmdAfk) {
        this.isHmdAfk = isHmdAfk;
        console.log('isHmdAfk:', isHmdAfk);
    }
    this.updateOpenVR();
};

$app.data.debug = false;
$app.data.debugWebSocket = false;
$app.data.debugUserDiff = false;
$app.data.debugCurrentUserDiff = false;
$app.data.debugPhotonLogging = false;
$app.data.debugGameLog = false;

$app.data.twoFactorAuthDialogVisible = false;

API.$on('LOGIN', function () {
    $app.twoFactorAuthDialogVisible = false;
});

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

$app.methods.checkPrimaryPassword = function (args) {
    return new Promise((resolve, reject) => {
        if (!this.store.advancedSettings.enablePrimaryPassword) {
            resolve(args.password);
        }
        $app.$prompt(
            $t('prompt.primary_password.description'),
            $t('prompt.primary_password.header'),
            {
                inputType: 'password',
                inputPattern: /[\s\S]{1,32}/
            }
        )
            .then(({ value }) => {
                security
                    .decrypt(args.password, value)
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
};

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
    $app.updateInGameGroupOrder();
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
// #region | App: Quick Search

$app.data.quickSearchItems = [];

$app.computed.stringComparer = function () {
    if (typeof this._stringComparer === 'undefined') {
        this._stringComparer = Intl.Collator(
            this.store.appearanceSettings.appLanguage.replace('_', '-'),
            { usage: 'search', sensitivity: 'base' }
        );
    }
    return this._stringComparer;
};

$app.methods.quickSearchRemoteMethod = function (query) {
    if (!query) {
        this.quickSearchItems = this.quickSearchUserHistory();
        return;
    }

    const results = [];
    const cleanQuery = removeWhitespace(query);

    for (const ctx of this.store.friend.friends.values()) {
        if (typeof ctx.ref === 'undefined') {
            continue;
        }

        const cleanName = removeConfusables(ctx.name);
        let match = localeIncludes(cleanName, cleanQuery, this.stringComparer);
        if (!match) {
            // Also check regular name in case search is with special characters
            match = localeIncludes(ctx.name, cleanQuery, this.stringComparer);
        }
        // Use query with whitespace for notes and memos as people are more
        // likely to include spaces in memos and notes
        if (!match && ctx.memo) {
            match = localeIncludes(ctx.memo, query, this.stringComparer);
        }
        if (!match && ctx.ref.note) {
            match = localeIncludes(ctx.ref.note, query, this.stringComparer);
        }

        if (match) {
            results.push({
                value: ctx.id,
                label: ctx.name,
                ref: ctx.ref,
                name: ctx.name
            });
        }
    }

    results.sort(function (a, b) {
        const A =
            $app.stringComparer.compare(
                a.name.substring(0, cleanQuery.length),
                cleanQuery
            ) === 0;
        const B =
            $app.stringComparer.compare(
                b.name.substring(0, cleanQuery.length),
                cleanQuery
            ) === 0;
        if (A && !B) {
            return -1;
        } else if (B && !A) {
            return 1;
        }
        return compareByName(a, b);
    });
    if (results.length > 4) {
        results.length = 4;
    }
    results.push({
        value: `search:${query}`,
        label: query
    });

    this.quickSearchItems = results;
};

$app.methods.quickSearchChange = function (value) {
    if (value) {
        if (value.startsWith('search:')) {
            const searchText = value.substr(7);
            if (this.quickSearchItems.length > 1 && searchText.length) {
                this.friendsListSearch = searchText;
                this.store.ui.menuActiveIndex = 'friendList';
            } else {
                this.store.ui.menuActiveIndex = 'search';
                this.searchText = searchText;
                $app.store.user.lookupUser({ displayName: searchText });
            }
        } else {
            this.store.user.showUserDialog(value);
        }
    }
};

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
    await $app.updateDatabaseVersion();

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
    if ($app.isGameRunning) {
        $app.loadPlayerList();
    }
    $app.vrInit();
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
        this.updateVRLastLocation();
        this.getCurrentInstanceUserList();
        this.store.user.applyUserDialogLocation();
        this.store.instance.applyWorldDialogInstances();
        this.store.instance.applyGroupDialogInstances();
    }
};

$app.data.instancePlayerCount = new Map();

// #endregion
// #region | App: gameLog

$app.methods.lastLocationReset = function (gameLogDate) {
    let dateTime = gameLogDate;
    if (!gameLogDate) {
        dateTime = new Date().toJSON();
    }
    const dateTimeStamp = Date.parse(dateTime);
    this.photonLobby = new Map();
    this.photonLobbyCurrent = new Map();
    this.photonLobbyMaster = 0;
    this.photonLobbyCurrentUser = 0;
    this.photonLobbyUserData = new Map();
    this.photonLobbyWatcherLoopStop();
    this.photonLobbyAvatars = new Map();
    this.photonLobbyLastModeration = new Map();
    this.photonLobbyJointime = new Map();
    this.photonLobbyActivePortals = new Map();
    this.photonEvent7List = new Map();
    this.photonLastEvent7List = '';
    this.photonLastChatBoxMsg = new Map();
    this.moderationEventQueue = new Map();
    if (this.photonEventTable.data.length > 0) {
        this.photonEventTablePrevious.data = this.photonEventTable.data;
        this.photonEventTable.data = [];
    }
    const playerList = Array.from(
        this.store.location.lastLocation.playerList.values()
    );
    const dataBaseEntries = [];
    for (let ref of playerList) {
        const entry = {
            created_at: dateTime,
            type: 'OnPlayerLeft',
            displayName: ref.displayName,
            location: this.store.location.lastLocation.location,
            userId: ref.userId,
            time: dateTimeStamp - ref.joinTime
        };
        dataBaseEntries.unshift(entry);
        this.addGameLog(entry);
    }
    database.addGamelogJoinLeaveBulk(dataBaseEntries);
    if (this.store.location.lastLocation.date !== 0) {
        const update = {
            time: dateTimeStamp - this.store.location.lastLocation.date,
            created_at: new Date(this.store.location.lastLocation.date).toJSON()
        };
        database.updateGamelogLocationTimeToDatabase(update);
    }
    this.lastLocationDestination = '';
    this.lastLocationDestinationTime = 0;
    this.store.location.lastLocation = {
        date: 0,
        location: '',
        name: '',
        playerList: new Map(),
        friendList: new Map()
    };
    this.store.location.updateCurrentUserLocation();
    this.store.instance.updateCurrentInstanceWorld();
    this.updateVRLastLocation();
    this.getCurrentInstanceUserList();
    this.lastVideoUrl = '';
    this.lastResourceloadUrl = '';
    this.store.user.applyUserDialogLocation();
    this.store.instance.applyWorldDialogInstances();
    this.store.instance.applyGroupDialogInstances();
};

$app.data.lastLocation$ = {
    tag: '',
    instanceId: '',
    accessType: '',
    worldName: '',
    worldCapacity: 0,
    joinUrl: '',
    statusName: '',
    statusImage: ''
};

$app.data.lastLocationDestination = '';
$app.data.lastLocationDestinationTime = 0;

$app.data.nowPlaying = {
    url: '',
    name: '',
    length: 0,
    startTime: 0,
    offset: 0,
    elapsed: 0,
    percentage: 0,
    remainingText: '',
    playing: false
};

$app.methods.clearNowPlaying = function () {
    this.nowPlaying = {
        url: '',
        name: '',
        length: 0,
        startTime: 0,
        offset: 0,
        elapsed: 0,
        percentage: 0,
        remainingText: '',
        playing: false
    };
    this.updateVrNowPlaying();
};

$app.methods.setNowPlaying = function (ctx) {
    if (this.nowPlaying.url !== ctx.videoUrl) {
        if (!ctx.userId && ctx.displayName) {
            for (let ref of API.cachedUsers.values()) {
                if (ref.displayName === ctx.displayName) {
                    ctx.userId = ref.id;
                    break;
                }
            }
        }
        this.store.notification.queueGameLogNoty(ctx);
        this.addGameLog(ctx);
        database.addGamelogVideoPlayToDatabase(ctx);

        let displayName = '';
        if (ctx.displayName) {
            displayName = ` (${ctx.displayName})`;
        }
        const name = `${ctx.videoName}${displayName}`;
        this.nowPlaying = {
            url: ctx.videoUrl,
            name,
            length: ctx.videoLength,
            startTime: Date.parse(ctx.created_at) / 1000,
            offset: ctx.videoPos,
            elapsed: 0,
            percentage: 0,
            remainingText: ''
        };
    } else {
        this.nowPlaying = {
            ...this.nowPlaying,
            length: ctx.videoLength,
            startTime: Date.parse(ctx.created_at) / 1000,
            offset: ctx.videoPos,
            elapsed: 0,
            percentage: 0,
            remainingText: ''
        };
    }
    this.updateVrNowPlaying();
    if (!this.nowPlaying.playing && ctx.videoLength > 0) {
        this.nowPlaying.playing = true;
        this.updateNowPlaying();
    }
};

$app.methods.updateNowPlaying = function () {
    const np = this.nowPlaying;
    if (!this.nowPlaying.playing) {
        return;
    }
    const now = Date.now() / 1000;
    np.elapsed = Math.round((now - np.startTime + np.offset) * 10) / 10;
    if (np.elapsed >= np.length) {
        this.clearNowPlaying();
        return;
    }
    np.remainingText = formatSeconds(np.length - np.elapsed);
    np.percentage = Math.round(((np.elapsed * 100) / np.length) * 10) / 10;
    this.updateVrNowPlaying();
    workerTimers.setTimeout(() => this.updateNowPlaying(), 1000);
};

$app.methods.updateVrNowPlaying = function () {
    const json = JSON.stringify(this.nowPlaying);
    AppApi.ExecuteVrFeedFunction('nowPlayingUpdate', json);
    AppApi.ExecuteVrOverlayFunction('nowPlayingUpdate', json);
};

$app.methods.updateAutoStateChange = function () {
    if (
        !this.store.generalSettings.autoStateChangeEnabled ||
        !this.isGameRunning ||
        !this.store.location.lastLocation.playerList.size ||
        this.store.location.lastLocation.location === '' ||
        this.store.location.lastLocation.location === 'traveling'
    ) {
        return;
    }

    const $location = parseLocation(this.store.location.lastLocation.location);
    let instanceType = $location.accessType;
    if (instanceType === 'group') {
        if ($location.groupAccessType === 'members') {
            instanceType = 'groupOnly';
        } else if ($location.groupAccessType === 'plus') {
            instanceType = 'groupPlus';
        } else {
            instanceType = 'groupPublic';
        }
    }
    if (
        this.store.generalSettings.autoStateChangeInstanceTypes.length > 0 &&
        !this.store.generalSettings.autoStateChangeInstanceTypes.includes(
            instanceType
        )
    ) {
        return;
    }

    let withCompany = this.store.location.lastLocation.playerList.size > 1;
    if (this.store.generalSettings.autoStateChangeNoFriends) {
        withCompany = this.store.location.lastLocation.friendList.size >= 1;
    }

    const currentStatus = API.currentUser.status;
    const newStatus = withCompany
        ? this.store.generalSettings.autoStateChangeCompanyStatus
        : this.store.generalSettings.autoStateChangeAloneStatus;

    if (currentStatus === newStatus) {
        return;
    }

    userRequest
        .saveCurrentUser({
            status: newStatus
        })
        .then(() => {
            const text = `Status automaticly changed to ${newStatus}`;
            if (this.errorNoty) {
                this.errorNoty.close();
            }
            this.errorNoty = new Noty({
                type: 'info',
                text
            });
            this.errorNoty.show();
            console.log(text);
        });
};

// #endregion
// #region | App: Search

$app.data.searchText = '';
$app.data.searchUserResults = [];

API.$on('LOGIN', function () {
    $app.searchText = '';
    $app.searchUserResults = [];
});

$app.methods.clearSearch = function () {
    this.searchText = '';
    this.searchUserResults = [];
};

$app.methods.searchUserByDisplayName = async function (displayName) {
    const params = {
        n: 10,
        offset: 0,
        fuzzy: false,
        search: displayName
    };
    await this.moreSearchUser(null, params);
};

$app.methods.moreSearchUser = async function (go, params) {
    // var params = this.searchUserParams;
    if (go) {
        params.offset += params.n * go;
        if (params.offset < 0) {
            params.offset = 0;
        }
    }
    await userRequest.getUsers(params).then((args) => {
        // API.$on('USER:LIST')
        for (const json of args.json) {
            if (!json.displayName) {
                console.error('getUsers gave us garbage', json);
                continue;
            }
            API.$emit('USER', {
                json,
                params: {
                    userId: json.id
                }
            });
        }

        const map = new Map();
        for (const json of args.json) {
            const ref = API.cachedUsers.get(json.id);
            if (typeof ref !== 'undefined') {
                map.set(ref.id, ref);
            }
        }
        this.searchUserResults = Array.from(map.values());
        return args;
    });
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

$app.data.pastDisplayNameTable = {
    data: [],
    tableProps: {
        stripe: true,
        size: 'mini',
        defaultSort: {
            prop: 'updated_at',
            order: 'descending'
        }
    },
    layout: 'table'
};
$app.data.currentInstanceUserList = {
    data: [],
    tableProps: {
        stripe: true,
        size: 'mini',
        defaultSort: {
            prop: 'timer',
            order: 'descending'
        }
    },
    layout: 'table'
};
$app.data.visits = 0;
$app.data.notificationTimeout = await configRepository.getString(
    'VRCX_notificationTimeout',
    '3000'
);
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

$app.methods.saveOpenVROption = async function () {
    this.updateSharedFeed(true);
    this.updateVRConfigVars();
    this.updateVRLastLocation();
    AppApi.ExecuteVrOverlayFunction('notyClear', '');
    this.updateOpenVR();
};

$app.methods.saveSortFavoritesOption = async function () {
    this.store.favorite.getLocalWorldFavorites();
    this.setSortFavorites();
};

$app.methods.applyWineEmojis = async function () {
    if (document.contains(document.getElementById('app-emoji-font'))) {
        document.getElementById('app-emoji-font').remove();
    }
    if (this.isRunningUnderWine) {
        const $appEmojiFont = document.createElement('link');
        $appEmojiFont.setAttribute('id', 'app-emoji-font');
        $appEmojiFont.rel = 'stylesheet';
        $appEmojiFont.href = 'emoji.font.css';
        document.head.appendChild($appEmojiFont);
    }
};

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
    this.updateOpenVR();
    this.updateVRConfigVars();
};

$app.methods.saveSidebarSortOrder = async function () {
    this.store.friend.sortVIPFriends = true;
    this.store.friend.sortOnlineFriends = true;
    this.store.friend.sortActiveFriends = true;
    this.store.friend.sortOfflineFriends = true;
};

$app.data.notificationPosition = await configRepository.getString(
    'VRCX_notificationPosition',
    'topCenter'
);
$app.methods.changeNotificationPosition = async function (value) {
    this.notificationPosition = value;
    await configRepository.setString(
        'VRCX_notificationPosition',
        this.notificationPosition
    );
    this.updateVRConfigVars();
};

$app.methods.updateVRConfigVars = function () {
    let notificationTheme = 'relax';
    if (this.store.appearanceSettings.isDarkMode) {
        notificationTheme = 'sunset';
    }
    const VRConfigVars = {
        overlayNotifications:
            this.store.notificationsSettings.overlayNotifications,
        hideDevicesFromFeed:
            this.store.wristOverlaySettings.hideDevicesFromFeed,
        vrOverlayCpuUsage: this.store.wristOverlaySettings.vrOverlayCpuUsage,
        minimalFeed: this.store.wristOverlaySettings.minimalFeed,
        notificationPosition: this.notificationPosition,
        notificationTimeout: this.notificationTimeout,
        photonOverlayMessageTimeout: this.photonOverlayMessageTimeout,
        notificationTheme,
        backgroundEnabled: this.store.wristOverlaySettings.vrBackgroundEnabled,
        dtHour12: this.store.appearanceSettings.dtHour12,
        pcUptimeOnFeed: this.store.wristOverlaySettings.pcUptimeOnFeed,
        appLanguage: this.store.appearanceSettings.appLanguage,
        notificationOpacity: this.store.advancedSettings.notificationOpacity
    };
    const json = JSON.stringify(VRConfigVars);
    AppApi.ExecuteVrFeedFunction('configUpdate', json);
    AppApi.ExecuteVrOverlayFunction('configUpdate', json);
};

$app.methods.updateVRLastLocation = function () {
    let progressPie = false;
    if (this.progressPie) {
        progressPie = true;
        if (this.store.advancedSettings.progressPieFilter) {
            if (!isRpcWorld(this.store.location.lastLocation.location)) {
                progressPie = false;
            }
        }
    }
    let onlineFor = '';
    if (!this.store.wristOverlaySettings.hideUptimeFromFeed) {
        onlineFor = API.currentUser.$online_for;
    }
    const lastLocation = {
        date: this.store.location.lastLocation.date,
        location: this.store.location.lastLocation.location,
        name: this.store.location.lastLocation.name,
        playerList: Array.from(
            this.store.location.lastLocation.playerList.values()
        ),
        friendList: Array.from(
            this.store.location.lastLocation.friendList.values()
        ),
        progressPie,
        onlineFor
    };
    const json = JSON.stringify(lastLocation);
    AppApi.ExecuteVrFeedFunction('lastLocationUpdate', json);
    AppApi.ExecuteVrOverlayFunction('lastLocationUpdate', json);
};

$app.methods.vrInit = function () {
    this.updateVRConfigVars();
    this.updateVRLastLocation();
    this.updateVrNowPlaying();
    this.updateSharedFeed(true);
    this.store.friend.onlineFriendCount = 0;
    this.store.friend.updateOnlineFriendCoutner();
};

API.$on('USER:CURRENT', function (args) {
    if (args.ref.pastDisplayNames) {
        $app.pastDisplayNameTable.data = args.ref.pastDisplayNames;
    }
});

$app.methods.updateOpenVR = function () {
    if (
        this.store.notificationsSettings.openVR &&
        this.isSteamVRRunning &&
        ((this.isGameRunning && !this.isGameNoVR) ||
            this.store.wristOverlaySettings.openVRAlways)
    ) {
        let hmdOverlay = false;
        if (
            this.store.notificationsSettings.overlayNotifications ||
            this.store.advancedSettings.progressPie ||
            this.store.photon.photonEventOverlay ||
            this.store.photon.timeoutHudOverlay
        ) {
            hmdOverlay = true;
        }
        // active, hmdOverlay, wristOverlay, menuButton, overlayHand
        AppApi.SetVR(
            true,
            hmdOverlay,
            this.store.wristOverlaySettings.overlayWrist,
            this.store.wristOverlaySettings.overlaybutton,
            this.store.wristOverlaySettings.overlayHand
        );
    } else {
        AppApi.SetVR(false, false, false, false, 0);
    }
};

$app.methods.directAccessPaste = function () {
    AppApi.GetClipboard().then((clipboard) => {
        if (!this.directAccessParse(clipboard.trim())) {
            this.promptOmniDirectDialog();
        }
    });
};

$app.methods.directAccessWorld = function (textBoxInput) {
    let worldId;
    let shortName;
    let input = textBoxInput;
    if (input.startsWith('/home/')) {
        input = `https://vrchat.com${input}`;
    }
    if (input.length === 8) {
        return this.verifyShortName('', input);
    } else if (input.startsWith('https://vrch.at/')) {
        shortName = input.substring(16, 24);
        return this.verifyShortName('', shortName);
    } else if (
        input.startsWith('https://vrchat.') ||
        input.startsWith('/home/')
    ) {
        const url = new URL(input);
        const urlPath = url.pathname;
        const urlPathSplit = urlPath.split('/');
        if (urlPathSplit.length >= 4 && urlPathSplit[2] === 'world') {
            worldId = urlPathSplit[3];
            this.store.world.showWorldDialog(worldId);
            return true;
        } else if (urlPath.substring(5, 12) === '/launch') {
            const urlParams = new URLSearchParams(url.search);
            worldId = urlParams.get('worldId');
            const instanceId = urlParams.get('instanceId');
            if (instanceId) {
                shortName = urlParams.get('shortName');
                const location = `${worldId}:${instanceId}`;
                if (shortName) {
                    return this.verifyShortName(location, shortName);
                }
                this.store.world.showWorldDialog(location);
                return true;
            } else if (worldId) {
                this.store.world.showWorldDialog(worldId);
                return true;
            }
        }
    } else if (input.substring(0, 5) === 'wrld_') {
        // a bit hacky, but supports weird malformed inputs cut out from url, why not
        if (input.indexOf('&instanceId=') >= 0) {
            input = `https://vrchat.com/home/launch?worldId=${input}`;
            return this.directAccessWorld(input);
        }
        this.store.world.showWorldDialog(input.trim());
        return true;
    }
    return false;
};

$app.methods.verifyShortName = function (location, shortName) {
    return instanceRequest
        .getInstanceFromShortName({ shortName })
        .then((args) => {
            const newLocation = args.json.location;
            const newShortName = args.json.shortName;
            if (newShortName) {
                this.store.world.showWorldDialog(newLocation, newShortName);
            } else if (newLocation) {
                this.store.world.showWorldDialog(newLocation);
            } else {
                this.store.world.showWorldDialog(location);
            }
            return args;
        });
};

$app.methods.showGroupDialogShortCode = function (shortCode) {
    groupRequest.groupStrictsearch({ query: shortCode }).then((args) => {
        for (const group of args.json) {
            if (`${group.shortCode}.${group.discriminator}` === shortCode) {
                this.store.group.showGroupDialog(group.id);
                break;
            }
        }
        return args;
    });
};

$app.methods.directAccessParse = function (input) {
    if (!input) {
        return false;
    }
    if (this.directAccessWorld(input)) {
        return true;
    }
    if (input.startsWith('https://vrchat.')) {
        const url = new URL(input);
        const urlPath = url.pathname;
        const urlPathSplit = urlPath.split('/');
        if (urlPathSplit.length < 4) {
            return false;
        }
        const type = urlPathSplit[2];
        if (type === 'user') {
            const userId = urlPathSplit[3];
            this.store.user.showUserDialog(userId);
            return true;
        } else if (type === 'avatar') {
            const avatarId = urlPathSplit[3];
            this.store.avatar.showAvatarDialog(avatarId);
            return true;
        } else if (type === 'group') {
            const groupId = urlPathSplit[3];
            this.store.group.showGroupDialog(groupId);
            return true;
        }
    } else if (input.startsWith('https://vrc.group/')) {
        const shortCode = input.substring(18);
        this.showGroupDialogShortCode(shortCode);
        return true;
    } else if (/^[A-Za-z0-9]{3,6}\.[0-9]{4}$/g.test(input)) {
        this.showGroupDialogShortCode(input);
        return true;
    } else if (
        input.substring(0, 4) === 'usr_' ||
        /^[A-Za-z0-9]{10}$/g.test(input)
    ) {
        this.store.user.showUserDialog(input);
        return true;
    } else if (input.substring(0, 5) === 'avtr_') {
        this.store.avatar.showAvatarDialog(input);
        return true;
    } else if (input.substring(0, 4) === 'grp_') {
        this.store.group.showGroupDialog(input);
        return true;
    }
    return false;
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
// #region | App: Dialog

$app.methods.adjustDialogZ = function (el) {
    let z = 0;
    document.querySelectorAll('.v-modal,.el-dialog__wrapper').forEach((v) => {
        const _z = Number(v.style.zIndex) || 0;
        if (_z && _z > z && v !== el) {
            z = _z;
        }
    });
    if (z) {
        el.style.zIndex = z + 1;
    }
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

API.$on('LOGIN', function () {
    $app.currentInstanceUserList.data = [];
});

$app.data.updatePlayerListTimer = null;
$app.data.updatePlayerListPending = false;
$app.methods.getCurrentInstanceUserList = function () {
    if (!this.store.friend.friendLogInitStatus) {
        return;
    }
    if (this.updatePlayerListTimer) {
        this.updatePlayerListPending = true;
    } else {
        this.updatePlayerListExecute();
        this.updatePlayerListTimer = setTimeout(() => {
            if (this.updatePlayerListPending) {
                this.updatePlayerListExecute();
            }
            this.updatePlayerListTimer = null;
        }, 150);
    }
};

$app.methods.updatePlayerListExecute = function () {
    try {
        this.updatePlayerListDebounce();
    } catch (err) {
        console.error(err);
    }
    this.updatePlayerListTimer = null;
    this.updatePlayerListPending = false;
};

$app.methods.updatePlayerListDebounce = function () {
    const users = [];
    const pushUser = function (ref) {
        let photonId = '';
        let isFriend = false;
        $app.photonLobbyCurrent.forEach((ref1, id) => {
            if (typeof ref1 !== 'undefined') {
                if (
                    (typeof ref.id !== 'undefined' &&
                        typeof ref1.id !== 'undefined' &&
                        ref1.id === ref.id) ||
                    (typeof ref.displayName !== 'undefined' &&
                        typeof ref1.displayName !== 'undefined' &&
                        ref1.displayName === ref.displayName)
                ) {
                    photonId = id;
                }
            }
        });
        let isMaster = false;
        if (
            $app.photonLobbyMaster !== 0 &&
            photonId === $app.photonLobbyMaster
        ) {
            isMaster = true;
        }
        let isModerator = false;
        const lobbyJointime = $app.photonLobbyJointime.get(photonId);
        let inVRMode = null;
        let groupOnNameplate = '';
        if (typeof lobbyJointime !== 'undefined') {
            inVRMode = lobbyJointime.inVRMode;
            groupOnNameplate = lobbyJointime.groupOnNameplate;
            isModerator = lobbyJointime.canModerateInstance;
        }
        // if (groupOnNameplate) {
        //     API.getCachedGroup({
        //         groupId: groupOnNameplate
        //     }).then((args) => {
        //         groupOnNameplate = args.ref.name;
        //     });
        // }
        let timeoutTime = 0;
        if (typeof ref.id !== 'undefined') {
            isFriend = ref.isFriend;
            if (
                $app.timeoutHudOverlayFilter === 'VIP' ||
                $app.timeoutHudOverlayFilter === 'Friends'
            ) {
                $app.photonLobbyTimeout.forEach((ref1) => {
                    if (ref1.userId === ref.id) {
                        timeoutTime = ref1.time;
                    }
                });
            } else {
                $app.photonLobbyTimeout.forEach((ref1) => {
                    if (ref1.displayName === ref.displayName) {
                        timeoutTime = ref1.time;
                    }
                });
            }
        }
        users.push({
            ref,
            displayName: ref.displayName,
            timer: ref.$location_at,
            $trustSortNum: ref.$trustSortNum ?? 0,
            photonId,
            isMaster,
            isModerator,
            inVRMode,
            groupOnNameplate,
            isFriend,
            timeoutTime
        });
        // get block, mute
    };

    const playersInInstance = this.store.location.lastLocation.playerList;
    if (playersInInstance.size > 0) {
        let ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref !== 'undefined' && playersInInstance.has(ref.id)) {
            pushUser(ref);
        }
        for (const player of playersInInstance.values()) {
            // if friend isn't in instance add them
            if (player.displayName === API.currentUser.displayName) {
                continue;
            }
            const addUser = !users.some(function (user) {
                return player.displayName === user.displayName;
            });
            if (addUser) {
                ref = API.cachedUsers.get(player.userId);
                if (typeof ref !== 'undefined') {
                    pushUser(ref);
                } else {
                    let { joinTime } =
                        this.store.location.lastLocation.playerList.get(
                            player.userId
                        );
                    if (!joinTime) {
                        joinTime = Date.now();
                    }
                    ref = {
                        // if userId is missing just push displayName
                        displayName: player.displayName,
                        $location_at: joinTime,
                        $online_for: joinTime
                    };
                    pushUser(ref);
                }
            }
        }
    }
    this.currentInstanceUserList.data = users;
    this.updateTimers();
};

$app.data.updateInstanceInfo = 0;

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
    if (!this.VRChatUsedCacheSize) {
        this.getVRChatCacheSize();
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

// YouTube API

$app.data.isYouTubeApiDialogVisible = false;

$app.methods.changeYouTubeApi = async function (configKey = '') {
    if (configKey === 'VRCX_youtubeAPI') {
        this.store.advancedSettings.setYouTubeApi();
    } else if (configKey === 'VRCX_progressPie') {
        this.store.advancedSettings.setProgressPie();
    } else if (configKey === 'VRCX_progressPieFilter') {
        this.store.advancedSettings.setProgressPieFilter();
    }

    this.updateVRLastLocation();
    this.updateOpenVR();
};

// Asset Bundle Cacher

$app.methods.getDisplayName = function (userId) {
    if (userId) {
        const ref = API.cachedUsers.get(userId);
        if (ref.displayName) {
            return ref.displayName;
        }
    }
    return '';
};

$app.methods.deleteVRChatCache = async function (ref) {
    await deleteVRChatCache(ref);
    this.getVRChatCacheSize();
    this.updateVRChatWorldCache();
    this.store.avatar.updateVRChatAvatarCache();
};

$app.methods.autoVRChatCacheManagement = function () {
    if (this.store.advancedSettings.autoSweepVRChatCache) {
        this.sweepVRChatCache();
    }
};

$app.methods.sweepVRChatCache = async function () {
    const output = await AssetBundleManager.SweepCache();
    console.log('SweepCache', output);
    if (this.isVRChatConfigDialogVisible) {
        this.getVRChatCacheSize();
    }
};

$app.data.lastCrashedTime = null;
$app.methods.checkIfGameCrashed = function () {
    if (!this.store.advancedSettings.relaunchVRChatAfterCrash) {
        return;
    }
    let { location } = this.store.location.lastLocation;
    AppApi.VrcClosedGracefully().then((result) => {
        if (result || !isRealInstance(location)) {
            return;
        }
        // check if relaunched less than 2mins ago (prvent crash loop)
        if (
            this.lastCrashedTime &&
            new Date() - this.lastCrashedTime < 120_000
        ) {
            console.log('VRChat was recently crashed, not relaunching');
            return;
        }
        this.lastCrashedTime = new Date();
        // wait a bit for SteamVR to potentially close before deciding to relaunch
        let restartDelay = 8000;
        if (this.isGameNoVR) {
            // wait for game to close before relaunching
            restartDelay = 2000;
        }
        workerTimers.setTimeout(
            () => this.restartCrashedGame(location),
            restartDelay
        );
    });
};

$app.methods.restartCrashedGame = function (location) {
    if (!this.isGameNoVR && !this.isSteamVRRunning) {
        console.log("SteamVR isn't running, not relaunching VRChat");
        return;
    }
    AppApi.FocusWindow();
    const message = 'VRChat crashed, attempting to rejoin last instance';
    this.$message({
        message,
        type: 'info'
    });
    const entry = {
        created_at: new Date().toJSON(),
        type: 'Event',
        data: message
    };
    database.addGamelogEventToDatabase(entry);
    this.store.notification.queueGameLogNoty(entry);
    this.addGameLog(entry);
    this.store.launch.launchGame(location, '', this.isGameNoVR);
};

$app.data.VRChatUsedCacheSize = '';
$app.data.VRChatTotalCacheSize = '';
$app.data.VRChatCacheSizeLoading = false;

$app.methods.getVRChatCacheSize = async function () {
    this.VRChatCacheSizeLoading = true;
    const totalCacheSize = 30;
    this.VRChatTotalCacheSize = totalCacheSize;
    const usedCacheSize = await AssetBundleManager.GetCacheSize();
    this.VRChatUsedCacheSize = (usedCacheSize / 1073741824).toFixed(2);
    this.VRChatCacheSizeLoading = false;
};

// userDialog Groups

$app.data.inGameGroupOrder = [];

$app.methods.getVRChatRegistryKey = async function (key) {
    if (LINUX) {
        return AppApi.GetVRChatRegistryKeyString(key);
    }
    return AppApi.GetVRChatRegistryKey(key);
};

$app.methods.updateInGameGroupOrder = async function () {
    this.inGameGroupOrder = [];
    try {
        const json = await this.getVRChatRegistryKey(
            `VRC_GROUP_ORDER_${API.currentUser.id}`
        );
        if (!json) {
            return;
        }
        this.inGameGroupOrder = JSON.parse(json);
    } catch (err) {
        console.error(err);
    }
};

$app.methods.sortGroupInstancesByInGame = function (a, b) {
    const aIndex = this.inGameGroupOrder.indexOf(a?.group?.id);
    const bIndex = this.inGameGroupOrder.indexOf(b?.group?.id);
    if (aIndex === -1 && bIndex === -1) {
        return 0;
    }
    if (aIndex === -1) {
        return 1;
    }
    if (bIndex === -1) {
        return -1;
    }
    return aIndex - bIndex;
};

// #endregion
// #region Misc

$app.methods.showConsole = function () {
    AppApi.ShowDevTools();
    if (
        this.debug ||
        this.store.debug.debugWebRequests ||
        this.debugWebSocket ||
        this.debugUserDiff
    ) {
        return;
    }
    console.log(
        '%cCareful! This might not do what you think.',
        'background-color: red; color: yellow; font-size: 32px; font-weight: bold'
    );
    console.log(
        '%cIf someone told you to copy-paste something here, it can give them access to your account.',
        'font-size: 20px;'
    );
};

$app.methods.clearVRCXCache = function () {
    API.failedGetRequests = new Map();
    API.cachedUsers.forEach((ref, id) => {
        if (
            !this.store.friend.friends.has(id) &&
            !this.store.location.lastLocation.playerList.has(ref.id) &&
            id !== API.currentUser.id
        ) {
            API.cachedUsers.delete(id);
        }
    });
    this.store.world.cachedWorlds.forEach((ref, id) => {
        if (
            !$app.store.favorite.cachedFavoritesByObjectId.has(id) &&
            ref.authorId !== API.currentUser.id &&
            !$app.store.favorite.localWorldFavoritesList.includes(id)
        ) {
            this.store.world.cachedWorlds.delete(id);
        }
    });
    this.store.avatar.cachedAvatars.forEach((ref, id) => {
        if (
            !$app.store.favorite.cachedFavoritesByObjectId.has(id) &&
            ref.authorId !== API.currentUser.id &&
            !this.store.favorite.localAvatarFavoritesList.includes(id) &&
            !$app.store.avatar.avatarHistory.has(id)
        ) {
            this.store.avatar.cachedAvatars.delete(id);
        }
    });
    $app.store.group.cachedGroups.forEach((ref, id) => {
        if (!$app.store.group.currentUserGroups.has(id)) {
            $app.store.group.cachedGroups.delete(id);
        }
    });
    $app.store.instance.cachedInstances.forEach((ref, id) => {
        // delete instances over an hour old
        if (Date.parse(ref.$fetchedAt) < Date.now() - 3600000) {
            $app.store.instance.cachedInstances.delete(id);
        }
    });
    this.store.avatar.cachedAvatarNames = new Map();
    this.customUserTags = new Map();
    this.updateInstanceInfo = 0;
};

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
            if (!this.isGameRunning) {
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
            if (!this.isGameRunning) {
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
            if (!this.isGameRunning) {
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
            if (!this.isGameRunning) {
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
            this.eventVrcxMessage(data);
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
$app.data.customUserTags = new Map();

$app.methods.addCustomTag = function (data) {
    if (data.Tag) {
        this.customUserTags.set(data.UserId, {
            tag: data.Tag,
            colour: data.TagColour
        });
    } else {
        this.customUserTags.delete(data.UserId);
    }
    const feedUpdate = {
        userId: data.UserId,
        colour: data.TagColour
    };
    AppApi.ExecuteVrOverlayFunction(
        'updateHudFeedTag',
        JSON.stringify(feedUpdate)
    );
    const ref = API.cachedUsers.get(data.UserId);
    if (typeof ref !== 'undefined') {
        ref.$customTag = data.Tag;
        ref.$customTagColour = data.TagColour;
    }
    this.updateSharedFeed(true);
};

$app.methods.eventVrcxMessage = function (data) {
    let entry;
    switch (data.MsgType) {
        case 'CustomTag':
            this.addCustomTag(data);
            break;
        case 'ClearCustomTags':
            this.customUserTags.forEach((value, key) => {
                this.customUserTags.delete(key);
                const ref = API.cachedUsers.get(key);
                if (typeof ref !== 'undefined') {
                    ref.$customTag = '';
                    ref.$customTagColour = '';
                }
            });
            break;
        case 'Noty':
            if (
                this.store.photon.photonLoggingEnabled ||
                (this.externalNotifierVersion &&
                    this.externalNotifierVersion > 21)
            ) {
                return;
            }
            entry = {
                created_at: new Date().toJSON(),
                type: 'Event',
                data: data.Data
            };
            database.addGamelogEventToDatabase(entry);
            this.store.notification.queueGameLogNoty(entry);
            this.addGameLog(entry);
            break;
        case 'External': {
            const displayName = data.DisplayName ?? '';
            entry = {
                created_at: new Date().toJSON(),
                type: 'External',
                message: data.Data,
                displayName,
                userId: data.UserId,
                location: this.lastLocation.location
            };
            database.addGamelogExternalToDatabase(entry);
            this.store.notification.queueGameLogNoty(entry);
            this.addGameLog(entry);
            break;
        }
        default:
            console.log('VRCXMessage:', data);
            break;
    }
};

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
            this.directAccessWorld(input.replace('world/', ''));
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
                this.directAccessWorld(id);
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

$app.methods.addAvatarWearTime = function (avatarId) {
    if (!API.currentUser.$previousAvatarSwapTime || !avatarId) {
        return;
    }
    const timeSpent = Date.now() - API.currentUser.$previousAvatarSwapTime;
    database.addAvatarTimeSpent(avatarId, timeSpent);
};

$app.data.databaseVersion = await configRepository.getInt(
    'VRCX_databaseVersion',
    0
);

$app.methods.updateDatabaseVersion = async function () {
    const databaseVersion = 12;
    let msgBox;
    if (this.databaseVersion < databaseVersion) {
        if (this.databaseVersion) {
            msgBox = this.$message({
                message: 'DO NOT CLOSE VRCX, database upgrade in progress...',
                type: 'warning',
                duration: 0
            });
        }
        console.log(
            `Updating database from ${this.databaseVersion} to ${databaseVersion}...`
        );
        try {
            await database.cleanLegendFromFriendLog(); // fix friendLog spammed with crap
            await database.fixGameLogTraveling(); // fix bug with gameLog location being set as traveling
            await database.fixNegativeGPS(); // fix GPS being a negative value due to VRCX bug with traveling
            await database.fixBrokenLeaveEntries(); // fix user instance timer being higher than current user location timer
            await database.fixBrokenGroupInvites(); // fix notification v2 in wrong table
            await database.fixBrokenNotifications(); // fix notifications being null
            await database.fixBrokenGroupChange(); // fix spam group left & name change
            await database.fixCancelFriendRequestTypo(); // fix CancelFriendRequst typo
            await database.fixBrokenGameLogDisplayNames(); // fix gameLog display names "DisplayName (userId)"
            await database.upgradeDatabaseVersion(); // update database version
            await database.vacuum(); // succ
            await database.optimize();
            await configRepository.setInt(
                'VRCX_databaseVersion',
                databaseVersion
            );
            console.log('Database update complete.');
            msgBox?.close();
            if (this.databaseVersion) {
                // only display when database exists
                this.$message({
                    message: 'Database upgrade complete',
                    type: 'success'
                });
            }
            this.databaseVersion = databaseVersion;
        } catch (err) {
            console.error(err);
            msgBox?.close();
            this.$message({
                message: 'Database upgrade failed, check console for details',
                type: 'error',
                duration: 120000
            });
            AppApi.ShowDevTools();
        }
    }
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
// #region | App: Instance queuing

$app.methods.checkVRChatDebugLogging = async function () {
    if (this.store.advancedSettings.gameLogDisabled) {
        return;
    }
    try {
        const loggingEnabled =
            await this.getVRChatRegistryKey('LOGGING_ENABLED');
        if (loggingEnabled === null || typeof loggingEnabled === 'undefined') {
            // key not found
            return;
        }
        if (parseInt(loggingEnabled, 10) === 1) {
            // already enabled
            return;
        }
        const result = await AppApi.SetVRChatRegistryKey(
            'LOGGING_ENABLED',
            '1',
            4
        );
        if (!result) {
            // failed to set key
            this.$alert(
                'VRCX has noticed VRChat debug logging is disabled. VRCX requires debug logging in order to function correctly. Please enable debug logging in VRChat quick menu settings > debug > enable debug logging, then rejoin the instance or restart VRChat.',
                'Enable debug logging'
            );
            console.error('Failed to enable debug logging', result);
            return;
        }
        this.$alert(
            'VRCX has noticed VRChat debug logging is disabled and automatically re-enabled it. VRCX requires debug logging in order to function correctly.',
            'Enabled debug logging'
        );
        console.log('Enabled debug logging');
    } catch (e) {
        console.error(e);
    }
};

// #endregion
// #region | App: Random unsorted app methods, data structs, API functions, and an API feedback/file analysis event

$app.methods.openFolderGeneric = function (path) {
    AppApi.OpenFolderAndSelectItem(path, true);
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
// #region instance join history

$app.data.instanceJoinHistory = new Map();

API.$on('LOGIN', function () {
    $app.instanceJoinHistory = new Map();
    $app.getInstanceJoinHistory();
});

$app.methods.getInstanceJoinHistory = async function () {
    this.instanceJoinHistory = await database.getInstanceJoinHistory();
};

$app.methods.addInstanceJoinHistory = function (location, dateTime) {
    if (!location || !dateTime) {
        return;
    }

    if (this.instanceJoinHistory.has(location)) {
        this.instanceJoinHistory.delete(location);
    }

    const epoch = new Date(dateTime).getTime();
    this.instanceJoinHistory.set(location, epoch);
};

// #endregion

// #region persistent data

API.$on('WORLD:PERSIST:HAS', function (args) {
    if (
        args.params.worldId === $app.store.world.worldDialog.id &&
        $app.store.world.worldDialog.visible
    ) {
        $app.store.world.worldDialog.hasPersistData = args.json !== false;
    }
});

API.$on('WORLD:PERSIST:DELETE', function (args) {
    if (
        args.params.worldId === $app.store.world.worldDialog.id &&
        $app.store.world.worldDialog.visible
    ) {
        $app.store.world.worldDialog.hasPersistData = false;
    }
});

// #endregion
// #region | Tab Props

$app.computed.moderationTabBind = function () {
    return {
        shiftHeld: this.shiftHeld
    };
};

$app.computed.friendsListTabBind = function () {
    return {
        friendsListSearch: this.friendsListSearch,
        stringComparer: this.stringComparer
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
        quickSearchRemoteMethod: this.quickSearchRemoteMethod,
        quickSearchItems: this.quickSearchItems,
        isGameRunning: this.isGameRunning,
        lastLocationDestination: this.lastLocationDestination,
        groupInstances: this.groupInstances,
        inGameGroupOrder: this.inGameGroupOrder
    };
};

$app.computed.sidebarTabEvent = function () {
    return {
        'quick-search-change': this.quickSearchChange,
        'direct-access-paste': this.directAccessPaste
    };
};

$app.computed.favoritesTabBind = function () {
    return {
        shiftHeld: this.shiftHeld
    };
};

$app.computed.favoritesTabEvent = function () {
    return {
        'save-sort-favorites-option': this.saveSortFavoritesOption
    };
};

$app.computed.friendLogTabBind = function () {
    return {
        shiftHeld: this.shiftHeld
    };
};

$app.computed.gameLogTabBind = function () {
    return {
        gameLogTable: this.gameLogTable,
        shiftHeld: this.shiftHeld,
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

$app.computed.notificationTabBind = function () {
    return {
        shiftHeld: this.shiftHeld,
        lastLocationDestination: this.lastLocationDestination,
        isGameRunning: this.isGameRunning
    };
};

$app.computed.searchTabBind = function () {
    return {
        searchText: this.searchText,
        searchUserResults: this.searchUserResults,
        moreSearchUser: this.moreSearchUser
    };
};

$app.computed.searchTabEvent = function () {
    return {
        clearSearch: this.clearSearch,
        'update:searchText': (value) => (this.searchText = value)
    };
};

$app.computed.profileTabBind = function () {
    return {
        pastDisplayNameTable: this.pastDisplayNameTable,
        directAccessWorld: this.directAccessWorld
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
        currentInstanceUserList: this.currentInstanceUserList,
        chatboxUserBlacklist: this.chatboxUserBlacklist
    };
};

$app.computed.playerListTabEvent = function () {
    return {
        photonEventTableFilterChange: this.photonEventTableFilterChange,
        getCurrentInstanceUserList: this.getCurrentInstanceUserList,
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
        notificationPosition: this.notificationPosition,
        currentlyDroppingFile: this.currentlyDroppingFile,
        fullscreenImageDialog: this.fullscreenImageDialog,
        backupVrcRegistry: this.backupVrcRegistry
    };
};

$app.computed.settingsTabEvent = function () {
    return {
        changeNotificationPosition: this.changeNotificationPosition,
        saveVRCXWindowOption: this.saveVRCXWindowOption,
        promptProxySettings: this.promptProxySettings,
        saveOpenVROption: this.saveOpenVROption,
        saveSortFavoritesOption: this.saveSortFavoritesOption,
        promptMaxTableSizeDialog: this.promptMaxTableSizeDialog,
        saveSidebarSortOrder: this.saveSidebarSortOrder,
        promptNotificationTimeout: this.promptNotificationTimeout,
        saveDiscordOption: this.saveDiscordOption,
        showVRChatConfig: this.showVRChatConfig,
        openUGCFolder: this.openUGCFolder,
        openUGCFolderSelector: this.openUGCFolderSelector,
        resetUGCFolder: this.resetUGCFolder,
        changeYouTubeApi: this.changeYouTubeApi,
        saveEventOverlay: this.saveEventOverlay,
        promptPhotonOverlayMessageTimeout:
            this.promptPhotonOverlayMessageTimeout,
        photonEventTableFilterChange: this.photonEventTableFilterChange,
        promptPhotonLobbyTimeoutThreshold:
            this.promptPhotonLobbyTimeoutThreshold,
        disableGameLogDialog: this.disableGameLogDialog,
        clearVRCXCache: this.clearVRCXCache,
        promptAutoClearVRCXCacheFrequency:
            this.promptAutoClearVRCXCacheFrequency,
        showConsole: this.showConsole,
        handleSetTablePageSize: this.handleSetTablePageSize,
        updateSharedFeed: this.updateSharedFeed
    };
};

$app.methods.languageClass = function (key) {
    return languageClass(key);
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
window.$t = $t;

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
