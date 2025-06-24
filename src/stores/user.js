import Noty from 'noty';
import { defineStore } from 'pinia';
import Vue, { computed, reactive } from 'vue';
import {
    avatarRequest,
    groupRequest,
    instanceRequest,
    userRequest
} from '../api';
import { $app, API } from '../app';
import { userNotes } from '../classes/userNotes';
import database from '../service/database';
import {
    arraysMatch,
    buildTreeData,
    compareByDisplayName,
    compareByLocationAt,
    compareByName,
    compareByUpdatedAt,
    convertFileUrlToImageUrl,
    extractFileId,
    getGroupName,
    getUserMemo,
    getWorldName,
    isRealInstance,
    parseLocation,
    removeEmojis,
    replaceBioSymbols
} from '../shared/utils';
import { useAvatarStore } from './avatar';
import { useDebugStore } from './debug';
import { useFavoriteStore } from './favorite';
import { useFriendStore } from './friend';
import { useGameStore } from './game';
import { useInstanceStore } from './instance';
import { useLocationStore } from './location';
import { useNotificationStore } from './notification';
import { useSearchStore } from './search';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';

export const useUserStore = defineStore('User', () => {
    const debugStore = useDebugStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const favoriteStore = useFavoriteStore();
    const locationStore = useLocationStore();
    const instanceStore = useInstanceStore();
    const avatarStore = useAvatarStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const searchStore = useSearchStore();
    const gameStore = useGameStore();
    const notificationStore = useNotificationStore();

    const state = reactive({
        userDialog: {
            visible: false,
            loading: false,
            id: '',
            ref: {},
            friend: {},
            isFriend: false,
            note: '',
            noteSaving: false,
            incomingRequest: false,
            outgoingRequest: false,
            isBlock: false,
            isMute: false,
            isHideAvatar: false,
            isShowAvatar: false,
            isInteractOff: false,
            isMuteChat: false,
            isFavorite: false,

            $location: {},
            $homeLocationName: '',
            users: [],
            instance: {},

            worlds: [],
            avatars: [],
            isWorldsLoading: false,
            isFavoriteWorldsLoading: false,
            isAvatarsLoading: false,
            isGroupsLoading: false,

            worldSorting: {
                name: 'dialog.user.worlds.sorting.updated',
                value: 'updated'
            },
            worldOrder: {
                name: 'dialog.user.worlds.order.descending',
                value: 'descending'
            },
            groupSorting: {
                name: 'dialog.user.groups.sorting.alphabetical',
                value: 'alphabetical'
            },
            avatarSorting: 'update',
            avatarReleaseStatus: 'all',

            treeData: [],
            memo: '',
            $avatarInfo: {
                ownerId: '',
                avatarName: '',
                fileCreatedAt: ''
            },
            representedGroup: {
                bannerUrl: '',
                description: '',
                discriminator: '',
                groupId: '',
                iconUrl: '',
                isRepresenting: false,
                memberCount: 0,
                memberVisibility: '',
                name: '',
                ownerId: '',
                privacy: '',
                shortCode: '',
                $thumbnailUrl: ''
            },
            isRepresentedGroupLoading: false,
            joinCount: 0,
            timeSpent: 0,
            lastSeen: '',
            avatarModeration: 0,
            previousDisplayNames: [],
            dateFriended: '',
            unFriended: false,
            dateFriendedInfo: []
        },
        showUserDialogHistory: new Set(),
        subsetOfLanguages: [],
        languageDialog: {
            visible: false,
            loading: false,
            languageChoice: false,
            languages: []
        },
        pastDisplayNameTable: {
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
        },
        instancePlayerCount: new Map()
    });

    const userDialog = computed({
        get: () => state.userDialog,
        set: (value) => {
            state.userDialog = value;
        }
    });

    const subsetOfLanguages = computed({
        get: () => state.subsetOfLanguages,
        set: (value) => {
            state.subsetOfLanguages = value;
        }
    });

    const languageDialog = computed({
        get: () => state.languageDialog,
        set: (value) => {
            state.languageDialog = value;
        }
    });

    const pastDisplayNameTable = computed({
        get: () => state.pastDisplayNameTable,
        set: (value) => {
            state.pastDisplayNameTable = value;
        }
    });

    const showUserDialogHistory = computed({
        get: () => state.showUserDialogHistory,
        set: (value) => {
            state.showUserDialogHistory = value;
        }
    });

    API.$on('USER', function (args) {
        if (!args?.json?.id) {
            console.error('API.$on(USER) invalid args', args);
            return;
        }
        if (args.json.state === 'online') {
            args.ref = applyUser(args.json); // GPS
            friendStore.updateFriend({
                id: args.json.id,
                state: args.json.state
            }); // online/offline
        } else {
            friendStore.updateFriend({
                id: args.json.id,
                state: args.json.state
            }); // online/offline
            args.ref = applyUser(args.json); // GPS
        }
        // API.$on('USER')
        favoriteStore.applyFavorite('friend', args.ref.id);
        friendStore.userOnFriend(args);
    });

    API.$on('USER:CURRENT', function (args) {
        if (args.ref.pastDisplayNames) {
            state.pastDisplayNameTable.data = args.ref.pastDisplayNames;
        }
    });

    API.$on('CONFIG', function (args) {
        const languages =
            args.ref?.constants?.LANGUAGE?.SPOKEN_LANGUAGE_OPTIONS;
        if (!languages) {
            return;
        }
        state.subsetOfLanguages = languages;
        const data = [];
        for (const key in languages) {
            const value = languages[key];
            data.push({
                key,
                value
            });
        }
        state.languageDialog.languages = data;
    });

    API.$on('USER', function (args) {
        const { ref } = args;
        const D = state.userDialog;
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
            !state.userDialog.visible ||
            state.userDialog.id !== args.ref.id ||
            $app.$refs.userDialogTabs?.currentName !== '5'
        ) {
            return;
        }
        refreshUserDialogTreeData();
    });

    /**
     * aka: `API.applyUserLanguage`
     * @param {object} ref
     */
    function applyUserLanguage(ref) {
        if (!ref || !ref.tags || !state.subsetOfLanguages) {
            return;
        }

        ref.$languages = [];
        const languagePrefix = 'language_';
        const prefixLength = languagePrefix.length;

        for (const tag of ref.tags) {
            if (tag.startsWith(languagePrefix)) {
                const key = tag.substring(prefixLength);
                const value = state.subsetOfLanguages[key];

                if (value !== undefined) {
                    ref.$languages.push({ key, value });
                }
            }
        }
    }

    /**
     * aka: `API.applyPresenceLocation`
     * @param {object} ref
     */
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
        $app.store.location.updateCurrentUserLocation();
    };

    const robotUrl = `${API.endpointDomain}/file/file_0e8c4e32-7444-44ea-ade4-313c010d4bae/1/file`;
    /**
     * aka: `API.applyUser`
     * @param json
     * @returns {any}
     */
    function applyUser(json) {
        let ref = API.cachedUsers.get(json.id);
        if (json.statusDescription) {
            json.statusDescription = replaceBioSymbols(json.statusDescription);
            json.statusDescription = removeEmojis(json.statusDescription);
        }
        if (json.bio) {
            json.bio = replaceBioSymbols(json.bio);
        }
        if (json.note) {
            json.note = replaceBioSymbols(json.note);
        }
        if (json.currentAvatarImageUrl === robotUrl) {
            delete json.currentAvatarImageUrl;
            delete json.currentAvatarThumbnailImageUrl;
        }
        if (typeof ref === 'undefined') {
            ref = {
                ageVerificationStatus: '',
                ageVerified: false,
                allowAvatarCopying: false,
                badges: [],
                bio: '',
                bioLinks: [],
                currentAvatarImageUrl: '',
                currentAvatarTags: [],
                currentAvatarThumbnailImageUrl: '',
                date_joined: '',
                developerType: '',
                displayName: '',
                friendKey: '',
                friendRequestStatus: '',
                id: '',
                instanceId: '',
                isFriend: false,
                last_activity: '',
                last_login: '',
                last_mobile: null,
                last_platform: '',
                location: '',
                platform: '',
                note: null,
                profilePicOverride: '',
                profilePicOverrideThumbnail: '',
                pronouns: '',
                state: '',
                status: '',
                statusDescription: '',
                tags: [],
                travelingToInstance: '',
                travelingToLocation: '',
                travelingToWorld: '',
                userIcon: '',
                worldId: '',
                // only in bulk request
                fallbackAvatar: '',
                // VRCX
                $location: {},
                $location_at: Date.now(),
                $online_for: Date.now(),
                $travelingToTime: Date.now(),
                $offline_for: '',
                $active_for: Date.now(),
                $isVRCPlus: false,
                $isModerator: false,
                $isTroll: false,
                $isProbableTroll: false,
                $trustLevel: 'Visitor',
                $trustClass: 'x-tag-untrusted',
                $userColour: '',
                $trustSortNum: 1,
                $languages: [],
                $joinCount: 0,
                $timeSpent: 0,
                $lastSeen: '',
                $nickName: '',
                $previousLocation: '',
                $customTag: '',
                $customTagColour: '',
                $friendNumber: 0,
                //
                ...json
            };
            if (locationStore.lastLocation.playerList.has(json.id)) {
                // update $location_at from instance join time
                const player = locationStore.lastLocation.playerList.get(
                    json.id
                );
                ref.$location_at = player.joinTime;
                ref.$online_for = player.joinTime;
            }
            if (ref.location === 'traveling') {
                ref.$location = parseLocation(ref.travelingToLocation);
                if (
                    !API.currentTravelers.has(ref.id) &&
                    ref.travelingToLocation
                ) {
                    const travelRef = {
                        created_at: new Date().toJSON(),
                        ...ref
                    };
                    API.currentTravelers.set(ref.id, travelRef);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                    onPlayerTraveling(travelRef);
                }
            } else {
                ref.$location = parseLocation(ref.location);
                if (API.currentTravelers.has(ref.id)) {
                    API.currentTravelers.delete(ref.id);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                }
            }
            if (ref.isFriend || ref.id === API.currentUser.id) {
                // update instancePlayerCount
                let newCount = state.instancePlayerCount.get(ref.location);
                if (typeof newCount === 'undefined') {
                    newCount = 0;
                }
                newCount++;
                state.instancePlayerCount.set(ref.location, newCount);
            }
            if ($app.customUserTags.has(json.id)) {
                const tag = $app.customUserTags.get(json.id);
                ref.$customTag = tag.tag;
                ref.$customTagColour = tag.colour;
            } else if (ref.$customTag) {
                ref.$customTag = '';
                ref.$customTagColour = '';
            }
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            appearanceSettingsStore.applyUserTrustLevel(ref);
            applyUserLanguage(ref);
            API.cachedUsers.set(ref.id, ref);
        } else {
            const props = {};
            for (const prop in ref) {
                if (ref[prop] !== Object(ref[prop])) {
                    props[prop] = true;
                }
            }
            const $ref = { ...ref };
            Object.assign(ref, json);
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            appearanceSettingsStore.applyUserTrustLevel(ref);
            applyUserLanguage(ref);
            // traveling
            if (ref.location === 'traveling') {
                ref.$location = parseLocation(ref.travelingToLocation);
                if (!API.currentTravelers.has(ref.id)) {
                    const travelRef = {
                        created_at: new Date().toJSON(),
                        ...ref
                    };
                    API.currentTravelers.set(ref.id, travelRef);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                    onPlayerTraveling(travelRef);
                }
            } else {
                ref.$location = parseLocation(ref.location);
                if (API.currentTravelers.has(ref.id)) {
                    API.currentTravelers.delete(ref.id);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                }
            }
            for (const prop in ref) {
                if (Array.isArray(ref[prop]) && Array.isArray($ref[prop])) {
                    if (!arraysMatch(ref[prop], $ref[prop])) {
                        props[prop] = true;
                    }
                } else if (ref[prop] !== Object(ref[prop])) {
                    props[prop] = true;
                }
            }
            let has = false;
            for (const prop in props) {
                const asis = $ref[prop];
                const tobe = ref[prop];
                if (asis === tobe) {
                    delete props[prop];
                } else {
                    has = true;
                    props[prop] = [tobe, asis];
                }
            }
            if ($ref.note !== null && $ref.note !== ref.note) {
                userNotes.checkNote(ref.id, ref.note);
            }
            // FIXME
            // if the status is offline, just ignore status and statusDescription only.
            if (has && ref.status !== 'offline' && $ref.status !== 'offline') {
                if (props.location && props.location[0] !== 'traveling') {
                    const ts = Date.now();
                    props.location.push(ts - ref.$location_at);
                    ref.$location_at = ts;
                }
                API.$emit('USER:UPDATE', {
                    ref,
                    props
                });
                if (debugStore.debugUserDiff) {
                    delete props.last_login;
                    delete props.last_activity;
                    if (Object.keys(props).length !== 0) {
                        console.log('>', ref.displayName, props);
                    }
                }
            }
        }
        if (
            ref.$isVRCPlus &&
            ref.badges &&
            ref.badges.every(
                (x) => x.badgeId !== 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa'
            )
        ) {
            // I doubt this will last long
            ref.badges.unshift({
                badgeId: 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa',
                badgeName: 'Supporter',
                badgeDescription: 'Supports VRChat through VRC+',
                badgeImageUrl:
                    'https://assets.vrchat.com/badges/fa/bdgai_8c9cf371-ffd2-4177-9894-1093e2e34bf7.png',
                hidden: true,
                showcased: false
            });
        }
        const friendCtx = friendStore.friends.get(ref.id);
        if (friendCtx) {
            friendCtx.ref = ref;
            friendCtx.name = ref.displayName;
        }
        if (ref.id === API.currentUser.id) {
            if (ref.status) {
                API.currentUser.status = ref.status;
            }
            $app.store.location.updateCurrentUserLocation();
        }
        userApply(ref);
        return ref;
    }

    /**
     * aka: `API.$on('USER:APPLY')`
     */
    function userApply(ref) {
        // add user ref to playerList, friendList, photonLobby, photonLobbyCurrent
        const playerListRef = locationStore.lastLocation.playerList.get(ref.id);
        if (playerListRef) {
            // add/remove friends from lastLocation.friendList
            if (
                !locationStore.lastLocation.friendList.has(ref.id) &&
                friendStore.friends.has(ref.id)
            ) {
                const userMap = {
                    displayName: ref.displayName,
                    userId: ref.id,
                    joinTime: playerListRef.joinTime
                };
                locationStore.lastLocation.friendList.set(ref.id, userMap);
            }
            if (
                locationStore.lastLocation.friendList.has(ref.id) &&
                !friendStore.friends.has(ref.id)
            ) {
                locationStore.lastLocation.friendList.delete(ref.id);
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
    }

    /**
     *
     * @param {string} userId
     */
    function showUserDialog(userId) {
        if (!userId) {
            return;
        }
        const D = state.userDialog;
        D.id = userId;
        D.treeData = [];
        D.memo = '';
        D.note = '';
        D.noteSaving = false;
        getUserMemo(userId).then((memo) => {
            if (memo.userId === userId) {
                D.memo = memo.memo;
                const ref = friendStore.friends.get(userId);
                if (ref) {
                    ref.memo = String(memo.memo || '');
                    if (memo.memo) {
                        ref.$nickName = memo.memo.split('\n')[0];
                    } else {
                        ref.$nickName = '';
                    }
                }
            }
        });
        D.visible = true;
        D.loading = true;
        D.avatars = [];
        D.worlds = [];
        D.instance = {
            id: '',
            tag: '',
            $location: {},
            friendCount: 0,
            users: [],
            shortName: '',
            ref: {}
        };
        D.isRepresentedGroupLoading = true;
        D.representedGroup = {
            bannerUrl: '',
            description: '',
            discriminator: '',
            groupId: '',
            iconUrl: '',
            isRepresenting: false,
            memberCount: 0,
            memberVisibility: '',
            name: '',
            ownerId: '',
            privacy: '',
            shortCode: '',
            $thumbnailUrl: ''
        };
        D.lastSeen = '';
        D.joinCount = 0;
        D.timeSpent = 0;
        D.avatarModeration = 0;
        D.isHideAvatar = false;
        D.isShowAvatar = false;
        D.previousDisplayNames = [];
        D.dateFriended = '';
        D.unFriended = false;
        D.dateFriendedInfo = [];
        if (userId === API.currentUser.id) {
            getWorldName(API.currentUser.homeLocation).then((worldName) => {
                D.$homeLocationName = worldName;
            });
        }
        AppApi.SendIpc('ShowUserDialog', userId);
        userRequest
            .getCachedUser({
                userId
            })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                $app.$message({
                    message: 'Failed to load user',
                    type: 'error'
                });
                throw err;
            })
            .then((args) => {
                if (args.ref.id === D.id) {
                    requestAnimationFrame(() => {
                        D.ref = args.ref;
                        D.friend = friendStore.friends.get(D.id);
                        D.isFriend = Boolean(D.friend);
                        D.note = String(D.ref.note || '');
                        D.incomingRequest = false;
                        D.outgoingRequest = false;
                        D.isBlock = false;
                        D.isMute = false;
                        D.isInteractOff = false;
                        D.isMuteChat = false;
                        for (const ref of $app.store.moderation.cachedPlayerModerations.values()) {
                            if (
                                ref.targetUserId === D.id &&
                                ref.sourceUserId === API.currentUser.id
                            ) {
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
                            }
                        }
                        D.isFavorite =
                            favoriteStore.cachedFavoritesByObjectId.has(D.id);
                        if (D.ref.friendRequestStatus === 'incoming') {
                            D.incomingRequest = true;
                        } else if (D.ref.friendRequestStatus === 'outgoing') {
                            D.outgoingRequest = true;
                        }
                        applyUserDialogLocation(true);

                        if (args.cache) {
                            userRequest.getUser(args.params);
                        }
                        let inCurrentWorld = false;
                        if (
                            locationStore.lastLocation.playerList.has(D.ref.id)
                        ) {
                            inCurrentWorld = true;
                        }
                        if (userId !== API.currentUser.id) {
                            database
                                .getUserStats(D.ref, inCurrentWorld)
                                .then((ref1) => {
                                    if (ref1.userId === D.id) {
                                        D.lastSeen = ref1.lastSeen;
                                        D.joinCount = ref1.joinCount;
                                        D.timeSpent = ref1.timeSpent;
                                    }
                                    const displayNameMap =
                                        ref1.previousDisplayNames;
                                    friendStore.friendLogTable.data.forEach(
                                        (ref2) => {
                                            if (ref2.userId === D.id) {
                                                if (
                                                    ref2.type === 'DisplayName'
                                                ) {
                                                    displayNameMap.set(
                                                        ref2.previousDisplayName,
                                                        ref2.created_at
                                                    );
                                                }
                                                if (!D.dateFriended) {
                                                    if (
                                                        ref2.type === 'Unfriend'
                                                    ) {
                                                        D.unFriended = true;
                                                        if (
                                                            !appearanceSettingsStore.hideUnfriends
                                                        ) {
                                                            D.dateFriended =
                                                                ref2.created_at;
                                                        }
                                                    }
                                                    if (
                                                        ref2.type === 'Friend'
                                                    ) {
                                                        D.unFriended = false;
                                                        D.dateFriended =
                                                            ref2.created_at;
                                                    }
                                                }
                                                if (
                                                    ref2.type === 'Friend' ||
                                                    (ref2.type === 'Unfriend' &&
                                                        !appearanceSettingsStore.hideUnfriends)
                                                ) {
                                                    D.dateFriendedInfo.push(
                                                        ref2
                                                    );
                                                }
                                            }
                                        }
                                    );
                                    const displayNameMapSorted = new Map(
                                        [...displayNameMap.entries()].sort(
                                            (a, b) => b[1] - a[1]
                                        )
                                    );
                                    D.previousDisplayNames = Array.from(
                                        displayNameMapSorted.keys()
                                    );
                                });
                            AppApi.GetVRChatUserModeration(
                                API.currentUser.id,
                                userId
                            ).then((result) => {
                                D.avatarModeration = result;
                                if (result === 4) {
                                    D.isHideAvatar = true;
                                } else if (result === 5) {
                                    D.isShowAvatar = true;
                                }
                            });
                        } else {
                            database
                                .getUserStats(D.ref, inCurrentWorld)
                                .then((ref1) => {
                                    if (ref1.userId === D.id) {
                                        D.lastSeen = ref1.lastSeen;
                                        D.joinCount = ref1.joinCount;
                                        D.timeSpent = ref1.timeSpent;
                                    }
                                });
                        }
                        groupRequest
                            .getRepresentedGroup({ userId })
                            .then((args1) => {
                                D.representedGroup = args1.json;
                                D.representedGroup.$thumbnailUrl =
                                    convertFileUrlToImageUrl(
                                        args1.json.iconUrl
                                    );
                                if (!args1.json || !args1.json.isRepresenting) {
                                    D.isRepresentedGroupLoading = false;
                                }
                            });
                        D.loading = false;
                    });
                }
            });
        state.showUserDialogHistory.delete(userId);
        state.showUserDialogHistory.add(userId);
        searchStore.quickSearchItems = searchStore.quickSearchUserHistory();
    }

    /**
     *
     * @param {object} ref
     */
    function onPlayerTraveling(ref) {
        if (
            !gameStore.isGameRunning ||
            !locationStore.lastLocation.location ||
            locationStore.lastLocation.location !== ref.travelingToLocation ||
            ref.id === API.currentUser.id ||
            locationStore.lastLocation.playerList.has(ref.id)
        ) {
            return;
        }

        const onPlayerJoining = {
            created_at: new Date(ref.created_at).toJSON(),
            userId: ref.id,
            displayName: ref.displayName,
            type: 'OnPlayerJoining'
        };
        notificationStore.queueFeedNoty(onPlayerJoining);
    }

    /**
     *
     * @param {boolean} updateInstanceOccupants
     */
    function applyUserDialogLocation(updateInstanceOccupants) {
        let addUser;
        let friend;
        let ref;
        const D = state.userDialog;
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
        const playersInInstance = locationStore.lastLocation.playerList;
        const cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
        const currentLocation = cachedCurrentUser.$location.tag;
        if (!L.isOffline && currentLocation === L.tag) {
            ref = API.cachedUsers.get(API.currentUser.id);
            if (typeof ref !== 'undefined') {
                users.push(ref); // add self
            }
        }
        // dont use gamelog when using api location
        if (
            locationStore.lastLocation.location === L.tag &&
            playersInInstance.size > 0
        ) {
            const friendsInInstance = locationStore.lastLocation.friendList;
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
            for (friend of friendStore.friends.values()) {
                if (typeof friend.ref === 'undefined') {
                    continue;
                }
                if (
                    friend.ref.location === locationStore.lastLocation.location
                ) {
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
        if (appearanceSettingsStore.instanceUsersSortAlphabetical) {
            users.sort(compareByDisplayName);
        } else {
            users.sort(compareByLocationAt);
        }
        D.users = users;
        if (
            L.worldId &&
            currentLocation === L.tag &&
            playersInInstance.size > 0
        ) {
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
        const instanceRef = instanceStore.cachedInstances.get(L.tag);
        if (typeof instanceRef !== 'undefined') {
            D.instance.ref = instanceRef;
        }
        D.instance.friendCount = friendCount;
        $app.updateTimers();
    }

    function sortUserDialogAvatars(array) {
        const D = state.userDialog;
        if (D.avatarSorting === 'update') {
            array.sort(compareByUpdatedAt);
        } else {
            array.sort(compareByName);
        }
        D.avatars = array;
    }

    function refreshUserDialogAvatars(fileId) {
        const D = state.userDialog;
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
        for (const ref of avatarStore.cachedAvatars.values()) {
            if (ref.authorId === D.id) {
                avatarStore.cachedAvatars.delete(ref.id);
            }
        }
        const map = new Map();
        API.bulk({
            fn: avatarRequest.getAvatars,
            N: -1,
            params,
            handle: (args) => {
                for (const json of args.json) {
                    const $ref = avatarStore.cachedAvatars.get(json.id);
                    if (typeof $ref !== 'undefined') {
                        map.set($ref.id, $ref);
                    }
                }
            },
            done: () => {
                const array = Array.from(map.values());
                sortUserDialogAvatars(array);
                D.isAvatarsLoading = false;
                if (fileId) {
                    D.loading = false;
                    for (const ref of array) {
                        if (extractFileId(ref.imageUrl) === fileId) {
                            avatarStore.showAvatarDialog(ref.id);
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
    }

    function refreshUserDialogTreeData() {
        const D = state.userDialog;
        if (D.id === API.currentUser.id) {
            const treeData = {
                ...API.currentUser,
                ...D.ref
            };
            D.treeData = buildTreeData(treeData);
            return;
        }
        D.treeData = buildTreeData(D.ref);
    }

    async function lookupUser(ref) {
        let ctx;
        if (ref.userId) {
            showUserDialog(ref.userId);
            return;
        }
        if (!ref.displayName || ref.displayName.substring(0, 3) === 'ID:') {
            return;
        }
        for (ctx of API.cachedUsers.values()) {
            if (ctx.displayName === ref.displayName) {
                showUserDialog(ctx.id);
                return;
            }
        }
        searchStore.searchText = ref.displayName;
        await searchStore.searchUserByDisplayName(ref.displayName);
        for (ctx of searchStore.searchUserResults) {
            if (ctx.displayName === ref.displayName) {
                searchStore.searchText = '';
                searchStore.clearSearch();
                showUserDialog(ctx.id);
                return;
            }
        }
        // this.$refs.searchTab.currentName = '0';
        // this.menuActiveIndex = 'search';
    }

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
            let oldCount = state.instancePlayerCount.get(previousLocation);
            if (typeof oldCount !== 'undefined') {
                oldCount--;
                if (oldCount <= 0) {
                    state.instancePlayerCount.delete(previousLocation);
                } else {
                    state.instancePlayerCount.set(previousLocation, oldCount);
                }
            }
            let newCount = state.instancePlayerCount.get(newLocation);
            if (typeof newCount === 'undefined') {
                newCount = 0;
            }
            newCount++;
            state.instancePlayerCount.set(newLocation, newCount);
        }
        if (props.location && ref.id === $app.store.user.userDialog.id) {
            // update user dialog instance occupants
            $app.store.user.applyUserDialogLocation(true);
        }
        if (
            props.location &&
            ref.$location.worldId === $app.store.world.worldDialog.id
        ) {
            $app.store.instance.applyWorldDialogInstances();
        }
        if (
            props.location &&
            ref.$location.groupId === $app.store.group.groupDialog.id
        ) {
            $app.store.instance.applyGroupDialogInstances();
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
                $app.store.feed.addFeed(feed);
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
                currentAvatarThumbnailImageUrl =
                    ref.currentAvatarThumbnailImageUrl;
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
                    avatarInfo = await $app.store.avatar.getAvatarName(
                        currentAvatarImageUrl
                    );
                } catch (err) {
                    console.log(err);
                }
                let previousAvatarInfo = {
                    ownerId: '',
                    avatarName: ''
                };
                try {
                    previousAvatarInfo = await $app.store.avatar.getAvatarName(
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
                $app.store.feed.addFeed(feed);
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
            $app.store.feed.addFeed(feed);
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
            $app.store.feed.addFeed(feed);
            database.addBioToDatabase(feed);
        }
    });

    function updateAutoStateChange() {
        if (
            !generalSettingsStore.autoStateChangeEnabled ||
            !gameStore.isGameRunning ||
            !locationStore.lastLocation.playerList.size ||
            locationStore.lastLocation.location === '' ||
            locationStore.lastLocation.location === 'traveling'
        ) {
            return;
        }

        const $location = parseLocation(locationStore.lastLocation.location);
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
            generalSettingsStore.autoStateChangeInstanceTypes.length > 0 &&
            !generalSettingsStore.autoStateChangeInstanceTypes.includes(
                instanceType
            )
        ) {
            return;
        }

        let withCompany = locationStore.lastLocation.playerList.size > 1;
        if (generalSettingsStore.autoStateChangeNoFriends) {
            withCompany = locationStore.lastLocation.friendList.size >= 1;
        }

        const currentStatus = API.currentUser.status;
        const newStatus = withCompany
            ? generalSettingsStore.autoStateChangeCompanyStatus
            : generalSettingsStore.autoStateChangeAloneStatus;

        if (currentStatus === newStatus) {
            return;
        }

        userRequest
            .saveCurrentUser({
                status: newStatus
            })
            .then(() => {
                const text = `Status automaticly changed to ${newStatus}`;
                if ($app.errorNoty) {
                    $app.errorNoty.close();
                }
                $app.errorNoty = new Noty({
                    type: 'info',
                    text
                });
                $app.errorNoty.show();
                console.log(text);
            });
    }

    return {
        state,
        userDialog,
        subsetOfLanguages,
        languageDialog,
        pastDisplayNameTable,
        showUserDialogHistory,
        applyUserLanguage,
        applyUser,
        showUserDialog,
        applyUserDialogLocation,
        sortUserDialogAvatars,
        refreshUserDialogAvatars,
        refreshUserDialogTreeData,
        lookupUser,
        updateAutoStateChange
    };
});
