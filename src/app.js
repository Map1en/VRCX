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
import 'default-passive-events';
import {
    avatarModerationRequest,
    avatarRequest,
    favoriteRequest,
    friendRequest,
    groupRequest,
    imageRequest,
    instanceRequest,
    inviteMessagesRequest,
    miscRequest,
    notificationRequest,
    playerModerationRequest,
    userRequest,
    vrcPlusIconRequest,
    vrcPlusImageRequest,
    worldRequest
} from './api';

import pugTemplate from './app.pug';

// API classes
import config from './classes/API/config.js';
import apiLogin from './classes/apiLogin.js';
import apiRequestHandler from './classes/apiRequestHandler.js';
import currentUser from './classes/currentUser.js';
import discordRpc from './classes/discordRpc.js';
import feed from './classes/feed.js';
import gameLog from './classes/gameLog.js';
import gameRealtimeLogging from './classes/gameRealtimeLogging.js';
import groups from './classes/groups.js';
import languages from './classes/languages.js';
import prompts from './classes/prompts.js';
import restoreFriendOrder from './classes/restoreFriendOrder.js';

// main app classes
import API from './classes/apiInit';
import sharedFeed from './classes/sharedFeed.js';
import uiComponents from './classes/uiComponents.js';
import updateLoop from './classes/updateLoop.js';
import vrcRegistry from './classes/vrcRegistry.js';
import _vrcxJsonStorage from './classes/vrcxJsonStorage.js';
import vrcxNotifications from './classes/vrcxNotifications.js';
import websocket from './classes/websocket.js';
import ChooseFavoriteGroupDialog from './components/dialogs/ChooseFavoriteGroupDialog.vue';
import FullscreenImageDialog from './components/dialogs/FullscreenImageDialog.vue';
import LaunchDialog from './components/dialogs/LaunchDialog.vue';
import PreviousInstancesInfoDialog from './components/dialogs/PreviousInstancesDialog/PreviousInstancesInfoDialog.vue';
import SafeDialog from './components/dialogs/SafeDialog.vue';
import UserDialog from './components/dialogs/UserDialog/UserDialog.vue';
import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';

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
import { userDialogGroupSortingOptions } from './shared/constants';
import {
    arraysMatch,
    buildTreeData,
    changeAppThemeStyle,
    checkVRChatCache,
    commaNumber,
    compareByDisplayName,
    compareByLocationAt,
    compareByName,
    compareByUpdatedAt,
    compareUnityVersion,
    convertFileUrlToImageUrl,
    deleteVRChatCache,
    displayLocation,
    escapeTag,
    extractFileId,
    extractFileVersion,
    getAvailablePlatforms,
    getPrintFileName,
    getPrintLocalDate,
    hasGroupPermission,
    isRealInstance,
    languageClass,
    localeIncludes,
    parseLocation,
    removeFromArray,
    replaceBioSymbols,
    storeAvatarImage,
    textToHex,
    timeToText,
    getWorldName,
    getGroupName,
    refreshCustomCss,
    refreshCustomScript,
    getNameColour,
    HueToHex,
    formatSeconds,
    getAllUserMemos,
    getWorldMemo,
    migrateMemos,
    isRpcWorld,
    getBundleDateSize
} from './shared/utils';
import { _utils } from './shared/utils/_utils';
import { updateTrustColorClasses } from './shared/utils';

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
import Sidebar from './views/Sidebar/Sidebar.vue';
import { userNotes } from './classes/userNotes.js';
import { pinia, createGlobalStores } from './stores';

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
        SettingsTab: () => import('./views/Settings/Settings.vue'),
        Sidebar,

        // components
        Location,
        SimpleSwitch,

        // - dialogs
        PreviousInstancesInfoDialog,
        UserDialog,
        WorldDialog: () =>
            import('./components/dialogs/WorldDialog/WorldDialog.vue'),
        GroupDialog: () =>
            import('./components/dialogs/GroupDialog/GroupDialog.vue'),
        AvatarDialog: () =>
            import('./components/dialogs/AvatarDialog/AvatarDialog.vue'),
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
            showPreviousInstancesInfoDialog:
                this.showPreviousInstancesInfoDialog,
            showLaunchDialog: this.showLaunchDialog,
            showFavoriteDialog: this.showFavoriteDialog,
            displayPreviousImages: this.displayPreviousImages,
            languageClass: this.languageClass,
            showGroupDialog: this.showGroupDialog,
            showGallerySelectDialog: this.showGallerySelectDialog,
            showGalleryDialog: this.showGalleryDialog,
            inviteImageUpload: this.inviteImageUpload,
            clearInviteImageUpload: this.clearInviteImageUpload,
            isLinux: this.isLinux
        };
    },
    el: '#root',
    async created() {
        this.changeThemeMode();
        const [savedCredentials, lastUserLoggedIn] = await Promise.all([
            configRepository.getString('savedCredentials'),
            configRepository.getString('lastUserLoggedIn')
        ]);
        this.loginForm = {
            ...this.loginForm,
            savedCredentials: savedCredentials
                ? JSON.parse(savedCredentials)
                : {},
            lastUserLoggedIn
        };
        await AppApi.CheckGameRunning();
        this.isGameNoVR = await configRepository.getBool('isGameNoVR');
    },
    async mounted() {
        refreshCustomCss();
        refreshCustomScript();

        AppApi.SetUserAgent();

        if (await this.store.vrcxUpdater.compareAppVersion()) {
            this.store.vrcxUpdater.showChangeLogDialog();
        }
        if (this.store.vrcxUpdater.autoUpdateVRCX !== 'Off') {
            await this.store.vrcxUpdater.checkForVRCXUpdate(this.notifyMenu);
        }

        API.$on('SHOW_WORLD_DIALOG_SHORTNAME', (tag) =>
            this.verifyShortName('', tag)
        );
        this.updateLoop();
        this.getGameLogTable();
        this.checkVRChatDebugLogging();
        this.checkAutoBackupRestoreVrcRegistry();
        await this.migrateStoredUsers();
        if (
            !this.store.advancedSettings.enablePrimaryPassword &&
            (await configRepository.getString('lastUserLoggedIn')) !== null
        ) {
            const user =
                this.loginForm.savedCredentials[
                    this.loginForm.lastUserLoggedIn
                ];
            if (user?.loginParmas?.endpoint) {
                API.endpointDomain = user.loginParmas.endpoint;
                API.websocketDomain = user.loginParmas.websocket;
            }
            // login at startup
            this.loginForm.loading = true;
            API.getConfig()
                .catch((err) => {
                    this.loginForm.loading = false;
                    throw err;
                })
                .then((args) => {
                    API.getCurrentUser()
                        .finally(() => {
                            this.loginForm.loading = false;
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
        if (LINUX) {
            setTimeout(() => {
                this.updateTTSVoices();
            }, 5000);
        }
    }
};

apiRequestHandler();
uiComponents();
websocket();

sharedFeed($app);
prompts($app);
vrcxNotifications($app);
apiLogin($app);
currentUser();
updateLoop($app);
discordRpc($app);
gameLog($app);
gameRealtimeLogging($app);
feed($app);
config($app);
languages($app);
groups($app);
vrcRegistry($app);
restoreFriendOrder($app);

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

addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
        $app.getZoomLevel();
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

API.$on('USER:CURRENT:SAVE', function (args) {
    this.$emit('USER:CURRENT', args);
});

API.$on('USER', function (args) {
    if (!args?.json?.id) {
        console.error('API.$on(USER) invalid args', args);
        return;
    }
    if (args.json.state === 'online') {
        args.ref = $app.store.user.applyUser(args.json); // GPS
        $app.store.friend.updateFriend({
            id: args.json.id,
            state: args.json.state
        }); // online/offline
    } else {
        $app.store.friend.updateFriend({
            id: args.json.id,
            state: args.json.state
        }); // online/offline
        args.ref = $app.store.user.applyUser(args.json); // GPS
    }
});

API.$on('USER:LIST', function (args) {
    for (let json of args.json) {
        if (!json.displayName) {
            console.error('getUsers gave us garbage', json);
            continue;
        }
        this.$emit('USER', {
            json,
            params: {
                userId: json.id
            }
        });
    }
});

API.applyPresenceLocation = function (ref) {
    const presence = ref.presence;
    if (isRealInstance(presence.world)) {
        ref.$locationTag = `${presence.world}:${presence.instance}`;
    } else {
        ref.$locationTag = presence.world;
    }
    if (isRealInstance(presence.travelingToWorld)) {
        ref.$travelingToLocation = `${presence.travelingToWorld}:${presence.travelingToInstance}`;
    } else {
        ref.$travelingToLocation = presence.travelingToWorld;
    }
    $app.updateCurrentUserLocation();
};

API.applyPresenceGroups = function (ref) {
    if (!this.currentUserGroupsInit) {
        // wait for init before diffing
        return;
    }
    const groups = ref.presence?.groups;
    if (!groups) {
        console.error('API.applyPresenceGroups: invalid groups', ref);
        return;
    }
    if (groups.length === 0) {
        // as it turns out, this is not the most trust worthly source of info
        return;
    }

    // update group list
    for (const groupId of groups) {
        if (!this.currentUserGroups.has(groupId)) {
            $app.onGroupJoined(groupId);
        }
    }
    for (const groupId of this.currentUserGroups.keys()) {
        if (!groups.includes(groupId)) {
            $app.onGroupLeft(groupId);
        }
    }
};

// #endregion
// #region | API: World

API.cachedWorlds = new Map();

API.$on('WORLD', function (args) {
    args.ref = this.applyWorld(args.json);
});

API.$on('WORLD:LIST', function (args) {
    for (let json of args.json) {
        this.$emit('WORLD', {
            json,
            params: {
                worldId: json.id
            }
        });
    }
});

API.$on('WORLD:SAVE', function (args) {
    let { json } = args;
    this.$emit('WORLD', {
        json,
        params: {
            worldId: json.id
        }
    });
});

API.getUserApiCurrentLocation = function () {
    return this.currentUser?.presence?.world;
};

API.actuallyGetCurrentLocation = async function () {
    let gameLogLocation = $app.lastLocation.location;
    if (gameLogLocation.startsWith('local')) {
        console.warn('PWI: local test mode', 'test_world');
        return 'test_world';
    }
    if (gameLogLocation === 'traveling') {
        gameLogLocation = $app.lastLocationDestination;
    }

    let presenceLocation = this.currentUser.$locationTag;
    if (presenceLocation === 'traveling') {
        presenceLocation = this.currentUser.$travelingToLocation;
    }

    // We want to use presence if it's valid to avoid extra API calls, but its prone to being outdated when this function is called.
    // So we check if the presence location is the same as the gameLog location; If it is, the presence is (probably) valid and we can use it.
    // If it's not, we need to get the user manually to get the correct location.
    // If the user happens to be offline or the api is just being dumb, we assume that the user logged into VRCX is different than the one in-game and return the gameLog location.
    // This is really dumb.
    if (presenceLocation === gameLogLocation) {
        const L = parseLocation(presenceLocation);
        return L.worldId;
    }

    const args = await userRequest.getUser({ userId: this.currentUser.id });
    const user = args.json;
    let userLocation = user.location;
    if (userLocation === 'traveling') {
        userLocation = user.travelingToLocation;
    }
    console.warn(
        "PWI: location didn't match, fetched user location",
        userLocation
    );

    if (isRealInstance(userLocation)) {
        console.warn('PWI: returning user location', userLocation);
        const L = parseLocation(userLocation);
        return L.worldId;
    }

    if (isRealInstance(gameLogLocation)) {
        console.warn(`PWI: returning gamelog location: `, gameLogLocation);
        const L = parseLocation(gameLogLocation);
        return L.worldId;
    }

    console.error(
        `PWI: all locations invalid: `,
        gameLogLocation,
        userLocation
    );
    return 'test_world';
};

API.applyWorld = function (json) {
    let ref = this.cachedWorlds.get(json.id);
    if (typeof ref === 'undefined') {
        ref = {
            id: '',
            name: '',
            description: '',
            defaultContentSettings: {},
            authorId: '',
            authorName: '',
            capacity: 0,
            recommendedCapacity: 0,
            tags: [],
            releaseStatus: '',
            imageUrl: '',
            thumbnailImageUrl: '',
            assetUrl: '',
            assetUrlObject: {},
            pluginUrl: '',
            pluginUrlObject: {},
            unityPackageUrl: '',
            unityPackageUrlObject: {},
            unityPackages: [],
            version: 0,
            favorites: 0,
            created_at: '',
            updated_at: '',
            publicationDate: '',
            labsPublicationDate: '',
            visits: 0,
            popularity: 0,
            heat: 0,
            publicOccupants: 0,
            privateOccupants: 0,
            occupants: 0,
            instances: [],
            featured: false,
            organization: '',
            previewYoutubeId: '',
            // VRCX
            $isLabs: false,
            //
            ...json
        };
        this.cachedWorlds.set(ref.id, ref);
    } else {
        Object.assign(ref, json);
    }
    ref.$isLabs = ref.tags.includes('system_labs');
    ref.name = replaceBioSymbols(ref.name);
    ref.description = replaceBioSymbols(ref.description);
    return ref;
};

// #endregion
// #region | API: Instance

API.cachedInstances = new Map();

API.applyInstance = function (json) {
    let ref = this.cachedInstances.get(json.id);
    if (typeof ref === 'undefined') {
        ref = {
            id: '',
            location: '',
            instanceId: '',
            name: '',
            worldId: '',
            type: '',
            ownerId: '',
            tags: [],
            active: false,
            full: false,
            n_users: 0,
            hasCapacityForYou: true, // not present depending on endpoint
            capacity: 0,
            recommendedCapacity: 0,
            userCount: 0,
            queueEnabled: false, // only present with group instance type
            queueSize: 0, // only present when queuing is enabled
            platforms: {},
            gameServerVersion: 0,
            hardClose: null, // boolean or null
            closedAt: null, // string or null
            secureName: '',
            shortName: '',
            world: {},
            users: [], // only present when you're the owner
            clientNumber: '',
            contentSettings: {},
            photonRegion: '',
            region: '',
            canRequestInvite: false,
            permanent: false,
            private: '', // part of instance tag
            hidden: '', // part of instance tag
            nonce: '', // only present when you're the owner
            strict: false, // deprecated
            displayName: null,
            groupAccessType: null, // only present with group instance type
            roleRestricted: false, // only present with group instance type
            instancePersistenceEnabled: null,
            playerPersistenceEnabled: null,
            ageGate: null,
            // VRCX
            $fetchedAt: '',
            $disabledContentSettings: [],
            ...json
        };
        this.cachedInstances.set(ref.id, ref);
    } else {
        Object.assign(ref, json);
    }
    ref.$location = parseLocation(ref.location);
    if (json.world?.id) {
        worldRequest
            .getCachedWorld({
                worldId: json.world.id
            })
            .then((args) => {
                ref.world = args.ref;
                return args;
            });
    }
    if (!json.$fetchedAt) {
        ref.$fetchedAt = new Date().toJSON();
    }
    ref.$disabledContentSettings = [];
    if (json.contentSettings && Object.keys(json.contentSettings).length) {
        for (let setting of $app.instanceContentSettings) {
            if (
                typeof json.contentSettings[setting] === 'undefined' ||
                json.contentSettings[setting] === true
            ) {
                continue;
            }
            ref.$disabledContentSettings.push(setting);
        }
    }
    return ref;
};

API.$on('INSTANCE', function (args) {
    let { json } = args;
    if (!json) {
        return;
    }
    args.ref = this.applyInstance(args.json);
});

API.$on('INSTANCE', function (args) {
    if (!args.json?.id) {
        return;
    }
    if (
        $app.store.user.userDialog.visible &&
        $app.store.user.userDialog.ref.$location.tag === args.json.id
    ) {
        $app.applyUserDialogLocation();
    }
    if (
        $app.store.world.worldDialog.visible &&
        $app.store.world.worldDialog.id === args.json.worldId
    ) {
        $app.applyWorldDialogInstances();
    }
    if (
        $app.store.group.groupDialog.visible &&
        $app.store.group.groupDialog.id === args.json.ownerId
    ) {
        $app.applyGroupDialogInstances();
    }

    // FIXME:
    // because use $refs to update data, can not trigger vue's reactivity system, so view will not update
    // will fix this when refactor the core code, maybe
    // old comment: hacky workaround to force update instance info
    $app.updateInstanceInfo++;
});

// #endregion
// #region | API: Avatar

API.cachedAvatars = new Map();

API.$on('AVATAR', function (args) {
    args.ref = $app.store.avatar.applyAvatar(args.json);
});

API.$on('AVATAR:LIST', function (args) {
    for (let json of args.json) {
        this.$emit('AVATAR', {
            json,
            params: {
                avatarId: json.id
            }
        });
    }
});

API.$on('AVATAR:SAVE', function (args) {
    let { json } = args;
    this.$emit('AVATAR', {
        json,
        params: {
            avatarId: json.id
        }
    });
});

API.$on('AVATAR:SELECT', function (args) {
    this.$emit('USER:CURRENT', args);
});

API.$on('AVATAR:DELETE', function (args) {
    let { json } = args;
    this.cachedAvatars.delete(json._id);
    if ($app.store.user.userDialog.id === json.authorId) {
        const map = new Map();
        for (let ref of this.cachedAvatars.values()) {
            if (ref.authorId === json.authorId) {
                map.set(ref.id, ref);
            }
        }
        const array = Array.from(map.values());
        $app.sortUserDialogAvatars(array);
    }
});

// API.$on('AVATAR:IMPOSTER:DELETE', function (args) {
//     if (
//         $app.avatarDialog.visible &&
//         args.params.avatarId === $app.avatarDialog.id
//     ) {
//         $app.showAvatarDialog($app.avatarDialog.id);
//     }
// });

// #endregion
// #region | API: Notification

API.isNotificationsLoading = false;

API.$on('LOGIN', function () {
    this.isNotificationsLoading = false;
});

API.$on('NOTIFICATION', function (args) {
    args.ref = this.applyNotification(args.json);
});

API.$on('NOTIFICATION:LIST', function (args) {
    for (let json of args.json) {
        this.$emit('NOTIFICATION', {
            json,
            params: {
                notificationId: json.id
            }
        });
    }
});

API.$on('NOTIFICATION:LIST:HIDDEN', function (args) {
    for (let json of args.json) {
        json.type = 'ignoredFriendRequest';
        this.$emit('NOTIFICATION', {
            json,
            params: {
                notificationId: json.id
            }
        });
    }
});

API.$on('NOTIFICATION:ACCEPT', function (args) {
    let ref;
    const array = $app.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (array[i].id === args.params.notificationId) {
            ref = array[i];
            break;
        }
    }
    if (typeof ref === 'undefined') {
        return;
    }
    ref.$isExpired = true;
    args.ref = ref;
    this.$emit('NOTIFICATION:EXPIRE', {
        ref,
        params: {
            notificationId: ref.id
        }
    });
    this.$emit('FRIEND:ADD', {
        params: {
            userId: ref.senderUserId
        }
    });
});

API.$on('NOTIFICATION:HIDE', function (args) {
    let ref;
    const array = $app.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (array[i].id === args.params.notificationId) {
            ref = array[i];
            break;
        }
    }
    if (typeof ref === 'undefined') {
        return;
    }
    args.ref = ref;
    if (
        ref.type === 'friendRequest' ||
        ref.type === 'ignoredFriendRequest' ||
        ref.type.includes('.')
    ) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === ref.id) {
                array.splice(i, 1);
                break;
            }
        }
    } else {
        ref.$isExpired = true;
        database.updateNotificationExpired(ref);
    }
    this.$emit('NOTIFICATION:EXPIRE', {
        ref,
        params: {
            notificationId: ref.id
        }
    });
});

API.applyNotification = function (json) {
    let ref;
    const array = $app.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (array[i].id === json.id) {
            ref = array[i];
            break;
        }
    }
    // delete any null in json
    for (let key in json) {
        if (json[key] === null) {
            delete json[key];
        }
    }
    if (typeof ref === 'undefined') {
        ref = {
            id: '',
            senderUserId: '',
            senderUsername: '',
            type: '',
            message: '',
            details: {},
            seen: false,
            created_at: '',
            // VRCX
            $isExpired: false,
            //
            ...json
        };
    } else {
        Object.assign(ref, json);
        ref.$isExpired = false;
    }
    if (ref.details !== Object(ref.details)) {
        let details = {};
        if (ref.details !== '{}') {
            try {
                const object = JSON.parse(ref.details);
                if (object === Object(object)) {
                    details = object;
                }
            } catch (err) {
                console.log(err);
            }
        }
        ref.details = details;
    }
    return ref;
};

