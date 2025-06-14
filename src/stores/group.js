import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { groupRequest, instanceRequest, userRequest } from '../api';
import { $t, API, $app } from '../app';
import configRepository from '../service/config';
import {
    compareByDisplayName,
    compareByLocationAt,
    isRealInstance,
    parseLocation,
    replaceBioSymbols
} from '../shared/utils';
import { useFriendStore } from './friend';
import { useAppearanceSettingsStore } from './settings/appearance';

export const useGroupStore = defineStore('Group', () => {
    const friendStore = useFriendStore();
    const { friends } = storeToRefs(friendStore);
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { instanceUsersSortAlphabetical } = storeToRefs(
        appearanceSettingsStore
    );
    const state = reactive({
        groupDialog: {
            visible: false,
            loading: false,
            isGetGroupDialogGroupLoading: false,
            treeData: [],
            id: '',
            inGroup: false,
            ownerDisplayName: '',
            ref: {},
            announcement: {},
            posts: [],
            postsFiltered: [],
            members: [],
            memberSearch: '',
            memberSearchResults: [],
            instances: [],
            memberRoles: [],
            memberFilter: {
                name: $t('dialog.group.members.filters.everyone'),
                id: null
            },
            memberSortOrder: {
                name: $t('dialog.group.members.sorting.joined_at_desc'),
                value: 'joinedAt:desc'
            },
            postsSearch: '',
            galleries: {}
        },
        currentUserGroups: new Map()
    });

    const groupDialog = computed({
        get: () => state.groupDialog,
        set: (value) => {
            state.groupDialog = value;
        }
    });

    const currentUserGroups = computed({
        get: () => state.currentUserGroups,
        set: (value) => {
            state.currentUserGroups = value;
        }
    });

    function showGroupDialog(groupId) {
        if (!groupId) {
            return;
        }
        const D = state.groupDialog;
        D.visible = true;
        D.loading = true;
        D.id = groupId;
        D.inGroup = false;
        D.ownerDisplayName = '';
        D.treeData = [];
        D.announcement = {};
        D.posts = [];
        D.postsFiltered = [];
        D.instances = [];
        D.memberRoles = [];
        D.memberSearch = '';
        D.memberSearchResults = [];
        D.galleries = {};
        D.members = [];
        D.memberFilter = $app.groupDialogFilterOptions.everyone;
        API.getCachedGroup({
            groupId
        })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                $app.$message({
                    message: 'Failed to load group',
                    type: 'error'
                });
                throw err;
            })
            .then((args) => {
                if (groupId === args.ref.id) {
                    D.loading = false;
                    D.ref = args.ref;
                    D.inGroup = args.ref.membershipStatus === 'member';
                    D.ownerDisplayName = args.ref.ownerId;
                    userRequest
                        .getCachedUser({
                            userId: args.ref.ownerId
                        })
                        .then((args1) => {
                            D.ownerDisplayName = args1.ref.displayName;
                            return args1;
                        });
                    applyGroupDialogInstances();
                    $app.getGroupDialogGroup(groupId);
                }
            });
    }

    /**
     * aka: `API.applyGroup`
     * @param {object} json
     * @returns {object} ref
     */
    function applyGroup(json) {
        let ref = API.cachedGroups.get(json.id);
        json.rules = replaceBioSymbols(json.rules);
        json.name = replaceBioSymbols(json.name);
        json.description = replaceBioSymbols(json.description);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                name: '',
                shortCode: '',
                description: '',
                bannerId: '',
                bannerUrl: '',
                createdAt: '',
                discriminator: '',
                galleries: [],
                iconId: '',
                iconUrl: '',
                isVerified: false,
                joinState: '',
                languages: [],
                links: [],
                memberCount: 0,
                memberCountSyncedAt: '',
                membershipStatus: '',
                onlineMemberCount: 0,
                ownerId: '',
                privacy: '',
                rules: null,
                tags: [],
                // in group
                initialRoleIds: [],
                myMember: {
                    bannedAt: null,
                    groupId: '',
                    has2FA: false,
                    id: '',
                    isRepresenting: false,
                    isSubscribedToAnnouncements: false,
                    joinedAt: '',
                    managerNotes: '',
                    membershipStatus: '',
                    permissions: [],
                    roleIds: [],
                    userId: '',
                    visibility: '',
                    _created_at: '',
                    _id: '',
                    _updated_at: ''
                },
                updatedAt: '',
                // includeRoles: true
                roles: [],
                // group list
                $memberId: '',
                groupId: '',
                isRepresenting: false,
                memberVisibility: false,
                mutualGroup: false,
                // VRCX
                $languages: [],
                ...json
            };
            API.cachedGroups.set(ref.id, ref);
        } else {
            if (state.currentUserGroups.has(ref.id)) {
                // compare group props
                if (
                    ref.ownerId &&
                    json.ownerId &&
                    ref.ownerId !== json.ownerId
                ) {
                    // owner changed
                    groupOwnerChange(json, ref.ownerId, json.ownerId);
                }
                if (ref.name && json.name && ref.name !== json.name) {
                    // name changed
                    groupChange(
                        json,
                        `Name changed from ${ref.name} to ${json.name}`
                    );
                }
                if (ref.myMember?.roleIds && json.myMember?.roleIds) {
                    var oldRoleIds = ref.myMember.roleIds;
                    var newRoleIds = json.myMember.roleIds;
                    if (
                        oldRoleIds.length !== newRoleIds.length ||
                        !oldRoleIds.every(
                            (value, index) => value === newRoleIds[index]
                        )
                    ) {
                        // roleIds changed
                        groupRoleChange(
                            json,
                            ref.roles,
                            json.roles,
                            oldRoleIds,
                            newRoleIds
                        );
                    }
                }
            }
            if (json.myMember) {
                if (typeof json.myMember.roleIds === 'undefined') {
                    // keep roleIds
                    json.myMember.roleIds = ref.myMember.roleIds;
                }
                if (typeof json.myMember.isRepresenting !== 'undefined') {
                    json.myMember.isRepresenting = ref.myMember.isRepresenting;
                }
                Object.assign(ref.myMember, json.myMember);
            }
            Object.assign(ref, json);
        }
        // update myMember without fetching member
        if (typeof json.memberVisibility !== 'undefined') {
            ref.myMember.visibility = json.memberVisibility;
        }
        if (typeof json.isRepresenting !== 'undefined') {
            ref.myMember.isRepresenting = json.isRepresenting;
        }
        if (typeof json.membershipStatus !== 'undefined') {
            ref.myMember.membershipStatus = json.membershipStatus;
        }
        if (typeof json.roleIds !== 'undefined') {
            ref.myMember.roleIds = json.roleIds;
        }
        ref.$url = `https://vrc.group/${ref.shortCode}.${ref.discriminator}`;
        API.applyGroupLanguage(ref);

        const currentUserGroupRef = state.currentUserGroups.get(ref.id);
        if (currentUserGroupRef && currentUserGroupRef !== ref) {
            state.currentUserGroups.set(ref.id, ref);
        }

        return ref;
    }

    /**
     *
     * @param {object} inputInstances
     */
    function applyGroupDialogInstances(inputInstances) {
        let ref;
        let instance;
        const D = state.groupDialog;
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
        const playersInInstance = $app.lastLocation.playerList;
        if (lastLocation$.groupId === D.id && playersInInstance.size > 0) {
            const friendsInInstance = $app.lastLocation.friendList;
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
        for (const friend of friends.value.values()) {
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
            if (ref.location === $app.lastLocation.location) {
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
            if (instanceUsersSortAlphabetical.value) {
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
        $app.updateTimers();
    }

    /**
     *
     * @param {object }ref
     * @param {string} oldUserId
     * @param {string} newUserId
     * @returns {Promise<void>}
     */
    async function groupOwnerChange(ref, oldUserId, newUserId) {
        const oldUser = await userRequest.getCachedUser({
            userId: oldUserId
        });
        const newUser = await userRequest.getCachedUser({
            userId: newUserId
        });
        const oldDisplayName = oldUser?.ref?.displayName;
        const newDisplayName = newUser?.ref?.displayName;

        groupChange(
            ref,
            `Owner changed from ${oldDisplayName} to ${newDisplayName}`
        );
    }

    function groupChange(ref, message) {
        if (!$app.currentUserGroupsInit) {
            return;
        }
        // oh the level of cursed for compibility
        const json = {
            id: Math.random().toString(36),
            type: 'groupChange',
            senderUserId: ref.id,
            senderUsername: ref.name,
            imageUrl: ref.iconUrl,
            details: {
                imageUrl: ref.iconUrl
            },
            message,
            created_at: new Date().toJSON()
        };
        API.$emit('NOTIFICATION', {
            json,
            params: {
                notificationId: json.id
            }
        });

        // delay to wait for json to be assigned to ref
        workerTimers.setTimeout(saveCurrentUserGroups, 100);
    }

    function saveCurrentUserGroups() {
        if (!$app.currentUserGroupsInit) {
            return;
        }
        const groups = [];
        for (const ref of state.currentUserGroups.values()) {
            groups.push({
                id: ref.id,
                name: ref.name,
                ownerId: ref.ownerId,
                iconUrl: ref.iconUrl,
                roles: ref.roles,
                roleIds: ref.myMember?.roleIds
            });
        }
        configRepository.setString(
            `VRCX_currentUserGroups_${API.currentUser.id}`,
            JSON.stringify(groups)
        );
    }

    /**
     *
     * @param {object} ref
     * @param {array} oldRoles
     * @param {array} newRoles
     * @param {array} oldRoleIds
     * @param {array} newRoleIds
     */
    function groupRoleChange(ref, oldRoles, newRoles, oldRoleIds, newRoleIds) {
        // check for removed/added roleIds
        for (const roleId of oldRoleIds) {
            if (!newRoleIds.includes(roleId)) {
                let roleName = '';
                const role = oldRoles.find(
                    (fineRole) => fineRole.id === roleId
                );
                if (role) {
                    roleName = role.name;
                }
                groupChange(ref, `Role ${roleName} removed`);
            }
        }
        for (const roleId of newRoleIds) {
            if (!oldRoleIds.includes(roleId)) {
                let roleName = '';
                const role = newRoles.find(
                    (fineRole) => fineRole.id === roleId
                );
                if (role) {
                    roleName = role.name;
                }
                groupChange(ref, `Role ${roleName} added`);
            }
        }
    }

    /**
     * aka `API.applyPresenceGroups`
     * @param {object} ref
     */
    function applyPresenceGroups(ref) {
        if (!API.currentUserGroupsInit) {
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
            if (!state.currentUserGroups.has(groupId)) {
                onGroupJoined(groupId);
            }
        }
        for (const groupId of state.currentUserGroups.keys()) {
            if (!groups.includes(groupId)) {
                onGroupLeft(groupId);
            }
        }
    }

    /**
     *
     * @param {string} groupId
     */
    function onGroupJoined(groupId) {
        if (!state.currentUserGroups.has(groupId)) {
            state.currentUserGroups.set(groupId, {
                id: groupId,
                name: '',
                iconUrl: ''
            });
            groupRequest
                .getGroup({ groupId, includeRoles: true })
                .then((args) => {
                    applyGroup(args.json); // make sure this runs before saveCurrentUserGroups
                    saveCurrentUserGroups();
                    return args;
                });
        }
    }

    /**
     *
     * @param {string} groupId
     */
    function onGroupLeft(groupId) {
        if (state.groupDialog.visible && state.groupDialog.id === groupId) {
            showGroupDialog(groupId);
        }
        if (state.currentUserGroups.has(groupId)) {
            state.currentUserGroups.delete(groupId);
            API.getCachedGroup({ groupId }).then((args) => {
                groupChange(args.ref, 'Left group');
            });
        }
    }

    return {
        state,
        groupDialog,
        currentUserGroups,
        showGroupDialog,
        applyGroup,
        applyGroupDialogInstances,
        saveCurrentUserGroups,
        applyPresenceGroups
    };
});
