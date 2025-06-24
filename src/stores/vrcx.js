import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { $app, API } from '../app';
import configRepository from '../service/config';
import database from '../service/database';
import { refreshCustomCss } from '../shared/utils';
import { useAvatarStore } from './avatar';
import { useDebugStore } from './debug';
import { useFavoriteStore } from './favorite';
import { useFriendStore } from './friend';
import { useGameStore } from './game';
import { useGroupStore } from './group';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useUserStore } from './user';
import { useWorldStore } from './world';

export const useVrcxStore = defineStore('Vrcx', () => {
    const gameStore = useGameStore();
    const debugStore = useDebugStore();
    const locationStore = useLocationStore();
    const notificationStore = useNotificationStore();
    const avatarStore = useAvatarStore();
    const worldStore = useWorldStore();
    const instanceStore = useInstanceStore();
    const friendStore = useFriendStore();
    const favoriteStore = useFavoriteStore();
    const groupStore = useGroupStore();
    const userStore = useUserStore();
    const photonStore = usePhotonStore();

    const state = reactive({
        isRunningUnderWine: false,
        databaseVersion: 0
    });

    // Make sure file drops outside of the screenshot manager don't navigate to the file path dropped.
    // This issue persists on prompts created with prompt(), unfortunately. Not sure how to fix that.
    document.body.addEventListener('drop', function (e) {
        e.preventDefault();
    });

    document.addEventListener('keyup', function (e) {
        if (e.ctrlKey) {
            if (e.key === 'I') {
                showConsole();
            } else if (e.key === 'r') {
                location.reload();
            }
        } else if (e.altKey && e.key === 'R') {
            refreshCustomCss();
        }
    });

    const isRunningUnderWine = computed({
        get: () => state.isRunningUnderWine,
        set: (value) => {
            state.isRunningUnderWine = value;
        }
    });

    async function init() {
        state.databaseVersion = await configRepository.getInt(
            'VRCX_databaseVersion',
            0
        );
        updateDatabaseVersion();
    }

    init();

    async function applyWineEmojis() {
        if (document.contains(document.getElementById('app-emoji-font'))) {
            document.getElementById('app-emoji-font').remove();
        }
        if (gameStore.isRunningUnderWine) {
            const $appEmojiFont = document.createElement('link');
            $appEmojiFont.setAttribute('id', 'app-emoji-font');
            $appEmojiFont.rel = 'stylesheet';
            $appEmojiFont.href = 'emoji.font.css';
            document.head.appendChild($appEmojiFont);
        }
    }

    function showConsole() {
        AppApi.ShowDevTools();
        if (
            $app.debug ||
            debugStore.debugWebRequests ||
            $app.debugWebSocket ||
            $app.debugUserDiff
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
    }

    async function updateDatabaseVersion() {
        const databaseVersion = 12;
        let msgBox;
        if (state.databaseVersion < databaseVersion) {
            if (state.databaseVersion) {
                msgBox = $app.$message({
                    message:
                        'DO NOT CLOSE VRCX, database upgrade in progress...',
                    type: 'warning',
                    duration: 0
                });
            }
            console.log(
                `Updating database from ${state.databaseVersion} to ${databaseVersion}...`
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
                if (state.databaseVersion) {
                    // only display when database exists
                    $app.$message({
                        message: 'Database upgrade complete',
                        type: 'success'
                    });
                }
                state.databaseVersion = databaseVersion;
            } catch (err) {
                console.error(err);
                msgBox?.close();
                $app.$message({
                    message:
                        'Database upgrade failed, check console for details',
                    type: 'error',
                    duration: 120000
                });
                AppApi.ShowDevTools();
            }
        }
    }

    function clearVRCXCache() {
        API.failedGetRequests = new Map();
        API.cachedUsers.forEach((ref, id) => {
            if (
                !friendStore.friends.has(id) &&
                !locationStore.lastLocation.playerList.has(ref.id) &&
                id !== API.currentUser.id
            ) {
                API.cachedUsers.delete(id);
            }
        });
        worldStore.cachedWorlds.forEach((ref, id) => {
            if (
                !favoriteStore.cachedFavoritesByObjectId.has(id) &&
                ref.authorId !== API.currentUser.id &&
                !favoriteStore.localWorldFavoritesList.includes(id)
            ) {
                worldStore.cachedWorlds.delete(id);
            }
        });
        avatarStore.cachedAvatars.forEach((ref, id) => {
            if (
                !favoriteStore.cachedFavoritesByObjectId.has(id) &&
                ref.authorId !== API.currentUser.id &&
                !favoriteStore.localAvatarFavoritesList.includes(id) &&
                !avatarStore.avatarHistory.has(id)
            ) {
                avatarStore.cachedAvatars.delete(id);
            }
        });
        groupStore.cachedGroups.forEach((ref, id) => {
            if (!groupStore.currentUserGroups.has(id)) {
                groupStore.cachedGroups.delete(id);
            }
        });
        instanceStore.cachedInstances.forEach((ref, id) => {
            // delete instances over an hour old
            if (Date.parse(ref.$fetchedAt) < Date.now() - 3600000) {
                instanceStore.cachedInstances.delete(id);
            }
        });
        avatarStore.cachedAvatarNames = new Map();
        userStore.customUserTags = new Map();
        instanceStore.updateInstanceInfo = 0;
    }

    function eventVrcxMessage(data) {
        let entry;
        switch (data.MsgType) {
            case 'CustomTag':
                userStore.addCustomTag(data);
                break;
            case 'ClearCustomTags':
                userStore.customUserTags.forEach((value, key) => {
                    userStore.customUserTags.delete(key);
                    const ref = API.cachedUsers.get(key);
                    if (typeof ref !== 'undefined') {
                        ref.$customTag = '';
                        ref.$customTagColour = '';
                    }
                });
                break;
            case 'Noty':
                if (
                    photonStore.photonLoggingEnabled ||
                    ($app.externalNotifierVersion &&
                        $app.externalNotifierVersion > 21)
                ) {
                    return;
                }
                entry = {
                    created_at: new Date().toJSON(),
                    type: 'Event',
                    data: data.Data
                };
                database.addGamelogEventToDatabase(entry);
                notificationStore.queueGameLogNoty(entry);
                $app.addGameLog(entry);
                break;
            case 'External': {
                const displayName = data.DisplayName ?? '';
                entry = {
                    created_at: new Date().toJSON(),
                    type: 'External',
                    message: data.Data,
                    displayName,
                    userId: data.UserId,
                    location: locationStore.lastLocation.location
                };
                database.addGamelogExternalToDatabase(entry);
                notificationStore.queueGameLogNoty(entry);
                $app.addGameLog(entry);
                break;
            }
            default:
                console.log('VRCXMessage:', data);
                break;
        }
    }

    return {
        state,
        isRunningUnderWine,
        showConsole,
        applyWineEmojis,
        clearVRCXCache,
        eventVrcxMessage
    };
});