API.expireFriendRequestNotifications = function () {
    const array = $app.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (
            array[i].type === 'friendRequest' ||
            array[i].type === 'ignoredFriendRequest' ||
            array[i].type.includes('.')
        ) {
            array.splice(i, 1);
        }
    }
};

API.expireNotification = function (notificationId) {
    let ref;
    const array = $app.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (array[i].id === notificationId) {
            ref = array[i];
            break;
        }
    }
    if (typeof ref === 'undefined') {
        return;
    }
    ref.$isExpired = true;
    database.updateNotificationExpired(ref);
    this.$emit('NOTIFICATION:EXPIRE', {
        ref,
        params: {
            notificationId: ref.id
        }
    });
};

API.refreshNotifications = async function () {
    this.isNotificationsLoading = true;
    let count;
    let params;
    try {
        this.expireFriendRequestNotifications();
        params = {
            n: 100,
            offset: 0
        };
        count = 50; // 5000 max
        for (let i = 0; i < count; i++) {
            const args = await notificationRequest.getNotifications(params);
            $app.unseenNotifications = [];
            params.offset += 100;
            if (args.json.length < 100) {
                break;
            }
        }
        params = {
            n: 100,
            offset: 0
        };
        count = 50; // 5000 max
        for (let i = 0; i < count; i++) {
            const args = await notificationRequest.getNotificationsV2(params);
            $app.unseenNotifications = [];
            params.offset += 100;
            if (args.json.length < 100) {
                break;
            }
        }
        params = {
            n: 100,
            offset: 0
        };
        count = 50; // 5000 max
        for (let i = 0; i < count; i++) {
            const args =
                await notificationRequest.getHiddenFriendRequests(params);
            $app.unseenNotifications = [];
            params.offset += 100;
            if (args.json.length < 100) {
                break;
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        this.isNotificationsLoading = false;
        $app.notificationInitStatus = true;
    }
};

API.$on('NOTIFICATION:V2:LIST', function (args) {
    for (let json of args.json) {
        this.$emit('NOTIFICATION:V2', { json });
    }
});

API.$on('NOTIFICATION:V2', function (args) {
    const json = args.json;
    json.created_at = json.createdAt;
    if (json.title && json.message) {
        json.message = `${json.title}, ${json.message}`;
    } else if (json.title) {
        json.message = json.title;
    }
    this.$emit('NOTIFICATION', {
        json,
        params: {
            notificationId: json.id
        }
    });
});

API.$on('NOTIFICATION:V2:UPDATE', function (args) {
    const notificationId = args.params.notificationId;
    const json = args.json;
    if (!json) {
        return;
    }
    json.id = notificationId;
    this.$emit('NOTIFICATION', {
        json,
        params: {
            notificationId
        }
    });
    if (json.seen) {
        this.$emit('NOTIFICATION:SEE', {
            params: {
                notificationId
            }
        });
    }
});

API.$on('NOTIFICATION:RESPONSE', function (args) {
    this.$emit('NOTIFICATION:HIDE', args);
    new Noty({
        type: 'success',
        text: escapeTag(args.json)
    }).show();
    console.log('NOTIFICATION:RESPONSE', args);
});

API.getFriendRequest = function (userId) {
    const array = $app.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (
            array[i].type === 'friendRequest' &&
            array[i].senderUserId === userId
        ) {
            return array[i].id;
        }
    }
    return '';
};

// #endregion
// #region | API: PlayerModeration

API.cachedPlayerModerations = new Map();
API.cachedPlayerModerationsUserIds = new Set();
API.isPlayerModerationsLoading = false;

API.$on('LOGIN', function () {
    this.cachedPlayerModerations.clear();
    this.cachedPlayerModerationsUserIds.clear();
    this.isPlayerModerationsLoading = false;
    this.refreshPlayerModerations();
});

API.$on('PLAYER-MODERATION', function (args) {
    args.ref = this.applyPlayerModeration(args.json);
});

API.$on('PLAYER-MODERATION:LIST', function (args) {
    for (let json of args.json) {
        this.$emit('PLAYER-MODERATION', {
            json,
            params: {
                playerModerationId: json.id
            }
        });
    }
});

API.$on('PLAYER-MODERATION:SEND', function (args) {
    const ref = {
        json: args.json,
        params: {
            playerModerationId: args.json.id
        }
    };
    this.$emit('PLAYER-MODERATION', ref);
    this.$emit('PLAYER-MODERATION:@SEND', ref);
});

API.$on('PLAYER-MODERATION:DELETE', function (args) {
    let { type, moderated } = args.params;
    const userId = this.currentUser.id;
    for (let ref of this.cachedPlayerModerations.values()) {
        if (
            ref.type === type &&
            ref.targetUserId === moderated &&
            ref.sourceUserId === userId
        ) {
            this.cachedPlayerModerations.delete(ref.id);
            this.$emit('PLAYER-MODERATION:@DELETE', {
                ref,
                params: {
                    playerModerationId: ref.id
                }
            });
        }
    }
    this.cachedPlayerModerationsUserIds.delete(moderated);
});

API.applyPlayerModeration = function (json) {
    let ref = this.cachedPlayerModerations.get(json.id);
    if (typeof ref === 'undefined') {
        ref = {
            id: '',
            type: '',
            sourceUserId: '',
            sourceDisplayName: '',
            targetUserId: '',
            targetDisplayName: '',
            created: '',
            // VRCX
            $isExpired: false,
            //
            ...json
        };
        this.cachedPlayerModerations.set(ref.id, ref);
    } else {
        Object.assign(ref, json);
        ref.$isExpired = false;
    }
    if (json.targetUserId) {
        this.cachedPlayerModerationsUserIds.add(json.targetUserId);
    }
    return ref;
};

API.expirePlayerModerations = function () {
    this.cachedPlayerModerationsUserIds.clear();
    for (let ref of this.cachedPlayerModerations.values()) {
        ref.$isExpired = true;
    }
};

API.deleteExpiredPlayerModerations = function () {
    for (let ref of this.cachedPlayerModerations.values()) {
        if (!ref.$isExpired) {
            continue;
        }
        this.$emit('PLAYER-MODERATION:@DELETE', {
            ref,
            params: {
                playerModerationId: ref.id
            }
        });
    }
};

API.refreshPlayerModerations = function () {
    if (this.isPlayerModerationsLoading) {
        return;
    }
    this.isPlayerModerationsLoading = true;
    this.expirePlayerModerations();
    Promise.all([
        playerModerationRequest.getPlayerModerations(),
        avatarModerationRequest.getAvatarModerations()
    ])
        .finally(() => {
            this.isPlayerModerationsLoading = false;
        })
        .then((res) => {
            // 'AVATAR-MODERATION:LIST';
            // TODO: compare with cachedAvatarModerations
            $app.store.avatar.cachedAvatarModerations = new Map();
            if (res[1]?.json) {
                for (const json of res[1].json) {
                    $app.store.avatar.applyAvatarModeration(json);
                }
            }
            this.deleteExpiredPlayerModerations();
        });
};

// #endregion
// #region | API: Favorite

// API.cachedFavoritesByObjectId = new Map();
API.favoriteAvatarGroups = [];
API.isFavoriteGroupLoading = false;

API.$on('LOGIN', function () {
    $app.store.friend.localFavoriteFriends.clear();
    $app.currentUserGroupsInit = false;
    $app.store.favorite.cachedFavorites.clear();
    $app.store.favorite.cachedFavoritesByObjectId.clear();
    $app.store.favorite.cachedFavoriteGroups.clear();
    $app.store.favorite.cachedFavoriteGroupsByTypeName.clear();
    this.currentUserGroups.clear();
    this.queuedInstances.clear();
    $app.store.favorite.favoriteFriendGroups = [];
    this.favoriteWorldGroups = [];
    this.favoriteAvatarGroups = [];
    $app.store.favorite.isFavoriteLoading = false;
    this.isFavoriteGroupLoading = false;
    $app.store.favorite.refreshFavorites();
});

API.$on('FAVORITE', function (args) {
    const ref = $app.store.favorite.applyFavoriteCached(args.json);
    if (ref.$isDeleted) {
        return;
    }
    args.ref = ref;
});

API.$on('FAVORITE:@DELETE', function (args) {
    let { ref } = args;
    if (ref.$groupRef !== null) {
        --ref.$groupRef.count;
    }
});

API.$on('FAVORITE:LIST', function (args) {
    for (let json of args.json) {
        this.$emit('FAVORITE', {
            json,
            params: {
                favoriteId: json.id
            },
            sortTop: false
        });
    }
});

API.$on('FAVORITE:ADD', function (args) {
    this.$emit('FAVORITE', {
        json: args.json,
        params: {
            favoriteId: args.json.id
        },
        sortTop: true
    });
});

API.$on('FAVORITE:ADD', function (args) {
    if (
        args.params.type === 'avatar' &&
        !API.cachedAvatars.has(args.params.favoriteId)
    ) {
        $app.store.favorite.refreshFavoriteAvatars(args.params.tags);
    }

    if (
        args.params.type === 'friend' &&
        $app.store.generalSettings.localFavoriteFriendsGroups.includes(
            'friend:' + args.params.tags
        )
    ) {
        $app.store.friend.updateLocalFavoriteFriends();
    }
});

API.$on('FAVORITE:DELETE', function (args) {
    const ref = $app.store.favorite.cachedFavoritesByObjectId.get(
        args.params.objectId
    );
    if (typeof ref === 'undefined') {
        return;
    }
    // 애초에 $isDeleted인데 여기로 올 수 가 있나..?
    $app.store.favorite.cachedFavoritesByObjectId.delete(args.params.objectId);
    $app.store.friend.localFavoriteFriends.delete(args.params.objectId);
    $app.store.friend.updateSidebarFriendsList();
    if (ref.$isDeleted) {
        return;
    }
    args.ref = ref;
    ref.$isDeleted = true;
    API.$emit('FAVORITE:@DELETE', {
        ref,
        params: {
            favoriteId: ref.id
        }
    });
});

API.$on('FAVORITE:GROUP', function (args) {
    const ref = $app.store.favorite.applyFavoriteGroup(args.json);
    if (ref.$isDeleted) {
        return;
    }
    args.ref = ref;
    if (ref.$groupRef !== null) {
        ref.$groupRef.displayName = ref.displayName;
        ref.$groupRef.visibility = ref.visibility;
    }
});

API.$on('FAVORITE:GROUP:LIST', function (args) {
    for (let json of args.json) {
        this.$emit('FAVORITE:GROUP', {
            json,
            params: {
                favoriteGroupId: json.id
            }
        });
    }
});

API.$on('FAVORITE:GROUP:SAVE', function (args) {
    this.$emit('FAVORITE:GROUP', {
        json: args.json,
        params: {
            favoriteGroupId: args.json.id
        }
    });
});

API.$on('FAVORITE:GROUP:CLEAR', function (args) {
    const key = `${args.params.type}:${args.params.group}`;
    for (let ref of $app.store.favorite.cachedFavorites.values()) {
        if (ref.$isDeleted || ref.$groupKey !== key) {
            continue;
        }
        $app.store.favorite.cachedFavoritesByObjectId.delete(ref.favoriteId);
        $app.store.friend.localFavoriteFriends.delete(ref.favoriteId);
        $app.store.friend.updateSidebarFriendsList();
        ref.$isDeleted = true;
        API.$emit('FAVORITE:@DELETE', {
            ref,
            params: {
                favoriteId: ref.id
            }
        });
    }
});

API.$on('FAVORITE:WORLD:LIST', function (args) {
    for (let json of args.json) {
        if (json.id === '???') {
            // FIXME
            // json.favoriteId로 따로 불러와야 하나?
            // 근데 ???가 많으면 과다 요청이 될듯
            continue;
        }
        this.$emit('WORLD', {
            json,
            params: {
                worldId: json.id
            }
        });
    }
});

API.$on('FAVORITE:AVATAR:LIST', function (args) {
    for (let json of args.json) {
        if (json.releaseStatus === 'hidden') {
            // NOTE: 얘는 또 더미 데이터로 옴
            continue;
        }
        this.$emit('AVATAR', {
            json,
            params: {
                avatarId: json.id
            }
        });
    }
});

API.expireFavorites = function () {
    $app.store.friend.localFavoriteFriends.clear();
    $app.store.favorite.cachedFavorites.clear();
    $app.store.favorite.cachedFavoritesByObjectId.clear();
    $app.store.favorite.favoriteObjects.clear();
    $app.store.favorite.favoriteFriends_ = [];
    $app.store.favorite.favoriteFriendsSorted = [];
    $app.store.favorite.favoriteWorlds_ = [];
    $app.store.favorite.favoriteWorldsSorted = [];
    $app.store.favorite.favoriteAvatars_ = [];
    $app.store.favorite.favoriteAvatarsSorted = [];
};

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
            this.removeAllQueuedInstances();
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

$app.data.menuActiveIndex = 'feed';

$app.methods.notifyMenu = function (index) {
    const navRef = this.$refs.menu.$children[0];
    if (this.menuActiveIndex !== index) {
        const item = navRef.items[index];
        if (item) {
            item.$el.classList.add('notify');
        }
    }
};

$app.methods.selectMenu = function (index) {
    this.menuActiveIndex = index;
    const item = this.$refs.menu.$children[0]?.items[index];
    if (item) {
        item.$el.classList.remove('notify');
    }
    if (index === 'notification') {
        this.unseenNotifications = [];
    }
};

$app.data.twoFactorAuthDialogVisible = false;

API.$on('LOGIN', function () {
    $app.twoFactorAuthDialogVisible = false;
});

$app.methods.clearCookiesTryLogin = async function () {
    await webApiService.clearCookies();
    if (this.loginForm.lastUserLoggedIn) {
        const user =
            this.loginForm.savedCredentials[this.loginForm.lastUserLoggedIn];
        if (typeof user !== 'undefined') {
            delete user.cookies;
            await this.relogin(user);
        }
    }
};

$app.methods.resendEmail2fa = async function () {
    if (this.loginForm.lastUserLoggedIn) {
        const user =
            this.loginForm.savedCredentials[this.loginForm.lastUserLoggedIn];
        if (typeof user !== 'undefined') {
            await webApiService.clearCookies();
            delete user.cookies;
            this.relogin(user).then(() => {
                new Noty({
                    type: 'success',
                    text: 'Email 2FA resent.'
                }).show();
            });
            return;
        }
    }
    new Noty({
        type: 'error',
        text: 'Cannot send 2FA email without saved credentials. Please login again.'
    }).show();
};

API.$on('USER:2FA', function () {
    AppApi.FocusWindow();
    $app.promptTOTP();
});

API.$on('USER:EMAILOTP', function () {
    AppApi.FocusWindow();
    $app.promptEmailOTP();
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
    $app.notificationInitStatus = false;
});

API.$on('LOGIN', function (args) {
    new Noty({
        type: 'success',
        text: `Hello there, <strong>${escapeTag(
            args.ref.displayName
        )}</strong>!`
    }).show();
    $app.updateStoredUser(this.currentUser);
});

API.$on('LOGOUT', async function () {
    await $app.updateStoredUser(this.currentUser);
    webApiService.clearCookies();
    $app.loginForm.lastUserLoggedIn = '';
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

$app.data.enablePrimaryPasswordDialog = {
    visible: false,
    password: '',
    rePassword: '',
    beforeClose(done) {
        $app._data.enablePrimaryPassword = false;
        done();
    }
};
$app.methods.enablePrimaryPasswordChange = function () {
    this.store.advancedSettings.enablePrimaryPassword =
        !this.store.advancedSettings.enablePrimaryPassword;

    this.enablePrimaryPasswordDialog.password = '';
    this.enablePrimaryPasswordDialog.rePassword = '';
    if (this.store.advancedSettings.enablePrimaryPassword) {
        this.enablePrimaryPasswordDialog.visible = true;
    } else {
        this.$prompt(
            $t('prompt.primary_password.description'),
            $t('prompt.primary_password.header'),
            {
                inputType: 'password',
                inputPattern: /[\s\S]{1,32}/
            }
        )
            .then(({ value }) => {
                for (const userId in this.loginForm.savedCredentials) {
                    security
                        .decrypt(
                            this.loginForm.savedCredentials[userId].loginParmas
                                .password,
                            value
                        )
                        .then(async (pt) => {
                            this.saveCredentials = {
                                username:
                                    this.loginForm.savedCredentials[userId]
                                        .loginParmas.username,
                                password: pt
                            };
                            await this.updateStoredUser(
                                this.loginForm.savedCredentials[userId].user
                            );
                            await configRepository.setBool(
                                'enablePrimaryPassword',
                                false
                            );
                        })
                        .catch(async () => {
                            this.store.advancedSettings.enablePrimaryPassword =
                                true;
                            this.store.advancedSettings.setEnablePrimaryPasswordConfigRepository(
                                true
                            );
                        });
                }
            })
            .catch(async () => {
                this.store.advancedSettings.enablePrimaryPassword = true;
                this.store.advancedSettings.setEnablePrimaryPasswordConfigRepository(
                    true
                );
            });
    }
};
$app.methods.setPrimaryPassword = async function () {
    await configRepository.setBool(
        'enablePrimaryPassword',
        this.store.advancedSettings.enablePrimaryPassword
    );
    this.enablePrimaryPasswordDialog.visible = false;
    if (this.store.advancedSettings.enablePrimaryPassword) {
        const key = this.enablePrimaryPasswordDialog.password;
        for (const userId in this.loginForm.savedCredentials) {
            security
                .encrypt(
                    this.loginForm.savedCredentials[userId].loginParmas
                        .password,
                    key
                )
                .then((ct) => {
                    this.saveCredentials = {
                        username:
                            this.loginForm.savedCredentials[userId].loginParmas
                                .username,
                        password: ct
                    };
                    this.updateStoredUser(
                        this.loginForm.savedCredentials[userId].user
                    );
                });
        }
    }
};

$app.methods.updateStoredUser = async function (user) {
    let savedCredentials = {};
    if ((await configRepository.getString('savedCredentials')) !== null) {
        savedCredentials = JSON.parse(
            await configRepository.getString('savedCredentials')
        );
    }
    if (this.saveCredentials) {
        const credentialsToSave = {
            user,
            loginParmas: this.saveCredentials
        };
        savedCredentials[user.id] = credentialsToSave;
        delete this.saveCredentials;
    } else if (typeof savedCredentials[user.id] !== 'undefined') {
        savedCredentials[user.id].user = user;
        savedCredentials[user.id].cookies = await webApiService.getCookies();
    }
    this.loginForm.savedCredentials = savedCredentials;
    const jsonCredentialsArray = JSON.stringify(savedCredentials);
    await configRepository.setString('savedCredentials', jsonCredentialsArray);
    this.loginForm.lastUserLoggedIn = user.id;
    await configRepository.setString('lastUserLoggedIn', user.id);
};

$app.methods.migrateStoredUsers = async function () {
    let savedCredentials = {};
    if ((await configRepository.getString('savedCredentials')) !== null) {
        savedCredentials = JSON.parse(
            await configRepository.getString('savedCredentials')
        );
    }
    for (const name in savedCredentials) {
        const userId = savedCredentials[name]?.user?.id;
        if (userId && userId !== name) {
            savedCredentials[userId] = savedCredentials[name];
            delete savedCredentials[name];
        }
    }
    await configRepository.setString(
        'savedCredentials',
        JSON.stringify(savedCredentials)
    );
};

// #endregion
// #region | App: Friends

$app.data.friendNumber = 0;
$app.data.isFriendsGroupMe = true;
$app.data.isVIPFriends = true;
$app.data.isOnlineFriends = true;
$app.data.isActiveFriends = true;
$app.data.isOfflineFriends = false;
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

API.$on('FRIEND:ADD', function (args) {
    $app.store.friend.addFriend(args.params.userId);
});

API.$on('FRIEND:DELETE', function (args) {
    $app.store.friend.deleteFriend(args.params.userId);
});

API.$on('FRIEND:STATE', function (args) {
    $app.store.friend.updateFriend({
        id: args.params.userId,
        state: args.json.state
    });
});

API.$on('FAVORITE', function (args) {
    $app.store.friend.updateFriend({ id: args.ref.favoriteId });
});

API.$on('FAVORITE:@DELETE', function (args) {
    $app.store.friend.updateFriend({ id: args.ref.favoriteId });
});

$app.methods.confirmDeleteFriend = function (id) {
    this.$confirm('Continue? Unfriend', 'Confirm', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'info',
        callback: (action) => {
            if (action === 'confirm') {
                friendRequest.deleteFriend({
                    userId: id
                });
            }
        }
    });
};

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
                this.menuActiveIndex = 'friendList';
            } else {
                this.menuActiveIndex = 'search';
                this.searchText = searchText;
                this.lookupUser({ displayName: searchText });
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
    $app.feedTable.loading = true;

    $app.friendLog = new Map();
    $app.feedTable.data = [];
    $app.feedSessionTable = [];
    $app.store.friend.friendLogInitStatus = false;
    $app.notificationInitStatus = false;
    await database.initUserTables(args.json.id);
    $app.menuActiveIndex = 'feed';
    await $app.updateDatabaseVersion();

    $app.gameLogTable.data = await database.lookupGameLogDatabase(
        $app.gameLogTable.search,
        $app.gameLogTable.filter
    );
    $app.feedSessionTable = await database.getFeedDatabase();
    await $app.feedTableLookup();
    $app.notificationTable.data = await database.getNotifications();
    this.refreshNotifications();
    $app.loadCurrentUserGroups(args.json.id, args.json?.presence?.groups);
    try {
        if (await configRepository.getBool(`friendLogInit_${args.json.id}`)) {
            await $app.getFriendLog(args.ref);
        } else {
            await $app.initFriendLog(args.ref);
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
        await $app.userColourInit();
    }
    await $app.getAllUserStats();
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
        $app.migrateFriendLog(args.json.id);
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
            this.lastLocation = {
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
                this.lastLocation.playerList.set(ctx.userId, userMap);
                if (this.store.friend.friends.has(ctx.userId)) {
                    this.lastLocation.friendList.set(ctx.userId, userMap);
                }
            }
            if (ctx.type === 'OnPlayerLeft') {
                this.lastLocation.playerList.delete(ctx.userId);
                this.lastLocation.friendList.delete(ctx.userId);
            }
        }
        this.lastLocation.playerList.forEach((ref1) => {
            if (
                ref1.userId &&
                typeof ref1.userId === 'string' &&
                !API.cachedUsers.has(ref1.userId)
            ) {
                userRequest.getUser({ userId: ref1.userId });
            }
        });

        this.updateCurrentUserLocation();
        this.updateCurrentInstanceWorld();
        this.updateVRLastLocation();
        this.getCurrentInstanceUserList();
        this.applyUserDialogLocation();
        this.applyWorldDialogInstances();
        this.applyGroupDialogInstances();
    }
};

$app.data.instancePlayerCount = new Map();

API.$on('USER:UPDATE', async function (args) {
    let feed;
    let newLocation;
    let previousLocation;
    const { ref, props } = args;
    const friend = $app.store.friend.friends.get(ref.id);
    if (typeof friend === 'undefined') {
        return;
    }
    if (props.location) {
        // update instancePlayerCount
        previousLocation = props.location[1];
        newLocation = props.location[0];
        let oldCount = $app.instancePlayerCount.get(previousLocation);
        if (typeof oldCount !== 'undefined') {
            oldCount--;
            if (oldCount <= 0) {
                $app.instancePlayerCount.delete(previousLocation);
            } else {
                $app.instancePlayerCount.set(previousLocation, oldCount);
            }
        }
        let newCount = $app.instancePlayerCount.get(newLocation);
        if (typeof newCount === 'undefined') {
            newCount = 0;
        }
        newCount++;
        $app.instancePlayerCount.set(newLocation, newCount);
    }
    if (props.location && ref.id === $app.store.user.userDialog.id) {
        // update user dialog instance occupants
        $app.applyUserDialogLocation(true);
    }
    if (
        props.location &&
        ref.$location.worldId === $app.store.world.worldDialog.id
    ) {
        $app.applyWorldDialogInstances();
    }
    if (
        props.location &&
        ref.$location.groupId === $app.store.group.groupDialog.id
    ) {
        $app.applyGroupDialogInstances();
    }
    if (
        !props.state &&
        props.location &&
        props.location[0] !== 'offline' &&
        props.location[0] !== '' &&
        props.location[1] !== 'offline' &&
        props.location[1] !== '' &&
        props.location[0] !== 'traveling'
    ) {
        // skip GPS if user is offline or traveling
        previousLocation = props.location[1];
        newLocation = props.location[0];
        let time = props.location[2];
        if (previousLocation === 'traveling' && ref.$previousLocation) {
            previousLocation = ref.$previousLocation;
            const travelTime = Date.now() - ref.$travelingToTime;
            time -= travelTime;
            if (time < 0) {
                time = 0;
            }
        }
        if ($app.store.debug.debugFriendState && previousLocation) {
            console.log(
                `${ref.displayName} GPS ${previousLocation} -> ${newLocation}`
            );
        }
        if (previousLocation === 'offline') {
            previousLocation = '';
        }
        if (!previousLocation) {
            // no previous location
            if ($app.store.debug.debugFriendState) {
                console.log(
                    ref.displayName,
                    'Ignoring GPS, no previous location',
                    newLocation
                );
            }
        } else if (ref.$previousLocation === newLocation) {
            // location traveled to is the same
            ref.$location_at = Date.now() - time;
        } else {
            const worldName = await getWorldName(newLocation);
            const groupName = await getGroupName(newLocation);
            feed = {
                created_at: new Date().toJSON(),
                type: 'GPS',
                userId: ref.id,
                displayName: ref.displayName,
                location: newLocation,
                worldName,
                groupName,
                previousLocation,
                time
            };
            $app.addFeed(feed);
            database.addGPSToDatabase(feed);
            $app.store.friend.updateFriendGPS(ref.id);
            // clear previousLocation after GPS
            ref.$previousLocation = '';
            ref.$travelingToTime = Date.now();
        }
    }
    if (
        props.location &&
        props.location[0] === 'traveling' &&
        props.location[1] !== 'traveling'
    ) {
        // store previous location when user is traveling
        ref.$previousLocation = props.location[1];
        ref.$travelingToTime = Date.now();
        $app.store.friend.updateFriendGPS(ref.id);
    }
    let imageMatches = false;
    if (
        props.currentAvatarThumbnailImageUrl &&
        props.currentAvatarThumbnailImageUrl[0] &&
        props.currentAvatarThumbnailImageUrl[1] &&
        props.currentAvatarThumbnailImageUrl[0] ===
            props.currentAvatarThumbnailImageUrl[1]
    ) {
        imageMatches = true;
    }
    if (
        (((props.currentAvatarImageUrl ||
            props.currentAvatarThumbnailImageUrl) &&
            !ref.profilePicOverride) ||
            props.currentAvatarTags) &&
        !imageMatches
    ) {
        let currentAvatarImageUrl = '';
        let previousCurrentAvatarImageUrl = '';
        let currentAvatarThumbnailImageUrl = '';
        let previousCurrentAvatarThumbnailImageUrl = '';
        let currentAvatarTags = '';
        let previousCurrentAvatarTags = '';
        if (props.currentAvatarImageUrl) {
            currentAvatarImageUrl = props.currentAvatarImageUrl[0];
            previousCurrentAvatarImageUrl = props.currentAvatarImageUrl[1];
        } else {
            currentAvatarImageUrl = ref.currentAvatarImageUrl;
            previousCurrentAvatarImageUrl = ref.currentAvatarImageUrl;
        }
        if (props.currentAvatarThumbnailImageUrl) {
            currentAvatarThumbnailImageUrl =
                props.currentAvatarThumbnailImageUrl[0];
            previousCurrentAvatarThumbnailImageUrl =
                props.currentAvatarThumbnailImageUrl[1];
        } else {
            currentAvatarThumbnailImageUrl = ref.currentAvatarThumbnailImageUrl;
            previousCurrentAvatarThumbnailImageUrl =
                ref.currentAvatarThumbnailImageUrl;
        }
        if (props.currentAvatarTags) {
            currentAvatarTags = props.currentAvatarTags[0];
            previousCurrentAvatarTags = props.currentAvatarTags[1];
            if (
                ref.profilePicOverride &&
                !props.currentAvatarThumbnailImageUrl
            ) {
                // forget last seen avatar
                ref.currentAvatarImageUrl = '';
                ref.currentAvatarThumbnailImageUrl = '';
            }
        } else {
            currentAvatarTags = ref.currentAvatarTags;
            previousCurrentAvatarTags = ref.currentAvatarTags;
        }
        if (
            $app.store.generalSettings.logEmptyAvatars ||
            ref.currentAvatarImageUrl
        ) {
            let avatarInfo = {
                ownerId: '',
                avatarName: ''
            };
            try {
                avatarInfo = await $app.getAvatarName(currentAvatarImageUrl);
            } catch (err) {
                console.log(err);
            }
            let previousAvatarInfo = {
                ownerId: '',
                avatarName: ''
            };
            try {
                previousAvatarInfo = await $app.getAvatarName(
                    previousCurrentAvatarImageUrl
                );
            } catch (err) {
                console.log(err);
            }
            feed = {
                created_at: new Date().toJSON(),
                type: 'Avatar',
                userId: ref.id,
                displayName: ref.displayName,
                ownerId: avatarInfo.ownerId,
                previousOwnerId: previousAvatarInfo.ownerId,
                avatarName: avatarInfo.avatarName,
                previousAvatarName: previousAvatarInfo.avatarName,
                currentAvatarImageUrl,
                currentAvatarThumbnailImageUrl,
                previousCurrentAvatarImageUrl,
                previousCurrentAvatarThumbnailImageUrl,
                currentAvatarTags,
                previousCurrentAvatarTags
            };
            $app.addFeed(feed);
            database.addAvatarToDatabase(feed);
        }
    }
    if (props.status || props.statusDescription) {
        let status = '';
        let previousStatus = '';
        let statusDescription = '';
        let previousStatusDescription = '';
        if (props.status) {
            if (props.status[0]) {
                status = props.status[0];
            }
            if (props.status[1]) {
                previousStatus = props.status[1];
            }
        } else if (ref.status) {
            status = ref.status;
            previousStatus = ref.status;
        }
        if (props.statusDescription) {
            if (props.statusDescription[0]) {
                statusDescription = props.statusDescription[0];
            }
            if (props.statusDescription[1]) {
                previousStatusDescription = props.statusDescription[1];
            }
        } else if (ref.statusDescription) {
            statusDescription = ref.statusDescription;
            previousStatusDescription = ref.statusDescription;
        }
        feed = {
            created_at: new Date().toJSON(),
            type: 'Status',
            userId: ref.id,
            displayName: ref.displayName,
            status,
            statusDescription,
            previousStatus,
            previousStatusDescription
        };
        $app.addFeed(feed);
        database.addStatusToDatabase(feed);
    }
    if (props.bio && props.bio[0] && props.bio[1]) {
        let bio = '';
        let previousBio = '';
        if (props.bio[0]) {
            bio = props.bio[0];
        }
        if (props.bio[1]) {
            previousBio = props.bio[1];
        }
        feed = {
            created_at: new Date().toJSON(),
            type: 'Bio',
            userId: ref.id,
            displayName: ref.displayName,
            bio,
            previousBio
        };
        $app.addFeed(feed);
        database.addBioToDatabase(feed);
    }
});

/**
 * Function that prepare the Longest Common Subsequence (LCS) scores matrix
 * @param {*} s1 String 1
 * @param {*} s2 String 2
 * @returns
 */
$app.methods.lcsMatrix = function (s1, s2) {
    const m = s1.length;
    const n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    // Fill the matrix for LCS
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp;
};

/**
 * Function to find the longest common subsequence between two strings
 * @param {string} str1
 * @param {string} str2
 * @returns {number[][]} A matrix that contains the longest common subsequence between both strings
 */
$app.methods.longestCommonSubsequence = function longestCommonSubsequence(
    str1,
    str2
) {
    const lcs = [];
    for (let i = 0; i <= str1.length; i++) {
        lcs.push(new Array(str2.length + 1).fill(0));
    }
    for (let i = str1.length - 1; i >= 0; i--) {
        for (let j = str2.length - 1; j >= 0; j--) {
            if (str1[i] === str2[j]) {
                lcs[i][j] = lcs[i + 1][j + 1] + 1;
            } else {
                lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
            }
        }
    }
    return lcs;
};

/**
 * Merge differences in both strings to get the longest common subsequence
 * @param {{text: string, type: "add" | "remove" | "same"}[]} res
 * @returns {{text: string, type: "add" | "remove" | "same"}[]} An array that contains the differences between both strings
 */
$app.methods.regoupDifferences = function regoupDifferences(res) {
    const regrouped = [];
    let text = '';
    let type = '';
    for (let i = 0; i < res.length; i++) {
        if (i === 0) {
            text = res[i].text;
            type = res[i].type;
        } else if (res[i].type === type) {
            text += res[i].text;
        } else {
            regrouped.push({ text: text, type: type });
            text = res[i].text;
            type = res[i].type;
        }
    }
    regrouped.push({ text: text, type: type });
    return regrouped;
};

// #endregion
// #region | App: gameLog

$app.data.lastLocation = {
    date: 0,
    location: '',
    name: '',
    playerList: new Map(),
    friendList: new Map()
};

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
    const playerList = Array.from(this.lastLocation.playerList.values());
    const dataBaseEntries = [];
    for (let ref of playerList) {
        const entry = {
            created_at: dateTime,
            type: 'OnPlayerLeft',
            displayName: ref.displayName,
            location: this.lastLocation.location,
            userId: ref.userId,
            time: dateTimeStamp - ref.joinTime
        };
        dataBaseEntries.unshift(entry);
        this.addGameLog(entry);
    }
    database.addGamelogJoinLeaveBulk(dataBaseEntries);
    if (this.lastLocation.date !== 0) {
        const update = {
            time: dateTimeStamp - this.lastLocation.date,
            created_at: new Date(this.lastLocation.date).toJSON()
        };
        database.updateGamelogLocationTimeToDatabase(update);
    }
    this.lastLocationDestination = '';
    this.lastLocationDestinationTime = 0;
    this.lastLocation = {
        date: 0,
        location: '',
        name: '',
        playerList: new Map(),
        friendList: new Map()
    };
    this.updateCurrentUserLocation();
    this.updateCurrentInstanceWorld();
    this.updateVRLastLocation();
    this.getCurrentInstanceUserList();
    this.lastVideoUrl = '';
    this.lastResourceloadUrl = '';
    this.applyUserDialogLocation();
    this.applyWorldDialogInstances();
    this.applyGroupDialogInstances();
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

// It's like he's going to be used somewhere, and commenting it out would be an error or something.
$app.methods.silentSearchUser = function (displayName) {
    console.log('Searching for userId for:', displayName);
    const params = {
        n: 5,
        offset: 0,
        fuzzy: false,
        search: displayName
    };
    userRequest.getUsers(params).then((args) => {
        const map = new Map();
        let nameFound = false;
        for (let json of args.json) {
            const ref = API.cachedUsers.get(json.id);
            if (typeof ref !== 'undefined') {
                map.set(ref.id, ref);
            }
            if (json.displayName === displayName) {
                nameFound = true;
            }
        }
        if (!nameFound) {
            console.error('userId not found for', displayName);
        }
        return args;
    });
};

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
        this.queueGameLogNoty(ctx);
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
        !this.lastLocation.playerList.size ||
        this.lastLocation.location === '' ||
        this.lastLocation.location === 'traveling'
    ) {
        return;
    }

    const $location = parseLocation(this.lastLocation.location);
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

    let withCompany = this.lastLocation.playerList.size > 1;
    if (this.store.generalSettings.autoStateChangeNoFriends) {
        withCompany = this.lastLocation.friendList.size >= 1;
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

$app.methods.lookupUser = async function (ref) {
    let ctx;
    if (ref.userId) {
        this.store.user.showUserDialog(ref.userId);
        return;
    }
    if (!ref.displayName || ref.displayName.substring(0, 3) === 'ID:') {
        return;
    }
    for (ctx of API.cachedUsers.values()) {
        if (ctx.displayName === ref.displayName) {
            this.store.user.showUserDialog(ctx.id);
            return;
        }
    }
    this.searchText = ref.displayName;
    await this.searchUserByDisplayName(ref.displayName);
    for (ctx of this.searchUserResults) {
        if (ctx.displayName === ref.displayName) {
            this.searchText = '';
            this.clearSearch();
            this.store.user.showUserDialog(ctx.id);
            return;
        }
    }
    // this.$refs.searchTab.currentName = '0';
    // this.menuActiveIndex = 'search';
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
        const map = new Map();
        for (let json of args.json) {
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
// #region | App: Favorite

// $app.data.favoriteFriends_ = [];
// $app.data.favoriteFriendsSorted = [];
// $app.data.favoriteWorlds_ = [];
// $app.data.favoriteWorldsSorted = [];
// $app.data.favoriteAvatars_ = [];
// $app.data.favoriteAvatarsSorted = [];
// $app.data.sortFavoriteFriends = false;
$app.data.sortFavoriteWorlds = false;
$app.data.sortFavoriteAvatars = false;

API.$on('LOGIN', function () {
    $app.store.favorite.favoriteObjects.clear();
    $app.store.favorite.favoriteFriends_ = [];
    $app.store.favorite.favoriteFriendsSorted = [];
    $app.store.favorite.favoriteWorlds_ = [];
    $app.favoriteWorldsSorted = [];
    $app.store.favorite.favoriteAvatars_ = [];
    $app.favoriteAvatarsSorted = [];
    $app.store.favorite.sortFavoriteFriends = false;
    $app.sortFavoriteWorlds = false;
    $app.sortFavoriteAvatars = false;
});

API.$on('FAVORITE', function (args) {
    $app.store.favorite.applyFavorite(
        args.ref.type,
        args.ref.favoriteId,
        args.sortTop
    );
});

API.$on('FAVORITE:@DELETE', function (args) {
    $app.store.favorite.applyFavorite(args.ref.type, args.ref.favoriteId);
});

API.$on('USER', function (args) {
    $app.store.favorite.applyFavorite('friend', args.ref.id);
});

API.$on('WORLD', function (args) {
    $app.store.favorite.applyFavorite('world', args.ref.id);
});

API.$on('AVATAR', function (args) {
    $app.store.favorite.applyFavorite('avatar', args.ref.id);
});

$app.computed.groupedByGroupKeyFavoriteFriends = function () {
    const groupedByGroupKeyFavoriteFriends = {};

    this.store.favorite.favoriteFriends.forEach((friend) => {
        if (friend.groupKey) {
            if (!groupedByGroupKeyFavoriteFriends[friend.groupKey]) {
                groupedByGroupKeyFavoriteFriends[friend.groupKey] = [];
            }
            groupedByGroupKeyFavoriteFriends[friend.groupKey].push(friend);
        }
    });

    return groupedByGroupKeyFavoriteFriends;
};

// #endregion
// #region | App: friendLog

$app.data.friendLog = new Map();
$app.data.friendLogTable = {
    data: [],
    filters: [
        {
            prop: 'type',
            value: [],
            filterFn: (row, filter) => filter.value.some((v) => v === row.type)
        },
        {
            prop: 'displayName',
            value: ''
        },
        {
            prop: 'type',
            value: false,
            filterFn: (row, filter) =>
                !(filter.value && row.type === 'Unfriend')
        }
    ],
    tableProps: {
        stripe: true,
        size: 'mini',
        defaultSort: {
            prop: 'created_at',
            order: 'descending'
        }
    },
    pageSize: 15,
    paginationProps: {
        small: true,
        layout: 'sizes,prev,pager,next,total',
        pageSizes: [10, 15, 20, 25, 50, 100]
    }
};

API.$on('USER:CURRENT', function (args) {
    $app.updateFriendships(args.ref);
});

API.$on('USER', function (args) {
    $app.updateFriendship(args.ref);
    if (
        $app.store.friend.friendLogInitStatus &&
        args.json.isFriend &&
        !$app.friendLog.has(args.ref.id) &&
        args.json.id !== this.currentUser.id
    ) {
        $app.addFriendship(args.ref.id);
    }
});

API.$on('FRIEND:ADD', function (args) {
    $app.addFriendship(args.params.userId);
});

API.$on('FRIEND:DELETE', function (args) {
    $app.deleteFriendship(args.params.userId);
});

// todo: maybe put in friendlog store
// $app.data.friendLogInitStatus = false;
$app.data.notificationInitStatus = false;

$app.methods.initFriendLog = async function (currentUser) {
    this.store.friend.refreshFriendsStatus(currentUser, true);
    const sqlValues = [];
    const friends = await this.store.friend.refreshFriends();
    for (let friend of friends) {
        const ref = $app.store.user.applyUser(friend);
        const row = {
            userId: ref.id,
            displayName: ref.displayName,
            trustLevel: ref.$trustLevel,
            friendNumber: 0
        };
        this.friendLog.set(friend.id, row);
        sqlValues.unshift(row);
    }
    database.setFriendLogCurrentArray(sqlValues);
    await configRepository.setBool(`friendLogInit_${currentUser.id}`, true);
    this.store.friend.friendLogInitStatus = true;
};

$app.methods.migrateFriendLog = async function (userId) {
    VRCXStorage.Remove(`${userId}_friendLogUpdatedAt`);
    VRCXStorage.Remove(`${userId}_friendLog`);
    this.friendLogTable.data = await VRCXStorage.GetArray(
        `${userId}_friendLogTable`
    );
    database.addFriendLogHistoryArray(this.friendLogTable.data);
    VRCXStorage.Remove(`${userId}_friendLogTable`);
    await configRepository.setBool(`friendLogInit_${userId}`, true);
};

$app.methods.getFriendLog = async function (currentUser) {
    let friend;
    this.friendNumber = await configRepository.getInt(
        `VRCX_friendNumber_${currentUser.id}`,
        0
    );
    const maxFriendLogNumber = await database.getMaxFriendLogNumber();
    if (this.friendNumber < maxFriendLogNumber) {
        this.friendNumber = maxFriendLogNumber;
    }

    const friendLogCurrentArray = await database.getFriendLogCurrent();
    for (friend of friendLogCurrentArray) {
        this.friendLog.set(friend.userId, friend);
    }
    this.friendLogTable.data = [];
    this.friendLogTable.data = await database.getFriendLogHistory();
    this.store.friend.refreshFriendsStatus(currentUser, true);
    await this.store.friend.refreshFriends();
    await this.tryRestoreFriendNumber();
    this.store.friend.friendLogInitStatus = true;

    // check for friend/name/rank change AFTER friendLogInitStatus is set
    for (friend of friendLogCurrentArray) {
        const ref = API.cachedUsers.get(friend.userId);
        if (typeof ref !== 'undefined') {
            this.updateFriendship(ref);
        }
    }
    if (typeof currentUser.friends !== 'undefined') {
        this.updateFriendships(currentUser);
    }
};

$app.methods.addFriendship = function (id) {
    if (
        !this.store.friend.friendLogInitStatus ||
        this.friendLog.has(id) ||
        id === API.currentUser.id
    ) {
        return;
    }
    const ref = API.cachedUsers.get(id);
    if (typeof ref === 'undefined') {
        try {
            userRequest.getUser({
                userId: id
            });
        } catch (err) {
            console.error('Fetch user on add as friend', err);
        }
        return;
    }
    friendRequest
        .getFriendStatus({
            userId: id
        })
        .then((args) => {
            if (args.json.isFriend && !this.friendLog.has(id)) {
                if (this.friendNumber === 0) {
                    this.friendNumber = this.store.friend.friends.size;
                }
                ref.$friendNumber = ++this.friendNumber;
                configRepository.setInt(
                    `VRCX_friendNumber_${API.currentUser.id}`,
                    this.friendNumber
                );
                this.store.friend.addFriend(id, ref.state);
                const friendLogHistory = {
                    created_at: new Date().toJSON(),
                    type: 'Friend',
                    userId: id,
                    displayName: ref.displayName,
                    friendNumber: ref.$friendNumber
                };
                this.friendLogTable.data.push(friendLogHistory);
                database.addFriendLogHistory(friendLogHistory);
                this.queueFriendLogNoty(friendLogHistory);
                const friendLogCurrent = {
                    userId: id,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    friendNumber: ref.$friendNumber
                };
                this.friendLog.set(id, friendLogCurrent);
                database.setFriendLogCurrent(friendLogCurrent);
                this.notifyMenu('friendLog');
                this.deleteFriendRequest(id);
                this.updateSharedFeed(true);
                userRequest
                    .getUser({
                        userId: id
                    })
                    .then(() => {
                        if (
                            this.store.user.userDialog.visible &&
                            id === this.store.user.userDialog.id
                        ) {
                            this.applyUserDialogLocation(true);
                        }
                    });
            }
        });
};

$app.methods.deleteFriendRequest = function (userId) {
    const array = $app.notificationTable.data;
    for (let i = array.length - 1; i >= 0; i--) {
        if (
            array[i].type === 'friendRequest' &&
            array[i].senderUserId === userId
        ) {
            array.splice(i, 1);
            return;
        }
    }
};

$app.methods.deleteFriendship = function (id) {
    const ctx = this.friendLog.get(id);
    if (typeof ctx === 'undefined') {
        return;
    }
    friendRequest
        .getFriendStatus({
            userId: id
        })
        .then((args) => {
            if (!args.json.isFriend && this.friendLog.has(id)) {
                const friendLogHistory = {
                    created_at: new Date().toJSON(),
                    type: 'Unfriend',
                    userId: id,
                    displayName: ctx.displayName || id
                };
                this.friendLogTable.data.push(friendLogHistory);
                database.addFriendLogHistory(friendLogHistory);
                this.queueFriendLogNoty(friendLogHistory);
                this.friendLog.delete(id);
                database.deleteFriendLogCurrent(id);
                if (!this.store.appearanceSettings.hideUnfriends) {
                    this.notifyMenu('friendLog');
                }
                this.updateSharedFeed(true);
                this.store.friend.deleteFriend(id);
            }
        });
};

$app.methods.updateFriendships = function (ref) {
    let id;
    const set = new Set();
    for (id of ref.friends) {
        set.add(id);
        this.addFriendship(id);
    }
    for (id of this.friendLog.keys()) {
        if (id === API.currentUser.id) {
            this.friendLog.delete(id);
            database.deleteFriendLogCurrent(id);
        } else if (!set.has(id)) {
            this.deleteFriendship(id);
        }
    }
};

$app.methods.updateFriendship = function (ref) {
    const ctx = this.friendLog.get(ref.id);
    if (!this.store.friend.friendLogInitStatus || typeof ctx === 'undefined') {
        return;
    }
    if (ctx.friendNumber) {
        ref.$friendNumber = ctx.friendNumber;
    }
    if (ctx.displayName !== ref.displayName) {
        if (ctx.displayName) {
            const friendLogHistoryDisplayName = {
                created_at: new Date().toJSON(),
                type: 'DisplayName',
                userId: ref.id,
                displayName: ref.displayName,
                previousDisplayName: ctx.displayName,
                friendNumber: ref.$friendNumber
            };
            this.friendLogTable.data.push(friendLogHistoryDisplayName);
            database.addFriendLogHistory(friendLogHistoryDisplayName);
            this.queueFriendLogNoty(friendLogHistoryDisplayName);
            const friendLogCurrent = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: ref.$friendNumber
            };
            this.friendLog.set(ref.id, friendLogCurrent);
            database.setFriendLogCurrent(friendLogCurrent);
            ctx.displayName = ref.displayName;
            this.notifyMenu('friendLog');
            this.updateSharedFeed(true);
        }
    }
    if (
        ref.$trustLevel &&
        ctx.trustLevel &&
        ctx.trustLevel !== ref.$trustLevel
    ) {
        if (
            (ctx.trustLevel === 'Trusted User' &&
                ref.$trustLevel === 'Veteran User') ||
            (ctx.trustLevel === 'Veteran User' &&
                ref.$trustLevel === 'Trusted User')
        ) {
            const friendLogCurrent3 = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: ref.$friendNumber
            };
            this.friendLog.set(ref.id, friendLogCurrent3);
            database.setFriendLogCurrent(friendLogCurrent3);
            return;
        }
        const friendLogHistoryTrustLevel = {
            created_at: new Date().toJSON(),
            type: 'TrustLevel',
            userId: ref.id,
            displayName: ref.displayName,
            trustLevel: ref.$trustLevel,
            previousTrustLevel: ctx.trustLevel,
            friendNumber: ref.$friendNumber
        };
        this.friendLogTable.data.push(friendLogHistoryTrustLevel);
        database.addFriendLogHistory(friendLogHistoryTrustLevel);
        this.queueFriendLogNoty(friendLogHistoryTrustLevel);
        const friendLogCurrent2 = {
            userId: ref.id,
            displayName: ref.displayName,
            trustLevel: ref.$trustLevel,
            friendNumber: ref.$friendNumber
        };
        this.friendLog.set(ref.id, friendLogCurrent2);
        database.setFriendLogCurrent(friendLogCurrent2);
        this.notifyMenu('friendLog');
        this.updateSharedFeed(true);
    }
    ctx.trustLevel = ref.$trustLevel;
};

// #endregion
// #region | App: Moderation

$app.data.playerModerationTable = {
    data: [],
    pageSize: 15
};

API.$on('LOGIN', function () {
    $app.playerModerationTable.data = [];
});

API.$on('PLAYER-MODERATION', function (args) {
    const { ref } = args;
    const array = $app.playerModerationTable.data;
    const { length } = array;
    for (let i = 0; i < length; ++i) {
        if (array[i].id === ref.id) {
            Vue.set(array, i, ref);
            return;
        }
    }
    $app.playerModerationTable.data.push(ref);
});

API.$on('PLAYER-MODERATION:@DELETE', function (args) {
    const { ref } = args;
    const array = $app.playerModerationTable.data;
    const { length } = array;
    for (let i = 0; i < length; ++i) {
        if (array[i].id === ref.id) {
            array.splice(i, 1);
            return;
        }
    }
});

// #endregion
// #region | App: Notification

$app.data.notificationTable = {
    data: [],
    filters: [
        {
            prop: 'type',
            value: [],
            filterFn: (row, filter) => filter.value.some((v) => v === row.type)
        },
        {
            prop: ['senderUsername', 'message'],
            value: ''
        }
    ],
    tableProps: {
        stripe: true,
        size: 'mini',
        defaultSort: {
            prop: 'created_at',
            order: 'descending'
        }
    },
    pageSize: 15,
    paginationProps: {
        small: true,
        layout: 'sizes,prev,pager,next,total',
        pageSizes: [10, 15, 20, 25, 50, 100]
    }
};

API.$on('LOGIN', function () {
    $app.notificationTable.data = [];
});

API.$on('PIPELINE:NOTIFICATION', function (args) {
    const ref = args.json;
    if (
        ref.type !== 'requestInvite' ||
        $app.store.generalSettings.autoAcceptInviteRequests === 'Off'
    ) {
        return;
    }

    let currentLocation = $app.lastLocation.location;
    if ($app.lastLocation.location === 'traveling') {
        currentLocation = $app.lastLocationDestination;
    }
    if (!currentLocation) {
        return;
    }
    if (
        $app.store.generalSettings.autoAcceptInviteRequests ===
            'All Favorites' &&
        !$app.store.favorite.favoriteFriends.some(
            (x) => x.id === ref.senderUserId
        )
    ) {
        return;
    }
    if (
        $app.store.generalSettings.autoAcceptInviteRequests ===
            'Selected Favorites' &&
        !$app.store.friend.localFavoriteFriends.has(ref.senderUserId)
    ) {
        return;
    }
    if (!$app.checkCanInvite(currentLocation)) {
        return;
    }

    const L = parseLocation(currentLocation);
    worldRequest
        .getCachedWorld({
            worldId: L.worldId
        })
        .then((args1) => {
            notificationRequest
                .sendInvite(
                    {
                        instanceId: L.tag,
                        worldId: L.tag,
                        worldName: args1.ref.name,
                        rsvp: true
                    },
                    ref.senderUserId
                )
                .then((_args) => {
                    const text = `Auto invite sent to ${ref.senderUsername}`;
                    if (this.errorNoty) {
                        this.errorNoty.close();
                    }
                    this.errorNoty = new Noty({
                        type: 'info',
                        text
                    });
                    this.errorNoty.show();
                    console.log(text);
                    notificationRequest.hideNotification({
                        notificationId: ref.id
                    });
                    return _args;
                })
                .catch((err) => {
                    console.error(err);
                });
        });
});

$app.data.unseenNotifications = [];

API.$on('NOTIFICATION', function (args) {
    let { ref } = args;
    const array = $app.notificationTable.data;
    let { length } = array;
    for (let i = 0; i < length; ++i) {
        if (array[i].id === ref.id) {
            Vue.set(array, i, ref);
            return;
        }
    }
    if (ref.senderUserId !== this.currentUser.id) {
        if (
            ref.type !== 'friendRequest' &&
            ref.type !== 'ignoredFriendRequest' &&
            !ref.type.includes('.')
        ) {
            database.addNotificationToDatabase(ref);
        }
        if (
            $app.store.friend.friendLogInitStatus &&
            $app.notificationInitStatus
        ) {
            if (
                $app.notificationTable.filters[0].value.length === 0 ||
                $app.notificationTable.filters[0].value.includes(ref.type)
            ) {
                $app.notifyMenu('notification');
            }
            $app.unseenNotifications.push(ref.id);
            $app.queueNotificationNoty(ref);
        }
    }
    $app.notificationTable.data.push(ref);
    $app.updateSharedFeed(true);
});

API.$on('NOTIFICATION:SEE', function (args) {
    let { notificationId } = args.params;
    removeFromArray($app.unseenNotifications, notificationId);
    if ($app.unseenNotifications.length === 0) {
        const item = $app.$refs.menu.$children[0]?.items['notification'];
        if (item) {
            item.$el.classList.remove('notify');
        }
    }
});

$app.data.feedTable.filter = JSON.parse(
    await configRepository.getString('VRCX_feedTableFilters', '[]')
);
$app.data.feedTable.vip = await configRepository.getBool(
    'VRCX_feedTableVIPFilter',
    false
);
$app.data.gameLogTable.vip = false;
// gameLog loads before favorites
// await configRepository.getBool(
//     'VRCX_gameLogTableVIPFilter',
//     false
// );
$app.data.gameLogTable.filter = JSON.parse(
    await configRepository.getString('VRCX_gameLogTableFilters', '[]')
);
$app.data.friendLogTable.filters[0].value = JSON.parse(
    await configRepository.getString('VRCX_friendLogTableFilters', '[]')
);
$app.data.notificationTable.filters[0].value = JSON.parse(
    await configRepository.getString('VRCX_notificationTableFilters', '[]')
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
$app.data.printTable = [];
$app.data.stickerTable = [];
$app.data.emojiTable = [];
$app.data.VRCPlusIconsTable = [];
$app.data.galleryTable = [];
$app.data.inviteMessageTable = {
    data: [],
    tableProps: {
        stripe: true,
        size: 'mini'
    },
    layout: 'table',
    visible: false
};
$app.data.inviteResponseMessageTable = {
    data: [],
    tableProps: {
        stripe: true,
        size: 'mini'
    },
    layout: 'table',
    visible: false
};
$app.data.inviteRequestMessageTable = {
    data: [],
    tableProps: {
        stripe: true,
        size: 'mini'
    },
    layout: 'table',
    visible: false
};
$app.data.inviteRequestResponseMessageTable = {
    data: [],
    tableProps: {
        stripe: true,
        size: 'mini'
    },
    layout: 'table',
    visible: false
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
// It's not necessary to store it in configRepo because it's rarely used.
$app.data.isTestTTSVisible = false;

$app.data.notificationTTSVoice = await configRepository.getString(
    'VRCX_notificationTTSVoice',
    '0'
);
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

$app.data.notificationTTSTest = '';
$app.data.TTSvoices = speechSynthesis.getVoices();
$app.methods.updateTTSVoices = function () {
    this.TTSvoices = speechSynthesis.getVoices();
    if (LINUX) {
        const voices = speechSynthesis.getVoices();
        let uniqueVoices = [];
        voices.forEach((voice) => {
            if (!uniqueVoices.some((v) => v.lang === voice.lang)) {
                uniqueVoices.push(voice);
            }
        });
        uniqueVoices = uniqueVoices.filter((v) => v.lang.startsWith('en'));
        this.TTSvoices = uniqueVoices;
    }
};
$app.methods.saveNotificationTTS = async function (value) {
    // todo: move
    speechSynthesis.cancel();
    if (
        (await configRepository.getString('VRCX_notificationTTS')) ===
            'Never' &&
        value !== 'Never'
    ) {
        this.speak('Notification text-to-speech enabled');
    }
    this.setNotificationTTS(value);
};
$app.methods.testNotificationTTS = function () {
    speechSynthesis.cancel();
    this.speak(this.notificationTTSTest);
};

window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', async () => {
        if ($app.themeMode === 'system') {
            await $app.changeThemeMode();
        }
    });

$app.methods.saveThemeMode = async function (newThemeMode) {
    this.store.appearanceSettings.setThemeMode(newThemeMode);
    await this.changeThemeMode();
};

$app.methods.changeThemeMode = async function () {
    await changeAppThemeStyle(this.store.appearanceSettings.themeMode);
    this.updateVRConfigVars();
    await this.updateTrustColor();
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
            this.cropPrintsChanged();
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

$app.methods.updateTrustColor = async function (
    setRandomColor = false,
    field,
    color
) {
    if (setRandomColor) {
        this.store.appearanceSettings.setRandomUserColours();
    }
    if (typeof API.currentUser?.id === 'undefined') {
        return;
    }
    if (field && color) {
        this.store.appearanceSettings.setTrustColor({
            ...this.store.appearanceSettings.trustColor,
            [field]: color
        });
    }
    if (this.store.appearanceSettings.randomUserColours) {
        getNameColour(API.currentUser.id).then((colour) => {
            API.currentUser.$userColour = colour;
        });
        this.userColourInit();
    } else {
        this.store.user.applyUserTrustLevel(API.currentUser);
        API.cachedUsers.forEach((ref) => {
            this.store.user.applyUserTrustLevel(ref);
        });
    }
    updateTrustColorClasses(this.store.appearanceSettings.trustColor);
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
        appLanguage: this.store.appearanceSettings.appLanguage
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
            if (!isRpcWorld(this.lastLocation.location)) {
                progressPie = false;
            }
        }
    }
    let onlineFor = '';
    if (!this.store.wristOverlaySettings.hideUptimeFromFeed) {
        onlineFor = API.currentUser.$online_for;
    }
    const lastLocation = {
        date: this.lastLocation.date,
        location: this.lastLocation.location,
        name: this.lastLocation.name,
        playerList: Array.from(this.lastLocation.playerList.values()),
        friendList: Array.from(this.lastLocation.friendList.values()),
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

API.$on('LOGIN', function () {
    $app.pastDisplayNameTable.data = [];
});

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

$app.methods.getTTSVoiceName = function () {
    let voices;
    if (LINUX) {
        voices = this.TTSvoices;
    } else {
        voices = speechSynthesis.getVoices();
    }
    if (voices.length === 0) {
        return '';
    }
    if (this.notificationTTSVoice >= voices.length) {
        this.notificationTTSVoice = 0;
        configRepository.setString(
            'VRCX_notificationTTSVoice',
            this.notificationTTSVoice
        );
    }
    return voices[this.notificationTTSVoice].name;
};

$app.methods.changeTTSVoice = async function (index) {
    this.notificationTTSVoice = index;
    await configRepository.setString(
        'VRCX_notificationTTSVoice',
        this.notificationTTSVoice
    );
    let voices;
    if (LINUX) {
        voices = this.TTSvoices;
    } else {
        voices = speechSynthesis.getVoices();
    }
    if (voices.length === 0) {
        return;
    }
    const voiceName = voices[index].name;
    speechSynthesis.cancel();
    this.speak(voiceName);
};

$app.methods.speak = function (text) {
    const tts = new SpeechSynthesisUtterance();
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        return;
    }
    let index = 0;
    if (this.notificationTTSVoice < voices.length) {
        index = this.notificationTTSVoice;
    }
    tts.voice = voices[index];
    tts.text = text;
    speechSynthesis.speak(tts);
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
            // API.$on('GROUP:STRICTSEARCH', function (args) {
            // for (var json of args.json) {
            API.$emit('GROUP', {
                group,
                params: {
                    groupId: group.id
                }
            });
            // }
            // });
            if (`${group.shortCode}.${group.discriminator}` === shortCode) {
                this.showGroupDialog(group.id);
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
            this.showGroupDialog(groupId);
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
        this.showGroupDialog(input);
        return true;
    }
    return false;
};

$app.methods.handleSetTablePageSize = async function (pageSize) {
    this.feedTable.pageSize = pageSize;
    this.gameLogTable.pageSize = pageSize;
    this.friendLogTable.pageSize = pageSize;
    this.playerModerationTable.pageSize = pageSize;
    this.notificationTable.pageSize = pageSize;
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

API.$on('USER', function (args) {
    let { ref } = args;
    const D = $app.store.user.userDialog;
    if (D.visible === false || D.id !== ref.id) {
        return;
    }
    D.ref = ref;
    D.note = String(ref.note || '');
    D.noteSaving = false;
    D.incomingRequest = false;
    D.outgoingRequest = false;
    if (D.ref.friendRequestStatus === 'incoming') {
        D.incomingRequest = true;
    } else if (D.ref.friendRequestStatus === 'outgoing') {
        D.outgoingRequest = true;
    }
});

API.$on('USER', function (args) {
    // refresh user dialog JSON tab
    if (
        !$app.store.user.userDialog.visible ||
        $app.store.user.userDialog.id !== args.ref.id ||
        $app.$refs.userDialogTabs?.currentName !== '5'
    ) {
        return;
    }
    $app.refreshUserDialogTreeData();
});

API.$on('WORLD', function (args) {
    const D = $app.store.user.userDialog;
    if (D.visible === false || D.$location.worldId !== args.ref.id) {
        return;
    }
    $app.applyUserDialogLocation();
});

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

API.$on('NOTIFICATION', function (args) {
    let { ref } = args;
    const D = $app.store.user.userDialog;
    if (
        D.visible === false ||
        ref.$isDeleted ||
        ref.type !== 'friendRequest' ||
        ref.senderUserId !== D.id
    ) {
        return;
    }
    D.incomingRequest = true;
});

API.$on('NOTIFICATION:ACCEPT', function (args) {
    let { ref } = args;
    const D = $app.store.user.userDialog;
    // 얘는 @DELETE가 오고나서 ACCEPT가 옴
    // 따라서 $isDeleted라면 ref가 undefined가 됨
    if (
        D.visible === false ||
        typeof ref === 'undefined' ||
        ref.type !== 'friendRequest' ||
        ref.senderUserId !== D.id
    ) {
        return;
    }
    D.isFriend = true;
});

API.$on('NOTIFICATION:EXPIRE', function (args) {
    let { ref } = args;
    const D = $app.store.user.userDialog;
    if (
        D.visible === false ||
        ref.type !== 'friendRequest' ||
        ref.senderUserId !== D.id
    ) {
        return;
    }
    D.incomingRequest = false;
});

API.$on('FRIEND:DELETE', function (args) {
    const D = $app.store.user.userDialog;
    if (D.visible === false || D.id !== args.params.userId) {
        return;
    }
    D.isFriend = false;
});

API.$on('PLAYER-MODERATION:@SEND', function (args) {
    let { ref } = args;
    const D = $app.store.user.userDialog;
    if (
        D.visible === false ||
        (ref.targetUserId !== D.id && ref.sourceUserId !== this.currentUser.id)
    ) {
        return;
    }
    if (ref.type === 'block') {
        D.isBlock = true;
    } else if (ref.type === 'mute') {
        D.isMute = true;
    } else if (ref.type === 'hideAvatar') {
        D.isHideAvatar = true;
    } else if (ref.type === 'interactOff') {
        D.isInteractOff = true;
    } else if (ref.type === 'muteChat') {
        D.isMuteChat = true;
    }
    $app.$message({
        message: $t('message.user.moderated'),
        type: 'success'
    });
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

API.$on('FAVORITE', function (args) {
    let { ref } = args;
    const D = $app.store.user.userDialog;
    if (D.visible === false || ref.$isDeleted || ref.favoriteId !== D.id) {
        return;
    }
    D.isFavorite = true;
});

API.$on('FAVORITE:@DELETE', function (args) {
    const D = $app.store.user.userDialog;
    if (D.visible === false || D.id !== args.ref.favoriteId) {
        return;
    }
    D.isFavorite = false;
});

$app.methods.applyUserDialogLocation = function (updateInstanceOccupants) {
    let addUser;
    let friend;
    let ref;
    const D = this.store.user.userDialog;
    if (!D.visible) {
        return;
    }
    const L = parseLocation(D.ref.$location.tag);
    if (updateInstanceOccupants && L.isRealInstance) {
        instanceRequest.getInstance({
            worldId: L.worldId,
            instanceId: L.instanceId
        });
    }
    D.$location = L;
    if (L.userId) {
        ref = API.cachedUsers.get(L.userId);
        if (typeof ref === 'undefined') {
            userRequest
                .getUser({
                    userId: L.userId
                })
                .then((args) => {
                    Vue.set(L, 'user', args.ref);
                    return args;
                });
        } else {
            L.user = ref;
        }
    }
    const users = [];
    let friendCount = 0;
    const playersInInstance = this.lastLocation.playerList;
    const cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
    const currentLocation = cachedCurrentUser.$location.tag;
    if (!L.isOffline && currentLocation === L.tag) {
        ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref !== 'undefined') {
            users.push(ref); // add self
        }
    }
    // dont use gamelog when using api location
    if (this.lastLocation.location === L.tag && playersInInstance.size > 0) {
        const friendsInInstance = this.lastLocation.friendList;
        for (friend of friendsInInstance.values()) {
            // if friend isn't in instance add them
            addUser = !users.some(function (user) {
                return friend.userId === user.id;
            });
            if (addUser) {
                ref = API.cachedUsers.get(friend.userId);
                if (typeof ref !== 'undefined') {
                    users.push(ref);
                }
            }
        }
        friendCount = users.length - 1;
    }
    if (!L.isOffline) {
        for (friend of this.store.friend.friends.values()) {
            if (typeof friend.ref === 'undefined') {
                continue;
            }
            if (friend.ref.location === this.lastLocation.location) {
                // don't add friends to currentUser gameLog instance (except when traveling)
                continue;
            }
            if (friend.ref.$location.tag === L.tag) {
                if (
                    friend.state !== 'online' &&
                    friend.ref.location === 'private'
                ) {
                    // don't add offline friends to private instances
                    continue;
                }
                // if friend isn't in instance add them
                addUser = !users.some(function (user) {
                    return friend.name === user.displayName;
                });
                if (addUser) {
                    users.push(friend.ref);
                }
            }
        }
        friendCount = users.length;
    }
    if (this.store.appearanceSettings.instanceUsersSortAlphabetical) {
        users.sort(compareByDisplayName);
    } else {
        users.sort(compareByLocationAt);
    }
    D.users = users;
    if (L.worldId && currentLocation === L.tag && playersInInstance.size > 0) {
        D.instance = {
            id: L.instanceId,
            tag: L.tag,
            $location: L,
            friendCount: 0,
            users: [],
            shortName: '',
            ref: {}
        };
    }
    if (!L.isRealInstance) {
        D.instance = {
            id: L.instanceId,
            tag: L.tag,
            $location: L,
            friendCount: 0,
            users: [],
            shortName: '',
            ref: {}
        };
    }
    const instanceRef = API.cachedInstances.get(L.tag);
    if (typeof instanceRef !== 'undefined') {
        D.instance.ref = instanceRef;
    }
    D.instance.friendCount = friendCount;
    this.updateTimers();
};

// #endregion
// #region | App: player list

API.$on('LOGIN', function () {
    $app.currentInstanceUserList.data = [];
});

API.$on('USER:APPLY', function (ref) {
    // add user ref to playerList, friendList, photonLobby, photonLobbyCurrent
    const playerListRef = $app.lastLocation.playerList.get(ref.id);
    if (playerListRef) {
        // add/remove friends from lastLocation.friendList
        if (
            !$app.lastLocation.friendList.has(ref.id) &&
            $app.store.friend.friends.has(ref.id)
        ) {
            const userMap = {
                displayName: ref.displayName,
                userId: ref.id,
                joinTime: playerListRef.joinTime
            };
            $app.lastLocation.friendList.set(ref.id, userMap);
        }
        if (
            $app.lastLocation.friendList.has(ref.id) &&
            !$app.store.friend.friends.has(ref.id)
        ) {
            $app.lastLocation.friendList.delete(ref.id);
        }
        $app.photonLobby.forEach((ref1, id) => {
            if (
                typeof ref1 !== 'undefined' &&
                ref1.displayName === ref.displayName &&
                ref1 !== ref
            ) {
                $app.photonLobby.set(id, ref);
                if ($app.photonLobbyCurrent.has(id)) {
                    $app.photonLobbyCurrent.set(id, ref);
                }
            }
        });
        $app.getCurrentInstanceUserList();
    }
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

    const playersInInstance = this.lastLocation.playerList;
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
                    let { joinTime } = this.lastLocation.playerList.get(
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

$app.data.currentInstanceWorld = {
    ref: {},
    instance: {},
    isPC: false,
    isQuest: false,
    isIos: false,
    avatarScalingDisabled: false,
    focusViewDisabled: false,
    inCache: false,
    cacheSize: '',
    bundleSizes: [],
    lastUpdated: ''
};

$app.data.currentInstanceWorldDescriptionExpanded = false;
$app.data.currentInstanceLocation = {};

$app.methods.updateCurrentInstanceWorld = function () {
    let L;
    let instanceId = this.lastLocation.location;
    if (this.lastLocation.location === 'traveling') {
        instanceId = this.lastLocationDestination;
    }
    if (!instanceId) {
        this.currentInstanceWorld = {
            ref: {},
            instance: {},
            isPC: false,
            isQuest: false,
            isIos: false,
            avatarScalingDisabled: false,
            focusViewDisabled: false,
            inCache: false,
            cacheSize: '',
            bundleSizes: [],
            lastUpdated: ''
        };
        this.currentInstanceLocation = {};
    } else if (instanceId !== this.currentInstanceLocation.tag) {
        this.currentInstanceWorld = {
            ref: {},
            instance: {},
            isPC: false,
            isQuest: false,
            isIos: false,
            avatarScalingDisabled: false,
            focusViewDisabled: false,
            inCache: false,
            cacheSize: '',
            bundleSizes: [],
            lastUpdated: ''
        };
        L = parseLocation(instanceId);
        this.currentInstanceLocation = L;
        worldRequest
            .getWorld({
                worldId: L.worldId
            })
            .then((args) => {
                this.currentInstanceWorld.ref = args.ref;
                let { isPC, isQuest, isIos } = getAvailablePlatforms(
                    args.ref.unityPackages
                );
                this.currentInstanceWorld.isPC = isPC;
                this.currentInstanceWorld.isQuest = isQuest;
                this.currentInstanceWorld.isIos = isIos;
                this.currentInstanceWorld.avatarScalingDisabled =
                    args.ref?.tags.includes('feature_avatar_scaling_disabled');
                this.currentInstanceWorld.focusViewDisabled =
                    args.ref?.tags.includes('feature_focus_view_disabled');
                checkVRChatCache(args.ref).then((cacheInfo) => {
                    if (cacheInfo.Item1 > 0) {
                        this.currentInstanceWorld.inCache = true;
                        this.currentInstanceWorld.cacheSize = `${(
                            cacheInfo.Item1 / 1048576
                        ).toFixed(2)} MB`;
                    }
                });
                getBundleDateSize(args.ref).then((bundleSizes) => {
                    this.currentInstanceWorld.bundleSizes = bundleSizes;
                });
                return args;
            });
    } else {
        worldRequest
            .getCachedWorld({
                worldId: this.currentInstanceLocation.worldId
            })
            .then((args) => {
                this.currentInstanceWorld.ref = args.ref;
                const { isPC, isQuest, isIos } = getAvailablePlatforms(
                    args.ref.unityPackages
                );
                this.currentInstanceWorld.isPC = isPC;
                this.currentInstanceWorld.isQuest = isQuest;
                this.currentInstanceWorld.isIos = isIos;
                checkVRChatCache(args.ref).then((cacheInfo) => {
                    if (cacheInfo.Item1 > 0) {
                        this.currentInstanceWorld.inCache = true;
                        this.currentInstanceWorld.cacheSize = `${(
                            cacheInfo.Item1 / 1048576
                        ).toFixed(2)} MB`;
                    }
                });
            });
    }
    if (isRealInstance(instanceId)) {
        const ref = API.cachedInstances.get(instanceId);
        if (typeof ref !== 'undefined') {
            this.currentInstanceWorld.instance = ref;
        } else {
            L = parseLocation(instanceId);
            if (L.isRealInstance) {
                instanceRequest
                    .getInstance({
                        worldId: L.worldId,
                        instanceId: L.instanceId
                    })
                    .then((args) => {
                        this.currentInstanceWorld.instance = args.ref;
                    });
            }
        }
    }
};

$app.methods.updateTimers = function () {
    for (let $timer of $timers) {
        $timer.update();
    }
};

$app.methods.lookupAvatars = async function (type, search) {
    const avatars = new Map();
    if (type === 'search') {
        try {
            const response = await webApiService.execute({
                url: `${
                    this.store.avatarProvider.avatarRemoteDatabaseProvider
                }?${type}=${encodeURIComponent(search)}&n=5000`,
                method: 'GET',
                headers: {
                    Referer: 'https://vrcx.app',
                    'VRCX-ID': this.store.vrcxUpdater.vrcxId
                }
            });
            const json = JSON.parse(response.data);
            if (this.store.debug.debugWebRequests) {
                console.log(json, response);
            }
            if (response.status === 200 && typeof json === 'object') {
                json.forEach((avatar) => {
                    if (!avatars.has(avatar.Id)) {
                        const ref = {
                            authorId: '',
                            authorName: '',
                            name: '',
                            description: '',
                            id: '',
                            imageUrl: '',
                            thumbnailImageUrl: '',
                            created_at: '0001-01-01T00:00:00.0000000Z',
                            updated_at: '0001-01-01T00:00:00.0000000Z',
                            releaseStatus: 'public',
                            ...avatar
                        };
                        avatars.set(ref.id, ref);
                    }
                });
            } else {
                throw new Error(`Error: ${response.data}`);
            }
        } catch (err) {
            const msg = `Avatar search failed for ${search} with ${this.store.avatarProvider.avatarRemoteDatabaseProvider}\n${err}`;
            console.error(msg);
            this.$message({
                message: msg,
                type: 'error'
            });
        }
    } else if (type === 'authorId') {
        const length =
            this.store.avatarProvider.avatarRemoteDatabaseProviderList.length;
        for (let i = 0; i < length; ++i) {
            const url =
                this.store.avatarProvider.avatarRemoteDatabaseProviderList[i];
            const avatarArray = await this.lookupAvatarsByAuthor(url, search);
            avatarArray.forEach((avatar) => {
                if (!avatars.has(avatar.id)) {
                    avatars.set(avatar.id, avatar);
                }
            });
        }
    }
    return avatars;
};

$app.methods.lookupAvatarByImageFileId = async function (authorId, fileId) {
    const length =
        this.store.avatarProvider.avatarRemoteDatabaseProviderList.length;
    for (let i = 0; i < length; ++i) {
        const url =
            this.store.avatarProvider.avatarRemoteDatabaseProviderList[i];
        const avatarArray = await this.lookupAvatarsByAuthor(url, authorId);
        for (let avatar of avatarArray) {
            if (extractFileId(avatar.imageUrl) === fileId) {
                return avatar.id;
            }
        }
    }
    return null;
};

$app.methods.lookupAvatarsByAuthor = async function (url, authorId) {
    const avatars = [];
    if (!url) {
        return avatars;
    }
    try {
        const response = await webApiService.execute({
            url: `${url}?authorId=${encodeURIComponent(authorId)}`,
            method: 'GET',
            headers: {
                Referer: 'https://vrcx.app',
                'VRCX-ID': this.store.vrcxUpdater.vrcxId
            }
        });
        const json = JSON.parse(response.data);
        if (this.store.debug.debugWebRequests) {
            console.log(json, response);
        }
        if (response.status === 200 && typeof json === 'object') {
            json.forEach((avatar) => {
                const ref = {
                    authorId: '',
                    authorName: '',
                    name: '',
                    description: '',
                    id: '',
                    imageUrl: '',
                    thumbnailImageUrl: '',
                    created_at: '0001-01-01T00:00:00.0000000Z',
                    updated_at: '0001-01-01T00:00:00.0000000Z',
                    releaseStatus: 'public',
                    ...avatar
                };
                avatars.push(ref);
            });
        } else {
            throw new Error(`Error: ${response.data}`);
        }
    } catch (err) {
        const msg = `Avatar lookup failed for ${authorId} with ${url}\n${err}`;
        console.error(msg);
        this.$message({
            message: msg,
            type: 'error'
        });
    }
    return avatars;
};

$app.methods.sortUserDialogAvatars = function (array) {
    const D = this.store.user.userDialog;
    if (D.avatarSorting === 'update') {
        array.sort(compareByUpdatedAt);
    } else {
        array.sort(compareByName);
    }
    D.avatars = array;
};

$app.methods.refreshUserDialogAvatars = function (fileId) {
    const D = this.store.user.userDialog;
    if (D.isAvatarsLoading) {
        return;
    }
    D.isAvatarsLoading = true;
    if (fileId) {
        D.loading = true;
    }
    D.avatarSorting = 'update';
    D.avatarReleaseStatus = 'all';
    const params = {
        n: 50,
        offset: 0,
        sort: 'updated',
        order: 'descending',
        releaseStatus: 'all',
        user: 'me'
    };
    for (const ref of API.cachedAvatars.values()) {
        if (ref.authorId === D.id) {
            API.cachedAvatars.delete(ref.id);
        }
    }
    const map = new Map();
    API.bulk({
        fn: avatarRequest.getAvatars,
        N: -1,
        params,
        handle: (args) => {
            for (let json of args.json) {
                const $ref = API.cachedAvatars.get(json.id);
                if (typeof $ref !== 'undefined') {
                    map.set($ref.id, $ref);
                }
            }
        },
        done: () => {
            const array = Array.from(map.values());
            this.sortUserDialogAvatars(array);
            D.isAvatarsLoading = false;
            if (fileId) {
                D.loading = false;
                for (const ref of array) {
                    if (extractFileId(ref.imageUrl) === fileId) {
                        this.store.avatar.showAvatarDialog(ref.id);
                        return;
                    }
                }
                this.$message({
                    message: 'Own avatar not found',
                    type: 'error'
                });
            }
        }
    });
};

$app.methods.refreshUserDialogTreeData = function () {
    const D = this.store.user.userDialog;
    if (D.id === API.currentUser.id) {
        const treeData = {
            ...API.currentUser,
            ...D.ref
        };
        D.treeData = buildTreeData(treeData);
        return;
    }
    D.treeData = buildTreeData(D.ref);
};

// #endregion
// #region | App: World Dialog

API.$on('WORLD', function (args) {
    let { ref } = args;
    const D = $app.store.world.worldDialog;
    if (D.visible === false || D.id !== ref.id) {
        return;
    }
    D.ref = ref;
    D.avatarScalingDisabled = ref.tags?.includes(
        'feature_avatar_scaling_disabled'
    );
    D.focusViewDisabled = ref.tags?.includes('feature_focus_view_disabled');
    $app.applyWorldDialogInstances();
    for (let room of D.rooms) {
        if (isRealInstance(room.tag)) {
            instanceRequest.getInstance({
                worldId: D.id,
                instanceId: room.id
            });
        }
    }
    if (D.bundleSizes.length === 0) {
        getBundleDateSize(ref).then((bundleSizes) => {
            D.bundleSizes = bundleSizes;
        });
    }
});

API.$on('FAVORITE', function (args) {
    let { ref } = args;
    const D = $app.store.world.worldDialog;
    if (D.visible === false || ref.$isDeleted || ref.favoriteId !== D.id) {
        return;
    }
    D.isFavorite = true;
});

API.$on('FAVORITE:@DELETE', function (args) {
    const D = $app.store.world.worldDialog;
    if (D.visible === false || D.id !== args.ref.favoriteId) {
        return;
    }
    D.isFavorite = $app.store.favorite.localWorldFavoritesList.includes(D.id);
});

$app.methods.applyWorldDialogInstances = function () {
    let ref;
    let instance;
    const D = this.store.world.worldDialog;
    if (!D.visible) {
        return;
    }
    const instances = {};
    if (D.ref.instances) {
        for (instance of D.ref.instances) {
            // instance = [ instanceId, occupants ]
            const instanceId = instance[0];
            instances[instanceId] = {
                id: instanceId,
                tag: `${D.id}:${instanceId}`,
                $location: {},
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
        }
    }
    const { instanceId, shortName } = D.$location;
    if (instanceId && typeof instances[instanceId] === 'undefined') {
        instances[instanceId] = {
            id: instanceId,
            tag: `${D.id}:${instanceId}`,
            $location: {},
            friendCount: 0,
            users: [],
            shortName,
            ref: {}
        };
    }
    const cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
    const lastLocation$ = cachedCurrentUser.$location;
    const playersInInstance = this.lastLocation.playerList;
    if (lastLocation$.worldId === D.id && playersInInstance.size > 0) {
        // pull instance json from cache
        const friendsInInstance = this.lastLocation.friendList;
        instance = {
            id: lastLocation$.instanceId,
            tag: lastLocation$.tag,
            $location: {},
            friendCount: friendsInInstance.size,
            users: [],
            shortName: '',
            ref: {}
        };
        instances[instance.id] = instance;
        for (const friend of friendsInInstance.values()) {
            // if friend isn't in instance add them
            const addUser = !instance.users.some(function (user) {
                return friend.userId === user.id;
            });
            if (addUser) {
                ref = API.cachedUsers.get(friend.userId);
                if (typeof ref !== 'undefined') {
                    instance.users.push(ref);
                }
            }
        }
    }
    for (const friend of this.store.friend.friends.values()) {
        const { ref } = friend;
        if (
            typeof ref === 'undefined' ||
            typeof ref.$location === 'undefined' ||
            ref.$location.worldId !== D.id ||
            (ref.$location.instanceId === lastLocation$.instanceId &&
                playersInInstance.size > 0 &&
                ref.location !== 'traveling')
        ) {
            continue;
        }
        if (ref.location === this.lastLocation.location) {
            // don't add friends to currentUser gameLog instance (except when traveling)
            continue;
        }
        const { instanceId } = ref.$location;
        instance = instances[instanceId];
        if (typeof instance === 'undefined') {
            instance = {
                id: instanceId,
                tag: `${D.id}:${instanceId}`,
                $location: {},
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[instanceId] = instance;
        }
        instance.users.push(ref);
    }
    ref = API.cachedUsers.get(API.currentUser.id);
    if (typeof ref !== 'undefined' && ref.$location.worldId === D.id) {
        const { instanceId } = ref.$location;
        instance = instances[instanceId];
        if (typeof instance === 'undefined') {
            instance = {
                id: instanceId,
                tag: `${D.id}:${instanceId}`,
                $location: {},
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[instanceId] = instance;
        }
        instance.users.push(ref); // add self
    }
    const rooms = [];
    for (instance of Object.values(instances)) {
        // due to references on callback of API.getUser()
        // this should be block scope variable
        const L = parseLocation(`${D.id}:${instance.id}`);
        instance.location = L.tag;
        if (!L.shortName) {
            L.shortName = instance.shortName;
        }
        instance.$location = L;
        if (L.userId) {
            ref = API.cachedUsers.get(L.userId);
            if (typeof ref === 'undefined') {
                userRequest
                    .getUser({
                        userId: L.userId
                    })
                    .then((args) => {
                        Vue.set(L, 'user', args.ref);
                        return args;
                    });
            } else {
                L.user = ref;
            }
        }
        if (instance.friendCount === 0) {
            instance.friendCount = instance.users.length;
        }
        if (this.store.appearanceSettings.instanceUsersSortAlphabetical) {
            instance.users.sort(compareByDisplayName);
        } else {
            instance.users.sort(compareByLocationAt);
        }
        rooms.push(instance);
    }
    // get instance from cache
    for (const room of rooms) {
        ref = API.cachedInstances.get(room.tag);
        if (typeof ref !== 'undefined') {
            room.ref = ref;
        }
    }
    rooms.sort(function (a, b) {
        // sort selected and current instance to top
        if (
            b.location === D.$location.tag ||
            b.location === lastLocation$.tag
        ) {
            // sort selected instance above current instance
            if (a.location === D.$location.tag) {
                return -1;
            }
            return 1;
        }
        if (
            a.location === D.$location.tag ||
            a.location === lastLocation$.tag
        ) {
            // sort selected instance above current instance
            if (b.location === D.$location.tag) {
                return 1;
            }
            return -1;
        }
        // sort by number of users when no friends in instance
        if (a.users.length === 0 && b.users.length === 0) {
            if (a.ref?.userCount < b.ref?.userCount) {
                return 1;
            }
            return -1;
        }
        // sort by number of friends in instance
        if (a.users.length < b.users.length) {
            return 1;
        }
        return -1;
    });
    D.rooms = rooms;
    this.updateTimers();
};

$app.methods.applyGroupDialogInstances = function (inputInstances) {
    let ref;
    let instance;
    const D = this.store.group.groupDialog;
    if (!D.visible) {
        return;
    }
    const instances = {};
    for (instance of D.instances) {
        instances[instance.tag] = {
            ...instance,
            friendCount: 0,
            users: []
        };
    }
    if (typeof inputInstances !== 'undefined') {
        for (instance of inputInstances) {
            instances[instance.location] = {
                id: instance.instanceId,
                tag: instance.location,
                $location: {},
                friendCount: 0,
                users: [],
                shortName: instance.shortName,
                ref: instance
            };
        }
    }
    const cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
    const lastLocation$ = cachedCurrentUser.$location;
    const currentLocation = lastLocation$.tag;
    const playersInInstance = this.lastLocation.playerList;
    if (lastLocation$.groupId === D.id && playersInInstance.size > 0) {
        const friendsInInstance = this.lastLocation.friendList;
        instance = {
            id: lastLocation$.instanceId,
            tag: currentLocation,
            $location: {},
            friendCount: friendsInInstance.size,
            users: [],
            shortName: '',
            ref: {}
        };
        instances[currentLocation] = instance;
        for (const friend of friendsInInstance.values()) {
            // if friend isn't in instance add them
            const addUser = !instance.users.some(function (user) {
                return friend.userId === user.id;
            });
            if (addUser) {
                ref = API.cachedUsers.get(friend.userId);
                if (typeof ref !== 'undefined') {
                    instance.users.push(ref);
                }
            }
        }
    }
    for (const friend of this.store.friend.friends.values()) {
        const { ref } = friend;
        if (
            typeof ref === 'undefined' ||
            typeof ref.$location === 'undefined' ||
            ref.$location.groupId !== D.id ||
            (ref.$location.instanceId === lastLocation$.instanceId &&
                playersInInstance.size > 0 &&
                ref.location !== 'traveling')
        ) {
            continue;
        }
        if (ref.location === this.lastLocation.location) {
            // don't add friends to currentUser gameLog instance (except when traveling)
            continue;
        }
        const { instanceId, tag } = ref.$location;
        instance = instances[tag];
        if (typeof instance === 'undefined') {
            instance = {
                id: instanceId,
                tag,
                $location: {},
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[tag] = instance;
        }
        instance.users.push(ref);
    }
    ref = API.cachedUsers.get(API.currentUser.id);
    if (typeof ref !== 'undefined' && ref.$location.groupId === D.id) {
        const { instanceId, tag } = ref.$location;
        instance = instances[tag];
        if (typeof instance === 'undefined') {
            instance = {
                id: instanceId,
                tag,
                $location: {},
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[tag] = instance;
        }
        instance.users.push(ref); // add self
    }
    const rooms = [];
    for (instance of Object.values(instances)) {
        // due to references on callback of API.getUser()
        // this should be block scope variable
        const L = parseLocation(instance.tag);
        instance.location = instance.tag;
        instance.$location = L;
        if (instance.friendCount === 0) {
            instance.friendCount = instance.users.length;
        }
        if (this.store.appearanceSettings.instanceUsersSortAlphabetical) {
            instance.users.sort(compareByDisplayName);
        } else {
            instance.users.sort(compareByLocationAt);
        }
        rooms.push(instance);
    }
    // get instance
    for (const room of rooms) {
        ref = API.cachedInstances.get(room.tag);
        if (typeof ref !== 'undefined') {
            room.ref = ref;
        } else if (isRealInstance(room.tag)) {
            instanceRequest.getInstance({
                worldId: room.$location.worldId,
                instanceId: room.$location.instanceId
            });
        }
    }
    rooms.sort(function (a, b) {
        // sort current instance to top
        if (b.location === currentLocation) {
            return 1;
        }
        if (a.location === currentLocation) {
            return -1;
        }
        // sort by number of users when no friends in instance
        if (a.users.length === 0 && b.users.length === 0) {
            if (a.ref?.userCount < b.ref?.userCount) {
                return 1;
            }
            return -1;
        }
        // sort by number of friends in instance
        if (a.users.length < b.users.length) {
            return 1;
        }
        return -1;
    });
    D.instances = rooms;
    this.updateTimers();
};

$app.methods.worldDialogCommand = function (command) {
    const D = this.store.world.worldDialog;
    if (D.visible === false) {
        return;
    }
    switch (command) {
        case 'New Instance and Self Invite':
            this.newInstanceSelfInvite(D.id);
            break;
        case 'Rename':
            this.promptRenameWorld(D);
            break;
        case 'Change Description':
            this.promptChangeWorldDescription(D);
            break;
        case 'Change Capacity':
            this.promptChangeWorldCapacity(D);
            break;
        case 'Change Recommended Capacity':
            this.promptChangeWorldRecommendedCapacity(D);
            break;
        case 'Change YouTube Preview':
            this.promptChangeWorldYouTubePreview(D);
            break;
    }
};

$app.methods.newInstanceSelfInvite = function (worldId) {
    this.createNewInstance(worldId).then((args) => {
        const location = args?.json?.location;
        if (!location) {
            this.$message({
                message: 'Failed to create instance',
                type: 'error'
            });
            return;
        }
        // self invite
        const L = parseLocation(location);
        if (!L.isRealInstance) {
            return;
        }
        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId
            })
            .then((args) => {
                this.$message({
                    message: 'Self invite sent',
                    type: 'success'
                });
                return args;
            });
    });
};

// #endregion
// #region | App: Avatar Dialog

API.$on('FAVORITE', function (args) {
    let { ref } = args;
    const D = $app.store.avatar.avatarDialog;
    if (D.visible === false || ref.$isDeleted || ref.favoriteId !== D.id) {
        return;
    }
    D.isFavorite = true;
});

API.$on('FAVORITE:@DELETE', function (args) {
    const D = $app.store.avatar.avatarDialog;
    if (D.visible === false || D.id !== args.ref.favoriteId) {
        return;
    }
    D.isFavorite = false;
});

$app.methods.selectAvatarWithConfirmation = function (id) {
    this.$confirm(`Continue? Select Avatar`, 'Confirm', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'info',
        callback: (action) => {
            if (action !== 'confirm') {
                return;
            }
            $app.selectAvatarWithoutConfirmation(id);
        }
    });
};

$app.methods.selectAvatarWithoutConfirmation = function (id) {
    if (API.currentUser.currentAvatar === id) {
        this.$message({
            message: 'Avatar already selected',
            type: 'info'
        });
        return;
    }
    avatarRequest
        .selectAvatar({
            avatarId: id
        })
        .then((args) => {
            new Noty({
                type: 'success',
                text: 'Avatar changed via launch command'
            }).show();
            return args;
        });
};

$app.methods.checkAvatarCache = function (fileId) {
    let avatarId = '';
    for (let ref of API.cachedAvatars.values()) {
        if (extractFileId(ref.imageUrl) === fileId) {
            avatarId = ref.id;
        }
    }
    return avatarId;
};

$app.methods.checkAvatarCacheRemote = async function (fileId, ownerUserId) {
    if (this.store.advancedSettings.avatarRemoteDatabase) {
        const avatarId = await this.lookupAvatarByImageFileId(
            ownerUserId,
            fileId
        );
        return avatarId;
    }
    return null;
};

$app.methods.showAvatarAuthorDialog = async function (
    refUserId,
    ownerUserId,
    currentAvatarImageUrl
) {
    const fileId = extractFileId(currentAvatarImageUrl);
    if (!fileId) {
        this.$message({
            message: 'Sorry, the author is unknown',
            type: 'error'
        });
    } else if (refUserId === API.currentUser.id) {
        this.store.avatar.showAvatarDialog(API.currentUser.currentAvatar);
    } else {
        let avatarId = this.checkAvatarCache(fileId);
        let avatarInfo;
        if (!avatarId) {
            avatarInfo = await this.getAvatarName(currentAvatarImageUrl);
            if (avatarInfo.ownerId === API.currentUser.id) {
                this.refreshUserDialogAvatars(fileId);
            }
        }
        if (!avatarId) {
            avatarId = await this.checkAvatarCacheRemote(
                fileId,
                avatarInfo.ownerId
            );
        }
        if (!avatarId) {
            if (avatarInfo.ownerId === refUserId) {
                this.$message({
                    message:
                        "It's personal (own) avatar or not found in avatar database",
                    type: 'warning'
                });
            } else {
                this.$message({
                    message: 'Avatar not found in avatar database',
                    type: 'warning'
                });
                this.store.user.showUserDialog(avatarInfo.ownerId);
            }
        }
        if (avatarId) {
            this.store.avatar.showAvatarDialog(avatarId);
        }
    }
};

// #endregion
// #region | App: Favorite Dialog

$app.methods.showFavoriteDialog = function (type, objectId) {
    const D = this.store.favorite.favoriteDialog;
    D.type = type;
    D.objectId = objectId;
    D.visible = true;
    this.store.favorite.updateFavoriteDialog(objectId);
};

API.$on('FAVORITE:ADD', function (args) {
    $app.store.favorite.updateFavoriteDialog(args.params.favoriteId);
});

API.$on('FAVORITE:DELETE', function (args) {
    $app.store.favorite.updateFavoriteDialog(args.params.objectId);
});

// #endregion
// #region | App: New Instance Dialog

$app.data.instanceContentSettings = [
    'emoji',
    'stickers',
    'pedestals',
    'prints',
    'drones'
];

$app.methods.createNewInstance = async function (worldId = '', options) {
    let D = options;

    if (!D) {
        D = {
            loading: false,
            accessType: await configRepository.getString(
                'instanceDialogAccessType',
                'public'
            ),
            region: await configRepository.getString(
                'instanceRegion',
                'US West'
            ),
            worldId: worldId,
            groupId: await configRepository.getString(
                'instanceDialogGroupId',
                ''
            ),
            groupAccessType: await configRepository.getString(
                'instanceDialogGroupAccessType',
                'plus'
            ),
            ageGate: await configRepository.getBool(
                'instanceDialogAgeGate',
                false
            ),
            queueEnabled: await configRepository.getBool(
                'instanceDialogQueueEnabled',
                true
            ),
            contentSettings: this.instanceContentSettings || [],
            selectedContentSettings: JSON.parse(
                await configRepository.getString(
                    'instanceDialogSelectedContentSettings',
                    JSON.stringify(this.instanceContentSettings || [])
                )
            ),
            roleIds: [],
            groupRef: {}
        };
    }

    let type = 'public';
    let canRequestInvite = false;
    switch (D.accessType) {
        case 'friends':
            type = 'friends';
            break;
        case 'friends+':
            type = 'hidden';
            break;
        case 'invite':
            type = 'private';
            break;
        case 'invite+':
            type = 'private';
            canRequestInvite = true;
            break;
        case 'group':
            type = 'group';
            break;
    }
    let region = 'us';
    if (D.region === 'US East') {
        region = 'use';
    } else if (D.region === 'Europe') {
        region = 'eu';
    } else if (D.region === 'Japan') {
        region = 'jp';
    }
    const contentSettings = {};
    for (let setting of D.contentSettings) {
        contentSettings[setting] = D.selectedContentSettings.includes(setting);
    }
    const params = {
        type,
        canRequestInvite,
        worldId: D.worldId,
        ownerId: API.currentUser.id,
        region,
        contentSettings
    };
    if (type === 'group') {
        params.groupAccessType = D.groupAccessType;
        params.ownerId = D.groupId;
        params.queueEnabled = D.queueEnabled;
        if (D.groupAccessType === 'members') {
            params.roleIds = D.roleIds;
        }
    }
    if (
        D.ageGate &&
        type === 'group' &&
        hasGroupPermission(D.groupRef, 'group-instance-age-gated-create')
    ) {
        params.ageGate = true;
    }
    try {
        const args = await instanceRequest.createInstance(params);
        return args;
    } catch (err) {
        console.error(err);
        return null;
    }
};

// #endregion
// #region | App: Launch Options Dialog

$app.data.isLaunchOptionsDialogVisible = false;

$app.methods.showLaunchOptions = function () {
    this.isLaunchOptionsDialogVisible = true;
};

// #endregion
// #region | App: Launch Dialog

$app.data.launchDialogData = {
    visible: false,
    loading: false,
    tag: '',
    shortName: ''
};

$app.methods.showLaunchDialog = async function (tag, shortName) {
    this.launchDialogData = {
        visible: true,
        // flag, use for trigger adjustDialogZ
        loading: true,
        tag,
        shortName
    };
    this.$nextTick(() => (this.launchDialogData.loading = false));
};

$app.methods.launchGame = async function (location, shortName, desktopMode) {
    const L = parseLocation(location);
    const args = [];
    if (
        shortName &&
        L.instanceType !== 'public' &&
        L.groupAccessType !== 'public'
    ) {
        args.push(
            `vrchat://launch?ref=vrcx.app&id=${location}&shortName=${shortName}`
        );
    } else {
        // fetch shortName
        let newShortName = '';
        const response = await instanceRequest.getInstanceShortName({
            worldId: L.worldId,
            instanceId: L.instanceId
        });
        if (response.json) {
            if (response.json.shortName) {
                newShortName = response.json.shortName;
            } else {
                newShortName = response.json.secureName;
            }
        }
        if (newShortName) {
            args.push(
                `vrchat://launch?ref=vrcx.app&id=${location}&shortName=${newShortName}`
            );
        } else {
            args.push(`vrchat://launch?ref=vrcx.app&id=${location}`);
        }
    }

    const launchArguments = await configRepository.getString('launchArguments');

    const vrcLaunchPathOverride = await configRepository.getString(
        'vrcLaunchPathOverride'
    );

    if (launchArguments) {
        args.push(launchArguments);
    }
    if (desktopMode) {
        args.push('--no-vr');
    }
    if (vrcLaunchPathOverride && !LINUX) {
        AppApi.StartGameFromPath(vrcLaunchPathOverride, args.join(' ')).then(
            (result) => {
                if (!result) {
                    this.$message({
                        message:
                            'Failed to launch VRChat, invalid custom path set',
                        type: 'error'
                    });
                } else {
                    this.$message({
                        message: 'VRChat launched',
                        type: 'success'
                    });
                }
            }
        );
    } else {
        AppApi.StartGame(args.join(' ')).then((result) => {
            if (!result) {
                this.$message({
                    message:
                        'Failed to find VRChat, set a custom path in launch options',
                    type: 'error'
                });
            } else {
                this.$message({
                    message: 'VRChat launched',
                    type: 'success'
                });
            }
        });
    }
    console.log('Launch Game', args.join(' '), desktopMode);
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

// #endregion
// #region | App: VRCPlus Icons

API.$on('LOGIN', function () {
    $app.VRCPlusIconsTable = [];
});

$app.methods.refreshVRCPlusIconsTable = function () {
    this.galleryDialogIconsLoading = true;
    const params = {
        n: 100,
        tag: 'icon'
    };
    vrcPlusIconRequest.getFileList(params);
};

API.$on('FILES:LIST', function (args) {
    if (args.params.tag === 'icon') {
        $app.VRCPlusIconsTable = args.json.reverse();
        $app.galleryDialogIconsLoading = false;
    }
});

API.$on('VRCPLUSICON:ADD', function (args) {
    if (Object.keys($app.VRCPlusIconsTable).length !== 0) {
        $app.VRCPlusIconsTable.unshift(args.json);
    }
});

$app.data.uploadImage = '';

$app.methods.inviteImageUpload = function (e) {
    const files = e.target.files || e.dataTransfer.files;
    if (!files.length) {
        return;
    }
    if (files[0].size >= 100000000) {
        // 100MB
        $app.$message({
            message: $t('message.file.too_large'),
            type: 'error'
        });
        this.clearInviteImageUpload();
        return;
    }
    if (!files[0].type.match(/image.*/)) {
        $app.$message({
            message: $t('message.file.not_image'),
            type: 'error'
        });
        this.clearInviteImageUpload();
        return;
    }
    const r = new FileReader();
    r.onload = function () {
        $app.uploadImage = btoa(r.result);
    };
    r.readAsBinaryString(files[0]);
};

$app.methods.clearInviteImageUpload = function () {
    const buttonList = document.querySelectorAll('.inviteImageUploadButton');
    buttonList.forEach((button) => (button.value = ''));
    this.uploadImage = '';
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
// #region | App: Invite Messages

API.$on('LOGIN', function () {
    $app.inviteMessageTable.data = [];
    $app.inviteResponseMessageTable.data = [];
    $app.inviteRequestMessageTable.data = [];
    $app.inviteRequestResponseMessageTable.data = [];
    $app.inviteMessageTable.visible = false;
    $app.inviteResponseMessageTable.visible = false;
    $app.inviteRequestMessageTable.visible = false;
    $app.inviteRequestResponseMessageTable.visible = false;
});

// temp, invites.pug
API.refreshInviteMessageTableData =
    inviteMessagesRequest.refreshInviteMessageTableData;

API.$on('INVITE:MESSAGE', function (args) {
    $app.inviteMessageTable.data = args.json;
});

API.$on('INVITE:RESPONSE', function (args) {
    $app.inviteResponseMessageTable.data = args.json;
});

API.$on('INVITE:REQUEST', function (args) {
    $app.inviteRequestMessageTable.data = args.json;
});

API.$on('INVITE:REQUESTRESPONSE', function (args) {
    $app.inviteRequestResponseMessageTable.data = args.json;
});

// #endregion
// #region | App: Edit Invite Message Dialog

$app.data.editInviteMessageDialog = {
    visible: false,
    inviteMessage: {},
    messageType: '',
    newMessage: ''
};

$app.methods.showEditInviteMessageDialog = function (
    messageType,
    inviteMessage
) {
    const D = this.editInviteMessageDialog;
    D.newMessage = inviteMessage.message;
    D.visible = true;
    D.inviteMessage = inviteMessage;
    D.messageType = messageType;
};

// #endregion
// #region | App: Friends List

$app.data.friendsListSearch = '';
// $app.data.friendsListSelectAllCheckbox = false;

// $app.methods.showBulkUnfriendAllConfirm = function () {
//     this.$confirm(
//         `Are you sure you want to delete all your friends?
//         This can negatively affect your trust rank,
//         This action cannot be undone.`,
//         'Delete all friends?',
//         {
//             confirmButtonText: 'Confirm',
//             cancelButtonText: 'Cancel',
//             type: 'info',
//             callback: (action) => {
//                 if (action === 'confirm') {
//                     this.bulkUnfriendAll();
//                 }
//             }
//         }
//     );
// };

// $app.methods.bulkUnfriendAll = function () {
//     for (var ctx of this.friendsListTable.data) {
//         API.deleteFriend({
//             userId: ctx.id
//         });
//     }
// };

$app.methods.getAllUserStats = async function () {
    let ref;
    let item;
    const userIds = [];
    const displayNames = [];
    for (const ctx of this.store.friend.friends.values()) {
        userIds.push(ctx.id);
        if (ctx.ref?.displayName) {
            displayNames.push(ctx.ref.displayName);
        }
    }

    const data = await database.getAllUserStats(userIds, displayNames);
    const friendListMap = new Map();
    for (item of data) {
        if (!item.userId) {
            // find userId from previous data with matching displayName
            for (ref of data) {
                if (ref.displayName === item.displayName && ref.userId) {
                    item.userId = ref.userId;
                }
            }
            // if still no userId, find userId from friends list
            if (!item.userId) {
                for (ref of this.store.friend.friends.values()) {
                    if (
                        ref?.ref?.id &&
                        ref.ref.displayName === item.displayName
                    ) {
                        item.userId = ref.id;
                    }
                }
            }
            // if still no userId, skip
            if (!item.userId) {
                continue;
            }
        }

        const friend = friendListMap.get(item.userId);
        if (!friend) {
            friendListMap.set(item.userId, item);
            continue;
        }
        if (Date.parse(item.lastSeen) > Date.parse(friend.lastSeen)) {
            friend.lastSeen = item.lastSeen;
        }
        friend.timeSpent += item.timeSpent;
        friend.joinCount += item.joinCount;
        friend.displayName = item.displayName;
        friendListMap.set(item.userId, friend);
    }
    for (item of friendListMap.values()) {
        ref = this.store.friend.friends.get(item.userId);
        if (ref?.ref) {
            ref.ref.$joinCount = item.joinCount;
            ref.ref.$lastSeen = item.lastSeen;
            ref.ref.$timeSpent = item.timeSpent;
        }
    }
};

$app.methods.getUserStats = async function (ctx) {
    const ref = await database.getUserStats(ctx);
    ctx.$joinCount = ref.joinCount;
    ctx.$lastSeen = ref.lastSeen;
    ctx.$timeSpent = ref.timeSpent;
};

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

// todo: userdialog
$app.data.previousImagesDialogVisible = false;
$app.data.previousImagesTable = [];

API.$on('LOGIN', function () {
    $app.previousImagesTable = [];
});

// Avatar names

API.cachedAvatarNames = new Map();

$app.methods.getAvatarName = async function (imageUrl) {
    const fileId = extractFileId(imageUrl);
    if (!fileId) {
        return {
            ownerId: '',
            avatarName: '-'
        };
    }
    if (API.cachedAvatarNames.has(fileId)) {
        return API.cachedAvatarNames.get(fileId);
    }
    const args = await imageRequest.getAvatarImages({ fileId });
    return storeAvatarImage(args);
};

// VRChat Config JSON

$app.data.isVRChatConfigDialogVisible = false;

$app.methods.showVRChatConfig = async function () {
    this.isVRChatConfigDialogVisible = true;
    if (!this.VRChatUsedCacheSize) {
        this.getVRChatCacheSize();
    }
};

// Auto Launch Shortcuts

// $app.methods.openShortcutFolder = function () {
//     AppApi.OpenShortcutFolder();
// };

// Screenshot Helper

$app.methods.processScreenshot = async function (path) {
    let newPath = path;
    if (this.store.advancedSettings.screenshotHelper) {
        const location = parseLocation(this.lastLocation.location);
        const metadata = {
            application: 'VRCX',
            version: 1,
            author: {
                id: API.currentUser.id,
                displayName: API.currentUser.displayName
            },
            world: {
                name: this.lastLocation.name,
                id: location.worldId,
                instanceId: this.lastLocation.location
            },
            players: []
        };
        for (let user of this.lastLocation.playerList.values()) {
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

$app.methods.checkIfGameCrashed = function () {
    if (!this.store.advancedSettings.relaunchVRChatAfterCrash) {
        return;
    }
    let { location } = this.lastLocation;
    AppApi.VrcClosedGracefully().then((result) => {
        if (result || !isRealInstance(location)) {
            return;
        }
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
    this.queueGameLogNoty(entry);
    this.addGameLog(entry);
    this.launchGame(location, '', this.isGameNoVR);
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

// Parse User URL

$app.methods.parseUserUrl = function (user) {
    const url = new URL(user);
    const urlPath = url.pathname;
    if (urlPath.substring(5, 11) === '/user/') {
        const userId = urlPath.substring(11);
        return userId;
    }
    return void 0;
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
// #region | Gallery

$app.data.galleryDialog = {};
$app.data.galleryDialogVisible = false;
$app.data.galleryDialogGalleryLoading = false;
$app.data.galleryDialogIconsLoading = false;
$app.data.galleryDialogEmojisLoading = false;
$app.data.galleryDialogStickersLoading = false;
$app.data.galleryDialogPrintsLoading = false;

API.$on('LOGIN', function () {
    $app.galleryTable = [];
});

$app.methods.showGalleryDialog = function (pageNum) {
    this.galleryDialogVisible = true;
    this.refreshGalleryTable();
    this.refreshVRCPlusIconsTable();
    this.refreshEmojiTable();
    this.refreshStickerTable();
    this.refreshPrintTable();
    workerTimers.setTimeout(() => this.setGalleryTab(pageNum), 100);
};

$app.methods.setGalleryTab = function (pageNum) {
    if (
        typeof pageNum !== 'undefined' &&
        typeof this.$refs.galleryTabs !== 'undefined'
    ) {
        this.$refs.galleryTabs.setCurrentName(`${pageNum}`);
    }
};

$app.methods.refreshGalleryTable = function () {
    this.galleryDialogGalleryLoading = true;
    const params = {
        n: 100,
        tag: 'gallery'
    };
    vrcPlusIconRequest.getFileList(params);
};

API.$on('FILES:LIST', function (args) {
    if (args.params.tag === 'gallery') {
        $app.galleryTable = args.json.reverse();
        $app.galleryDialogGalleryLoading = false;
    }
});

API.$on('GALLERYIMAGE:ADD', function (args) {
    if (Object.keys($app.galleryTable).length !== 0) {
        $app.galleryTable.unshift(args.json);
    }
});

// #endregion
// #region | Sticker
API.$on('LOGIN', function () {
    $app.stickerTable = [];
});

$app.methods.refreshStickerTable = function () {
    this.galleryDialogStickersLoading = true;
    const params = {
        n: 100,
        tag: 'sticker'
    };
    vrcPlusIconRequest.getFileList(params);
};

API.$on('FILES:LIST', function (args) {
    if (args.params.tag === 'sticker') {
        $app.stickerTable = args.json.reverse();
        $app.galleryDialogStickersLoading = false;
    }
});

$app.methods.displayStickerUpload = function () {
    document.getElementById('StickerUploadButton').click();
};

API.$on('STICKER:ADD', function (args) {
    if (Object.keys($app.stickerTable).length !== 0) {
        $app.stickerTable.unshift(args.json);
    }
});

$app.data.stickersCache = [];

$app.methods.trySaveStickerToFile = async function (displayName, fileId) {
    if ($app.stickersCache.includes(fileId)) return;
    $app.stickersCache.push(fileId);
    if ($app.stickersCache.size > 100) {
        $app.stickersCache.shift();
    }
    const args = await API.call(`file/${fileId}`);
    const imageUrl = args.versions[1].file.url;
    const createdAt = args.versions[0].created_at;
    const monthFolder = createdAt.slice(0, 7);
    const fileNameDate = createdAt
        .replace(/:/g, '-')
        .replace(/T/g, '_')
        .replace(/Z/g, '');
    const fileName = `${displayName}_${fileNameDate}_${fileId}.png`;
    const filePath = await AppApi.SaveStickerToFile(
        imageUrl,
        this.ugcFolderPath,
        monthFolder,
        fileName
    );
    if (filePath) {
        console.log(`Sticker saved to file: ${monthFolder}\\${fileName}`);
    }
};

// #endregion
// #region | Prints
// todo: move to settings.vue
$app.methods.cropPrintsChanged = function () {
    if (!this.store.advancedSettings.cropInstancePrints) return;
    this.$confirm(
        $t(
            'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old'
        ),
        {
            confirmButtonText: $t(
                'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old_confirm'
            ),
            cancelButtonText: $t(
                'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old_cancel'
            ),
            type: 'info',
            showInput: false,
            callback: async (action) => {
                if (action === 'confirm') {
                    const msgBox = this.$message({
                        message: 'Batch print cropping in progress...',
                        type: 'warning',
                        duration: 0
                    });
                    try {
                        await AppApi.CropAllPrints(this.ugcFolderPath);
                        this.$message({
                            message: 'Batch print cropping complete',
                            type: 'success'
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Batch print cropping failed: ${err}`,
                            type: 'error'
                        });
                    } finally {
                        msgBox.close();
                    }
                }
            }
        }
    );
};

API.$on('LOGIN', function () {
    $app.printTable = [];
});

$app.methods.refreshPrintTable = function () {
    this.galleryDialogPrintsLoading = true;
    const params = {
        n: 100
    };
    vrcPlusImageRequest.getPrints(params);
};

API.$on('PRINT:LIST', function (args) {
    $app.printTable = args.json;
    $app.galleryDialogPrintsLoading = false;
});

$app.data.printUploadNote = '';
$app.data.printCropBorder = true;

$app.data.printCache = [];
$app.data.printQueue = [];
$app.data.printQueueWorker = undefined;

$app.methods.queueSavePrintToFile = function (printId) {
    if (this.printCache.includes(printId)) {
        return;
    }
    this.printCache.push(printId);
    if (this.printCache.length > 100) {
        this.printCache.shift();
    }

    this.printQueue.push(printId);

    if (!this.printQueueWorker) {
        this.printQueueWorker = workerTimers.setInterval(() => {
            const printId = this.printQueue.shift();
            if (printId) {
                this.trySavePrintToFile(printId);
            }
        }, 2_500);
    }
};

$app.methods.trySavePrintToFile = async function (printId) {
    const args = await vrcPlusImageRequest.getPrint({ printId });
    const imageUrl = args.json?.files?.image;
    if (!imageUrl) {
        console.error('Print image URL is missing', args);
        return;
    }
    const print = args.json;
    const createdAt = getPrintLocalDate(print);
    try {
        const owner = await userRequest.getCachedUser({
            userId: print.ownerId
        });
        console.log(
            `Print spawned by ${owner?.json?.displayName} id:${print.id} note:${print.note} authorName:${print.authorName} at:${new Date().toISOString()}`
        );
    } catch (err) {
        console.error(err);
    }
    const monthFolder = createdAt.toISOString().slice(0, 7);
    const fileName = getPrintFileName(print);
    const filePath = await AppApi.SavePrintToFile(
        imageUrl,
        this.ugcFolderPath,
        monthFolder,
        fileName
    );
    if (filePath) {
        console.log(`Print saved to file: ${monthFolder}\\${fileName}`);
        if (this.store.advancedSettings.cropInstancePrints) {
            if (!(await AppApi.CropPrintImage(filePath))) {
                console.error('Failed to crop print image');
            }
        }
    }

    if (this.printQueue.length === 0) {
        workerTimers.clearInterval(this.printQueueWorker);
        this.printQueueWorker = undefined;
    }
};

// #endregion
// #region | Emoji

API.$on('LOGIN', function () {
    $app.emojiTable = [];
});

$app.methods.refreshEmojiTable = function () {
    this.galleryDialogEmojisLoading = true;
    const params = {
        n: 100,
        tag: 'emoji'
    };
    vrcPlusIconRequest.getFileList(params);
};

API.$on('FILES:LIST', function (args) {
    if (args.params.tag === 'emoji') {
        $app.emojiTable = args.json.reverse();
        $app.galleryDialogEmojisLoading = false;
    }
});

API.$on('EMOJI:ADD', function (args) {
    if (Object.keys($app.emojiTable).length !== 0) {
        $app.emojiTable.unshift(args.json);
    }
});

// #endregion
// #region Misc

$app.methods.checkCanInvite = function (location) {
    const L = parseLocation(location);
    const instance = API.cachedInstances.get(location);
    if (instance?.closedAt) {
        return false;
    }
    if (
        L.accessType === 'public' ||
        L.accessType === 'group' ||
        L.userId === API.currentUser.id
    ) {
        return true;
    }
    if (L.accessType === 'invite' || L.accessType === 'friends') {
        return false;
    }
    if (this.lastLocation.location === location) {
        return true;
    }
    return false;
};

$app.methods.checkCanInviteSelf = function (location) {
    const L = parseLocation(location);
    const instance = API.cachedInstances.get(location);
    if (instance?.closedAt) {
        return false;
    }
    if (L.userId === API.currentUser.id) {
        return true;
    }
    if (
        L.accessType === 'friends' &&
        !this.store.friend.friends.has(L.userId)
    ) {
        return false;
    }
    return true;
};

//
// $app.methods.userImageFull = function (user) {
//     if (
//         this.store.appearanceSettings.displayVRCPlusIconsAsAvatar &&
//         user.userIcon
//     ) {
//         return user.userIcon;
//     }
//     if (user.profilePicOverride) {
//         return user.profilePicOverride;
//     }
//     return user.currentAvatarImageUrl;
// };

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
            !this.lastLocation.playerList.has(ref.id) &&
            id !== API.currentUser.id
        ) {
            API.cachedUsers.delete(id);
        }
    });
    API.cachedWorlds.forEach((ref, id) => {
        if (
            !$app.store.favorite.cachedFavoritesByObjectId.has(id) &&
            ref.authorId !== API.currentUser.id &&
            !$app.store.favorite.localWorldFavoritesList.includes(id)
        ) {
            API.cachedWorlds.delete(id);
        }
    });
    API.cachedAvatars.forEach((ref, id) => {
        if (
            !$app.store.favorite.cachedFavoritesByObjectId.has(id) &&
            ref.authorId !== API.currentUser.id &&
            !this.store.favorite.localAvatarFavoritesList.includes(id) &&
            !$app.store.avatar.avatarHistory.has(id)
        ) {
            API.cachedAvatars.delete(id);
        }
    });
    API.cachedGroups.forEach((ref, id) => {
        if (!API.currentUserGroups.has(id)) {
            API.cachedGroups.delete(id);
        }
    });
    API.cachedInstances.forEach((ref, id) => {
        // delete instances over an hour old
        if (Date.parse(ref.$fetchedAt) < Date.now() - 3600000) {
            API.cachedInstances.delete(id);
        }
    });
    API.cachedAvatarNames = new Map();
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
            this.queueGameLogNoty(entry);
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
            this.queueGameLogNoty(entry);
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
            this.showGroupDialog(commandArg);
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
                this.selectAvatarWithConfirmation(avatarId);
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

$app.methods.toggleAllowBooping = function () {
    userRequest
        .saveCurrentUser({
            isBoopingEnabled: !API.currentUser.isBoopingEnabled
        })
        .then((args) => {
            return args;
        });
};

// #endregion
// #region | App: Previous Instances Info Dialog

$app.data.previousInstancesInfoDialogVisible = false;
$app.data.previousInstancesInfoDialogInstanceId = '';

$app.methods.showPreviousInstancesInfoDialog = function (instanceId) {
    this.previousInstancesInfoDialogVisible = true;
    this.previousInstancesInfoDialogInstanceId = instanceId;
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
    this.loginForm.endpoint = '';
    this.loginForm.websocket = '';
};

$app.methods.userColourInit = async function () {
    let dictObject = await AppApi.GetColourBulk(
        Array.from(API.cachedUsers.keys())
    );
    if (LINUX) {
        dictObject = Object.fromEntries(dictObject);
    }
    for (let [userId, hue] of Object.entries(dictObject)) {
        const ref = API.cachedUsers.get(userId);
        if (typeof ref !== 'undefined') {
            ref.$userColour = HueToHex(hue);
        }
    }
};

$app.methods.onPlayerTraveling = function (ref) {
    if (
        !this.isGameRunning ||
        !this.lastLocation.location ||
        this.lastLocation.location !== ref.travelingToLocation ||
        ref.id === API.currentUser.id ||
        this.lastLocation.playerList.has(ref.id)
    ) {
        return;
    }

    const onPlayerJoining = {
        created_at: new Date(ref.created_at).toJSON(),
        userId: ref.id,
        displayName: ref.displayName,
        type: 'OnPlayerJoining'
    };
    this.queueFeedNoty(onPlayerJoining);
};

$app.methods.updateCurrentUserLocation = function () {
    const ref = API.cachedUsers.get(API.currentUser.id);
    if (typeof ref === 'undefined') {
        return;
    }

    // update cached user with both gameLog and API locations
    let currentLocation = API.currentUser.$locationTag;
    const L = parseLocation(currentLocation);
    if (L.isTraveling) {
        currentLocation = API.currentUser.$travelingToLocation;
    }
    ref.location = API.currentUser.$locationTag;
    ref.travelingToLocation = API.currentUser.$travelingToLocation;

    if (
        this.isGameRunning &&
        !this.store.advancedSettings.gameLogDisabled &&
        this.lastLocation.location !== ''
    ) {
        // use gameLog instead of API when game is running
        currentLocation = this.lastLocation.location;
        if (this.lastLocation.location === 'traveling') {
            currentLocation = this.lastLocationDestination;
        }
        ref.location = this.lastLocation.location;
        ref.travelingToLocation = this.lastLocationDestination;
    }

    ref.$online_for = API.currentUser.$online_for;
    ref.$offline_for = API.currentUser.$offline_for;
    ref.$location = parseLocation(currentLocation);
    if (!this.isGameRunning || this.store.advancedSettings.gameLogDisabled) {
        ref.$location_at = API.currentUser.$location_at;
        ref.$travelingToTime = API.currentUser.$travelingToTime;
        this.applyUserDialogLocation();
        this.applyWorldDialogInstances();
        this.applyGroupDialogInstances();
    } else {
        ref.$location_at = this.lastLocation.date;
        ref.$travelingToTime = this.lastLocationDestinationTime;
        API.currentUser.$travelingToTime = this.lastLocationDestinationTime;
    }
};

$app.methods.setCurrentUserLocation = async function (
    location,
    travelingToLocation
) {
    API.currentUser.$location_at = Date.now();
    API.currentUser.$travelingToTime = Date.now();
    API.currentUser.$locationTag = location;
    API.currentUser.$travelingToLocation = travelingToLocation;
    this.updateCurrentUserLocation();

    // janky gameLog support for Quest
    if (this.isGameRunning) {
        // with the current state of things, lets not run this if we don't need to
        return;
    }
    let lastLocation = '';
    for (let i = this.gameLogSessionTable.length - 1; i > -1; i--) {
        const item = this.gameLogSessionTable[i];
        if (item.type === 'Location') {
            lastLocation = item.location;
            break;
        }
    }
    if (lastLocation === location) {
        return;
    }
    this.lastLocationDestination = '';
    this.lastLocationDestinationTime = 0;

    if (isRealInstance(location)) {
        const dt = new Date().toJSON();
        const L = parseLocation(location);

        this.lastLocation.location = location;
        this.lastLocation.date = dt;

        const entry = {
            created_at: dt,
            type: 'Location',
            location,
            worldId: L.worldId,
            worldName: await getWorldName(L.worldId),
            groupName: await getGroupName(L.groupId),
            time: 0
        };
        database.addGamelogLocationToDatabase(entry);
        this.queueGameLogNoty(entry);
        this.addGameLog(entry);
        this.addInstanceJoinHistory(location, dt);

        this.applyUserDialogLocation();
        this.applyWorldDialogInstances();
        this.applyGroupDialogInstances();
    } else {
        this.lastLocation.location = '';
        this.lastLocation.date = '';
    }
};

$app.methods.addAvatarWearTime = function (avatarId) {
    if (!API.currentUser.$previousAvatarSwapTime || !avatarId) {
        return;
    }
    const timeSpent = Date.now() - API.currentUser.$previousAvatarSwapTime;
    database.addAvatarTimeSpent(avatarId, timeSpent);
};

$app.methods.promptClearAvatarHistory = function () {
    this.$confirm('Continue? Clear Avatar History', 'Confirm', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'info',
        callback: (action) => {
            if (action === 'confirm') {
                this.clearAvatarHistory();
            }
        }
    });
};

$app.methods.clearAvatarHistory = function () {
    this.store.avatar.avatarHistory = new Set();
    this.store.avatar.avatarHistoryArray = [];
    database.clearAvatarHistory();
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

// user generated content
$app.data.ugcFolderPath = await configRepository.getString(
    'VRCX_userGeneratedContentPath',
    ''
);

$app.data.folderSelectorDialogVisible = false;

$app.methods.setUGCFolderPath = async function (path) {
    await configRepository.setString('VRCX_userGeneratedContentPath', path);
    this.ugcFolderPath = path;
};

$app.methods.resetUGCFolder = function () {
    this.setUGCFolderPath('');
};

$app.methods.openUGCFolder = async function () {
    if (LINUX && this.ugcFolderPath == null) {
        this.resetUGCFolder();
    }
    await AppApi.OpenUGCPhotosFolder(this.ugcFolderPath);
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
    const path = await this.folderSelectorDialog(this.ugcFolderPath);
    await this.setUGCFolderPath(path);
};

// #endregion
// #region | App: local world favorites

API.$on('WORLD', function (args) {
    if ($app.store.favorite.localWorldFavoritesList.includes(args.ref.id)) {
        // update db cache
        database.addWorldToCache(args.ref);
    }
});

API.$on('LOGIN', function () {
    $app.store.favorite.getLocalWorldFavorites();
});

// #endregion
// #region | App: Local Avatar Favorites

API.$on('AVATAR', function (args) {
    if ($app.store.favorite.localAvatarFavoritesList.includes(args.ref.id)) {
        for (
            let i = 0;
            i < $app.store.favorite.localAvatarFavoriteGroups.length;
            ++i
        ) {
            const groupName = $app.store.favorite.localAvatarFavoriteGroups[i];
            if (!$app.store.favorite.localAvatarFavorites[groupName]) {
                continue;
            }
            for (
                let j = 0;
                j < $app.store.favorite.localAvatarFavorites[groupName].length;
                ++j
            ) {
                const ref =
                    $app.store.favorite.localAvatarFavorites[groupName][j];
                if (ref.id === args.ref.id) {
                    $app.store.favorite.localAvatarFavorites[groupName][j] =
                        args.ref;
                }
            }
        }

        // update db cache
        database.addAvatarToCache(args.ref);
    }
});

API.$on('LOGIN', function () {
    $app.store.favorite.localAvatarFavoriteGroups = [];
    $app.store.favorite.localAvatarFavoritesList = [];
    $app.store.favorite.localAvatarFavorites = {};
    workerTimers.setTimeout(
        () => $app.store.favorite.getLocalAvatarFavorites(),
        100
    );
});

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

API.queuedInstances = new Map();

$app.methods.removeAllQueuedInstances = function () {
    API.queuedInstances.forEach((ref) => {
        this.$message({
            message: `Removed instance ${ref.$worldName} from queue`,
            type: 'info'
        });
        ref.$msgBox?.close();
    });
    API.queuedInstances.clear();
};

$app.methods.removeQueuedInstance = function (instanceId) {
    const ref = API.queuedInstances.get(instanceId);
    if (typeof ref !== 'undefined') {
        ref.$msgBox.close();
        API.queuedInstances.delete(instanceId);
    }
};

API.applyQueuedInstance = function (instanceId) {
    API.queuedInstances.forEach((ref) => {
        if (ref.location !== instanceId) {
            $app.$message({
                message: $t('message.instance.removed_form_queue', {
                    worldName: ref.$worldName
                }),
                type: 'info'
            });
            ref.$msgBox?.close();
            API.queuedInstances.delete(ref.location);
        }
    });
    if (!instanceId) {
        return;
    }
    if (!API.queuedInstances.has(instanceId)) {
        const L = parseLocation(instanceId);
        if (L.isRealInstance) {
            instanceRequest
                .getInstance({
                    worldId: L.worldId,
                    instanceId: L.instanceId
                })
                .then((args) => {
                    if (args.json?.queueSize) {
                        $app.instanceQueueUpdate(
                            instanceId,
                            args.json?.queueSize,
                            args.json?.queueSize
                        );
                    }
                });
        }
        $app.instanceQueueUpdate(instanceId, 0, 0);
    }
};

$app.methods.instanceQueueReady = function (instanceId) {
    const ref = API.queuedInstances.get(instanceId);
    if (typeof ref !== 'undefined') {
        ref.$msgBox.close();
        API.queuedInstances.delete(instanceId);
    }
    const L = parseLocation(instanceId);
    const group = API.cachedGroups.get(L.groupId);
    const groupName = group?.name ?? '';
    const worldName = ref?.$worldName ?? '';
    const location = displayLocation(instanceId, worldName, groupName);
    this.$message({
        message: `Instance ready to join ${location}`,
        type: 'success'
    });
    const noty = {
        created_at: new Date().toJSON(),
        type: 'group.queueReady',
        imageUrl: group?.iconUrl,
        message: `Instance ready to join ${location}`,
        location: instanceId,
        groupName,
        worldName
    };
    if (
        this.notificationTable.filters[0].value.length === 0 ||
        this.notificationTable.filters[0].value.includes(noty.type)
    ) {
        this.notifyMenu('notification');
    }
    this.queueNotificationNoty(noty);
    this.notificationTable.data.push(noty);
    this.updateSharedFeed(true);
};

$app.methods.instanceQueueUpdate = async function (
    instanceId,
    position,
    queueSize
) {
    let ref = API.queuedInstances.get(instanceId);
    if (typeof ref === 'undefined') {
        ref = {
            $msgBox: null,
            $groupName: '',
            $worldName: '',
            location: instanceId,
            position: 0,
            queueSize: 0,
            updatedAt: 0
        };
    }
    ref.position = position;
    ref.queueSize = queueSize;
    ref.updatedAt = Date.now();
    if (!ref.$msgBox || ref.$msgBox.closed) {
        ref.$msgBox = this.$message({
            message: '',
            type: 'info',
            duration: 0,
            showClose: true,
            customClass: 'vrc-instance-queue-message'
        });
    }
    if (!ref.$groupName) {
        ref.$groupName = await getGroupName(instanceId);
    }
    if (!ref.$worldName) {
        ref.$worldName = await getWorldName(instanceId);
    }
    const location = displayLocation(
        instanceId,
        ref.$worldName,
        ref.$groupName
    );
    ref.$msgBox.message = `You are in position ${ref.position} of ${ref.queueSize} in the queue for ${location} `;
    API.queuedInstances.set(instanceId, ref);
    // workerTimers.setTimeout(this.instanceQueueTimeout, 3600000);
};

$app.methods.instanceQueueClear = function () {
    // remove all instances from queue
    API.queuedInstances.forEach((ref) => {
        ref.$msgBox.close();
        API.queuedInstances.delete(ref.location);
    });
};

// #endregion

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
// #region | App: Language

$app.data.userDialogWorldSortingOptions = {};
$app.data.userDialogWorldOrderOptions = {};

$app.methods.applyUserDialogSortingStrings = function () {
    this.userDialogWorldSortingOptions = {
        name: {
            name: $t('dialog.user.worlds.sorting.name'),
            value: 'name'
        },
        updated: {
            name: $t('dialog.user.worlds.sorting.updated'),
            value: 'updated'
        },
        created: {
            name: $t('dialog.user.worlds.sorting.created'),
            value: 'created'
        },
        favorites: {
            name: $t('dialog.user.worlds.sorting.favorites'),
            value: 'favorites'
        },
        popularity: {
            name: $t('dialog.user.worlds.sorting.popularity'),
            value: 'popularity'
        }
    };

    this.userDialogWorldOrderOptions = {
        descending: {
            name: $t('dialog.user.worlds.order.descending'),
            value: 'descending'
        },
        ascending: {
            name: $t('dialog.user.worlds.order.ascending'),
            value: 'ascending'
        }
    };
};

$app.data.groupDialogSortingOptions = {};
$app.data.groupDialogFilterOptions = {};

$app.methods.applyGroupDialogSortingStrings = function () {
    this.groupDialogSortingOptions = {
        joinedAtDesc: {
            name: $t('dialog.group.members.sorting.joined_at_desc'),
            value: 'joinedAt:desc'
        },
        joinedAtAsc: {
            name: $t('dialog.group.members.sorting.joined_at_asc'),
            value: 'joinedAt:asc'
        },
        userId: {
            name: $t('dialog.group.members.sorting.user_id'),
            value: ''
        }
    };

    this.groupDialogFilterOptions = {
        everyone: {
            name: $t('dialog.group.members.filters.everyone'),
            id: null
        },
        usersWithNoRole: {
            name: $t('dialog.group.members.filters.users_with_no_role'),
            id: ''
        }
    };
};

$app.methods.applyLanguageStrings = function () {
    // repply sorting strings
    this.applyUserDialogSortingStrings();
    this.applyGroupDialogSortingStrings();
    this.store.user.userDialog.worldSorting =
        this.userDialogWorldSortingOptions.updated;
    this.store.user.userDialog.worldOrder =
        this.userDialogWorldOrderOptions.descending;
    this.store.user.userDialog.groupSorting =
        userDialogGroupSortingOptions.alphabetical;

    this.store.group.groupDialog.memberFilter =
        this.groupDialogFilterOptions.everyone;
    this.store.group.groupDialog.memberSortOrder =
        this.groupDialogSortingOptions.joinedAtDesc;
};

$app.methods.changeAppLanguage = function (language) {
    this.store.appearanceSettings.setAppLanguage(language);
    this.applyLanguageStrings();
    this.updateVRConfigVars();
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
// #region | Open common folders

// $app.methods.openVrcxAppDataFolder = function () {
//     AppApi.OpenVrcxAppDataFolder().then((result) => {
//         if (result) {
//             this.$message({
//                 message: 'Folder opened',
//                 type: 'success'
//             });
//         } else {
//             this.$message({
//                 message: "Folder dosn't exist",
//                 type: 'error'
//             });
//         }
//     });
// };
//
// $app.methods.openVrcAppDataFolder = function () {
//     AppApi.OpenVrcAppDataFolder().then((result) => {
//         if (result) {
//             this.$message({
//                 message: 'Folder opened',
//                 type: 'success'
//             });
//         } else {
//             this.$message({
//                 message: "Folder dosn't exist",
//                 type: 'error'
//             });
//         }
//     });
// };

// $app.methods.openVrcPhotosFolder = function () {
//     AppApi.OpenVrcPhotosFolder().then((result) => {
//         if (result) {
//             this.$message({
//                 message: 'Folder opened',
//                 type: 'success'
//             });
//         } else {
//             this.$message({
//                 message: "Folder dosn't exist",
//                 type: 'error'
//             });
//         }
//     });
// };
//
// $app.methods.openVrcScreenshotsFolder = function () {
//     AppApi.OpenVrcScreenshotsFolder().then((result) => {
//         if (result) {
//             this.$message({
//                 message: 'Folder opened',
//                 type: 'success'
//             });
//         } else {
//             this.$message({
//                 message: "Folder dosn't exist",
//                 type: 'error'
//             });
//         }
//     });
// };
//
// $app.methods.openCrashVrcCrashDumps = function () {
//     AppApi.OpenCrashVrcCrashDumps().then((result) => {
//         if (result) {
//             this.$message({
//                 message: 'Folder opened',
//                 type: 'success'
//             });
//         } else {
//             this.$message({
//                 message: "Folder dosn't exist",
//                 type: 'error'
//             });
//         }
//     });
// };

// #endregion
// #region | Close instance

$app.methods.closeInstance = function (location) {
    this.$confirm(
        'Continue? Close Instance, nobody will be able to join',
        'Confirm',
        {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'warning',
            callback: (action) => {
                if (action !== 'confirm') {
                    return;
                }
                miscRequest.closeInstance({ location, hardClose: false });
            }
        }
    );
};

API.$on('INSTANCE:CLOSE', function (args) {
    if (args.json) {
        $app.$message({
            message: $t('message.instance.closed'),
            type: 'success'
        });

        this.$emit('INSTANCE', {
            json: args.json
        });
    }
});

// #endregion
// #region | Settings: Zoom

$app.data.zoomLevel = ((await AppApi.GetZoom()) + 10) * 10;

$app.methods.getZoomLevel = async function () {
    this.zoomLevel = ((await AppApi.GetZoom()) + 10) * 10;
};

$app.methods.setZoomLevel = function () {
    AppApi.SetZoom(this.zoomLevel / 10 - 10);
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
        menuActiveIndex: this.menuActiveIndex,
        tableData: this.playerModerationTable,
        shiftHeld: this.shiftHeld
    };
};

$app.computed.friendsListTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        confirmDeleteFriend: this.confirmDeleteFriend,
        friendsListSearch: this.friendsListSearch,
        stringComparer: this.stringComparer
    };
};
$app.computed.friendsListTabEvent = function () {
    return {
        'get-all-user-stats': this.getAllUserStats,
        'lookup-user': this.lookupUser,
        'update:friends-list-search': (value) =>
            (this.friendsListSearch = value)
    };
};

$app.computed.sidebarTabBind = function () {
    return {
        isSideBarTabShow: this.isSideBarTabShow,
        quickSearchRemoteMethod: this.quickSearchRemoteMethod,
        quickSearchItems: this.quickSearchItems,
        isGameRunning: this.isGameRunning,
        lastLocation: this.lastLocation,
        lastLocationDestination: this.lastLocationDestination,
        groupInstances: this.groupInstances,
        inGameGroupOrder: this.inGameGroupOrder,
        groupedByGroupKeyFavoriteFriends: this.groupedByGroupKeyFavoriteFriends
    };
};

$app.computed.sidebarTabEvent = function () {
    return {
        'show-group-dialog': this.showGroupDialog,
        'quick-search-change': this.quickSearchChange,
        'direct-access-paste': this.directAccessPaste,
        'confirm-delete-friend': this.confirmDeleteFriend
    };
};

$app.computed.isSideBarTabShow = function () {
    return !(
        this.menuActiveIndex === 'friendList' ||
        this.menuActiveIndex === 'charts'
    );
};

$app.computed.favoritesTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        shiftHeld: this.shiftHeld,
        groupedByGroupKeyFavoriteFriends: this.groupedByGroupKeyFavoriteFriends
    };
};

$app.computed.favoritesTabEvent = function () {
    return {
        'save-sort-favorites-option': this.saveSortFavoritesOption,
        'new-instance-self-invite': this.newInstanceSelfInvite,
        'select-avatar-with-confirmation': this.selectAvatarWithConfirmation,
        'prompt-clear-avatar-history': this.promptClearAvatarHistory
    };
};

$app.computed.chartsTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex
    };
};
$app.computed.chartsTabEvent = function () {
    return {
        'open-previous-instance-info-dialog':
            this.showPreviousInstancesInfoDialog
    };
};

$app.computed.friendLogTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        friendLogTable: this.friendLogTable,
        shiftHeld: this.shiftHeld
    };
};

$app.computed.gameLogTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        gameLogTable: this.gameLogTable,
        shiftHeld: this.shiftHeld,
        gameLogIsFriend: this.gameLogIsFriend,
        gameLogIsFavorite: this.gameLogIsFavorite
    };
};

$app.computed.gameLogTabEvent = function () {
    return {
        gameLogTableLookup: this.gameLogTableLookup,
        lookupUser: this.lookupUser,
        updateGameLogSessionTable: (val) => (this.gameLogSessionTable = val),
        updateSharedFeed: this.updateSharedFeed
    };
};

$app.computed.notificationTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        notificationTable: this.notificationTable,
        shiftHeld: this.shiftHeld,
        lastLocation: this.lastLocation,
        lastLocationDestination: this.lastLocationDestination,
        isGameRunning: this.isGameRunning,
        inviteResponseMessageTable: this.inviteResponseMessageTable,
        uploadImage: this.uploadImage,
        checkCanInvite: this.checkCanInvite,
        inviteRequestResponseMessageTable:
            this.inviteRequestResponseMessageTable
    };
};

$app.computed.notificationTabEvent = function () {
    return {
        inviteImageUpload: this.inviteImageUpload,
        clearInviteImageUpload: this.clearInviteImageUpload
    };
};

$app.computed.feedTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        feedTable: this.feedTable
    };
};

$app.computed.feedTabEvent = function () {
    return {
        feedTableLookup: this.feedTableLookup
    };
};

$app.computed.searchTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        searchText: this.searchText,
        searchUserResults: this.searchUserResults,
        lookupAvatars: this.lookupAvatars,
        moreSearchUser: this.moreSearchUser
    };
};

$app.computed.searchTabEvent = function () {
    return {
        clearSearch: this.clearSearch,
        refreshUserDialogAvatars: this.refreshUserDialogAvatars,
        'update:searchText': (value) => (this.searchText = value)
    };
};

$app.computed.profileTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        inviteMessageTable: this.inviteMessageTable,
        inviteResponseMessageTable: this.inviteResponseMessageTable,
        inviteRequestMessageTable: this.inviteRequestMessageTable,
        inviteRequestResponseMessageTable:
            this.inviteRequestResponseMessageTable,
        pastDisplayNameTable: this.pastDisplayNameTable,
        directAccessWorld: this.directAccessWorld
    };
};

$app.computed.profileTabEvent = function () {
    return {
        logout: this.logout,
        lookupUser: this.lookupUser,
        showEditInviteMessageDialog: this.showEditInviteMessageDialog
    };
};

$app.computed.playerListTabBind = function () {
    return {
        menuActiveIndex: this.menuActiveIndex,
        currentInstanceWorld: this.currentInstanceWorld,
        currentInstanceLocation: this.currentInstanceLocation,
        currentInstanceWorldDescriptionExpanded:
            this.currentInstanceWorldDescriptionExpanded,
        photonLoggingEnabled: this.store.photon.photonLoggingEnabled,
        photonEventTableTypeFilter: this.photonEventTableTypeFilter,
        photonEventTableFilter: this.photonEventTableFilter,
        ipcEnabled: this.ipcEnabled,
        photonEventIcon: this.photonEventIcon,
        photonEventTable: this.photonEventTable,
        photonEventTablePrevious: this.photonEventTablePrevious,
        currentInstanceUserList: this.currentInstanceUserList,
        chatboxUserBlacklist: this.chatboxUserBlacklist,
        lastLocation: this.lastLocation
    };
};

$app.computed.playerListTabEvent = function () {
    return {
        photonEventTableFilterChange: this.photonEventTableFilterChange,
        getCurrentInstanceUserList: this.getCurrentInstanceUserList,
        showUserFromPhotonId: this.showUserFromPhotonId,
        lookupUser: this.lookupUser
    };
};

$app.computed.loginPageBind = function () {
    return {
        loginForm: this.loginForm,
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
        menuActiveIndex: this.menuActiveIndex,
        zoomLevel: this.zoomLevel,
        getTTSVoiceName: this.getTTSVoiceName,
        TTSvoices: this.TTSvoices,
        notificationTTSTest: this.notificationTTSTest,
        ugcFolderPath: this.ugcFolderPath,
        notificationPosition: this.notificationPosition,
        currentlyDroppingFile: this.currentlyDroppingFile,
        fullscreenImageDialog: this.fullscreenImageDialog,
        backupVrcRegistry: this.backupVrcRegistry,
        isTestTTSVisible: this.isTestTTSVisible,
        notifyMenu: this.notifyMenu
    };
};

$app.computed.settingsTabEvent = function () {
    return {
        lookupUser: this.lookupUser,
        changeNotificationPosition: this.changeNotificationPosition,
        saveVRCXWindowOption: this.saveVRCXWindowOption,
        promptProxySettings: this.promptProxySettings,
        saveOpenVROption: this.saveOpenVROption,
        changeAppLanguage: this.changeAppLanguage,
        saveThemeMode: this.saveThemeMode,
        setZoomLevel: this.setZoomLevel,
        saveSortFavoritesOption: this.saveSortFavoritesOption,
        promptMaxTableSizeDialog: this.promptMaxTableSizeDialog,
        saveSidebarSortOrder: this.saveSidebarSortOrder,
        updateTrustColor: this.updateTrustColor,
        promptNotificationTimeout: this.promptNotificationTimeout,
        saveNotificationTTS: this.saveNotificationTTS,
        changeTTSVoice: this.changeTTSVoice,
        testNotificationTTS: this.testNotificationTTS,
        saveDiscordOption: this.saveDiscordOption,
        showVRChatConfig: this.showVRChatConfig,
        enablePrimaryPasswordChange: this.enablePrimaryPasswordChange,
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
        showLaunchOptions: this.showLaunchOptions,
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
