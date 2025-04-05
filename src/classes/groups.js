import * as workerTimers from 'worker-timers';
import configRepository from '../repository/config.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';
import {
    userRequest,
    worldRequest,
    instanceRequest,
    groupRequest
} from './request';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        API.cachedGroups = new Map();
        API.currentUserGroups = new Map();

        API.$on('GROUP', function (args) {
            args.ref = this.applyGroup(args.json);
        });

        API.$on('GROUP', function (args) {
            var { ref } = args;
            var D = $app.groupDialog;
            if (D.visible === false || D.id !== ref.id) {
                return;
            }
            D.inGroup = ref.membershipStatus === 'member';
            D.ref = ref;
        });

        API.$on('GROUP:REPRESENTED', function (args) {
            var json = args.json;
            if (!json.groupId) {
                // no group
                return;
            }
            json.$memberId = json.id;
            json.id = json.groupId;
            this.$emit('GROUP', {
                json,
                params: {
                    groupId: json.groupId,
                    userId: args.params.userId
                }
            });
        });

        API.$on('GROUP:LIST', function (args) {
            for (var json of args.json) {
                json.$memberId = json.id;
                json.id = json.groupId;
                this.$emit('GROUP', {
                    json,
                    params: {
                        groupId: json.id,
                        userId: args.params.userId
                    }
                });
            }
        });

        API.$on('GROUP:MEMBER:PROPS', function (args) {
            if (args.userId !== this.currentUser.id) {
                return;
            }
            var json = args.json;
            json.$memberId = json.id;
            json.id = json.groupId;
            if (
                $app.groupDialog.visible &&
                $app.groupDialog.id === json.groupId
            ) {
                $app.groupDialog.ref.myMember.visibility = json.visibility;
                $app.groupDialog.ref.myMember.isSubscribedToAnnouncements =
                    json.isSubscribedToAnnouncements;
            }
            if (
                $app.userDialog.visible &&
                $app.userDialog.id === this.currentUser.id
            ) {
                $app.getCurrentUserRepresentedGroup();
            }
            this.$emit('GROUP:MEMBER', {
                json,
                params: {
                    groupId: json.groupId
                }
            });
        });

        API.$on('GROUP:MEMBER:PROPS', function (args) {
            if ($app.groupDialog.id === args.json.groupId) {
                for (var i = 0; i < $app.groupDialog.members.length; ++i) {
                    var member = $app.groupDialog.members[i];
                    if (member.userId === args.json.userId) {
                        Object.assign(member, this.applyGroupMember(args.json));
                        break;
                    }
                }
                for (
                    var i = 0;
                    i < $app.groupDialog.memberSearchResults.length;
                    ++i
                ) {
                    var member = $app.groupDialog.memberSearchResults[i];
                    if (member.userId === args.json.userId) {
                        Object.assign(member, this.applyGroupMember(args.json));
                        break;
                    }
                }
            }

            /*
             * // UI Actions & Dialogs        Methods
             * // ===================        ===========
             *
             * Group Dialog
             * ├─ Visibility Settings   ───> setGroupVisibility    ───┐
             * │
             * └─ Subscription Settings ───> setGroupSubscription    ─┤
             * │
             * Group Member Moderation Dialog
             * │
             * └─ (Moderation Actions)  ───> groupMembersSaveNote    ─┤
             * │
             * ├──────   Final Event  ─────> 'GROUP:MEMBER:PROPS'   ─┘
             */

            // The 'GROUP:MEMBER:PROPS' event is triggered by the setGroupVisibility, setGroupSubscription, or groupMembersSaveNote.
            // The first two methods originate from the Group Dialog (visibility/Subscription);
            // Group Member Moderation Dialog is necessarily not visible then.

            // if (
            //     $app.groupMemberModeration.visible &&
            //     $app.groupMemberModeration.id === args.json.groupId
            // ) {
            //     // force redraw table
            //     $app.groupMembersSearch();
            // }
        });

        // API.$on('GROUP:MEMBER:ROLE:CHANGE', function (args) {
        //     if ($app.groupDialog.id === args.params.groupId) {
        //         for (var i = 0; i < $app.groupDialog.members.length; ++i) {
        //             var member = $app.groupDialog.members[i];
        //             if (member.userId === args.params.userId) {
        //                 member.roleIds = args.json;
        //                 break;
        //             }
        //         }
        //         for (
        //             var i = 0;
        //             i < $app.groupDialog.memberSearchResults.length;
        //             ++i
        //         ) {
        //             var member = $app.groupDialog.memberSearchResults[i];
        //             if (member.userId === args.params.userId) {
        //                 member.roleIds = args.json;
        //                 break;
        //             }
        //         }
        //     }

        //     if (
        //         $app.groupMemberModeration.visible &&
        //         $app.groupMemberModeration.id === args.params.groupId
        //     ) {
        //         // force redraw table
        //         $app.groupMembersSearch();
        //     }
        // });

        API.$on('GROUP:PERMISSIONS', function (args) {
            if (args.params.userId !== this.currentUser.id) {
                return;
            }
            var json = args.json;
            for (var groupId in json) {
                var permissions = json[groupId];
                var group = this.cachedGroups.get(groupId);
                if (group) {
                    group.myMember.permissions = permissions;
                }
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getAllGroupPosts = async function (params) {
            var posts = [];
            var offset = 0;
            var n = 100;
            var total = 0;
            do {
                var args = await groupRequest.getGroupPosts({
                    groupId: params.groupId,
                    n,
                    offset
                });
                posts = posts.concat(args.json.posts);
                total = args.json.total;
                offset += n;
            } while (offset < total);
            var returnArgs = {
                posts,
                params
            };
            this.$emit('GROUP:POSTS:ALL', returnArgs);
            return returnArgs;
        };

        API.$on('GROUP:POSTS:ALL', function (args) {
            var D = $app.groupDialog;
            if (D.id === args.params.groupId) {
                for (var post of args.posts) {
                    post.title = $app.replaceBioSymbols(post.title);
                    post.text = $app.replaceBioSymbols(post.text);
                }
                if (args.posts.length > 0) {
                    D.announcement = args.posts[0];
                }
                D.posts = args.posts;
                $app.updateGroupPostSearch();
            }
        });

        API.$on('GROUP:POST', function (args) {
            var D = $app.groupDialog;
            if (D.id !== args.params.groupId) {
                return;
            }

            var newPost = args.json;
            newPost.title = $app.replaceBioSymbols(newPost.title);
            newPost.text = $app.replaceBioSymbols(newPost.text);
            var hasPost = false;
            // update existing post
            for (var post of D.posts) {
                if (post.id === newPost.id) {
                    Object.assign(post, newPost);
                    hasPost = true;
                    break;
                }
            }
            // set or update announcement
            if (newPost.id === D.announcement.id || !D.announcement.id) {
                D.announcement = newPost;
            }
            // add new post
            if (!hasPost) {
                D.posts.unshift(newPost);
            }
            $app.updateGroupPostSearch();
        });

        API.$on('GROUP:MEMBERS', function (args) {
            for (var json of args.json) {
                this.$emit('GROUP:MEMBER', {
                    json,
                    params: {
                        groupId: args.params.groupId
                    }
                });
            }
        });

        API.$on('GROUP:MEMBER', function (args) {
            args.ref = this.applyGroupMember(args.json);
        });

        // API.$on('GROUP:JOINREQUESTS', function (args) {
        //     if ($app.groupMemberModeration.id !== args.params.groupId) {
        //         return;
        //     }

        //     if (!args.params.blocked) {
        //         for (var json of args.json) {
        //             var ref = this.applyGroupMember(json);
        //             $app.groupJoinRequestsModerationTable.data.push(ref);
        //         }
        //     } else {
        //         for (var json of args.json) {
        //             var ref = this.applyGroupMember(json);
        //             $app.groupBlockedModerationTable.data.push(ref);
        //         }
        //     }
        // });

        API.$on('GROUP:USER:INSTANCES', function (args) {
            $app.groupInstances = [];
            for (const json of args.json.instances) {
                if (args.json.fetchedAt) {
                    // tack on fetchedAt
                    json.$fetchedAt = args.json.fetchedAt;
                }
                this.$emit('INSTANCE', {
                    json,
                    params: {
                        fetchedAt: args.json.fetchedAt
                    }
                });
                const ref = this.cachedGroups.get(json.ownerId);
                if (typeof ref === 'undefined') {
                    if ($app.friendLogInitStatus) {
                        groupRequest.getGroup({ groupId: json.ownerId });
                    }
                    return;
                }
                $app.groupInstances.push({
                    group: ref,
                    instance: this.applyInstance(json)
                });
            }
        });

        /**
         * @param {{ groupId: string }} params
         * @return { Promise<{json: any, params}> }
         */
        API.getCachedGroup = function (params) {
            return new Promise((resolve, reject) => {
                var ref = this.cachedGroups.get(params.groupId);
                if (typeof ref === 'undefined') {
                    groupRequest.getGroup(params).catch(reject).then(resolve);
                } else {
                    resolve({
                        cache: true,
                        json: ref,
                        params,
                        ref
                    });
                }
            });
        };

        API.applyGroup = function (json) {
            var ref = this.cachedGroups.get(json.id);
            json.rules = $app.replaceBioSymbols(json.rules);
            json.name = $app.replaceBioSymbols(json.name);
            json.description = $app.replaceBioSymbols(json.description);
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
                this.cachedGroups.set(ref.id, ref);
            } else {
                if (this.currentUserGroups.has(ref.id)) {
                    // compare group props
                    if (
                        ref.ownerId &&
                        json.ownerId &&
                        ref.ownerId !== json.ownerId
                    ) {
                        // owner changed
                        $app.groupOwnerChange(json, ref.ownerId, json.ownerId);
                    }
                    if (ref.name && json.name && ref.name !== json.name) {
                        // name changed
                        $app.groupChange(
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
                            $app.groupRoleChange(
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
            this.applyGroupLanguage(ref);

            var currentUserGroupRef = this.currentUserGroups.get(ref.id);
            if (currentUserGroupRef && currentUserGroupRef !== ref) {
                this.currentUserGroups.set(ref.id, ref);
            }

            return ref;
        };

        API.applyGroupMember = function (json) {
            if (typeof json?.user !== 'undefined') {
                if (json.userId === this.currentUser.id) {
                    json.user = this.currentUser;
                    json.$displayName = this.currentUser.displayName;
                } else {
                    var ref = this.cachedUsers.get(json.user.id);
                    if (typeof ref !== 'undefined') {
                        json.user = ref;
                        json.$displayName = ref.displayName;
                    } else {
                        json.$displayName = json.user?.displayName;
                    }
                }
            }
            // update myMember without fetching member
            if (json.userId === this.currentUser.id) {
                var ref = this.cachedGroups.get(json.groupId);
                if (typeof ref !== 'undefined') {
                    this.$emit('GROUP', {
                        json: {
                            ...ref,
                            memberVisibility: json.visibility,
                            isRepresenting: json.isRepresenting,
                            isSubscribedToAnnouncements:
                                json.isSubscribedToAnnouncements,
                            joinedAt: json.joinedAt,
                            roleIds: json.roleIds,
                            membershipStatus: json.membershipStatus
                        },
                        params: {
                            groupId: json.groupId
                        }
                    });
                }
            }

            return json;
        };

        API.applyGroupLanguage = function (ref) {
            ref.$languages = [];
            var { languages } = ref;
            if (!languages) {
                return;
            }
            for (var language of languages) {
                var value = $app.subsetOfLanguages[language];
                if (typeof value === 'undefined') {
                    continue;
                }
                ref.$languages.push({
                    key: language,
                    value
                });
            }
        };
    }

    _data = {
        currentUserGroupsInit: false,
        groupDialogLastMembers: '',
        groupDialogLastGallery: '',
        groupMembersSearchTimer: null,
        groupMembersSearchPending: false,
        isGroupMembersLoading: false,
        isGroupMembersDone: false,
        isGroupGalleryLoading: false,
        loadMoreGroupMembersParams: {},
        groupMemberModerationTableForceUpdate: 0,
        isGroupLogsExportDialogVisible: false,

        groupDialog: {
            visible: false,
            loading: false,
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
        inviteGroupDialog: {
            visible: false,
            loading: false,
            groupId: '',
            groupName: '',
            userId: '',
            userIds: [],
            userObject: {}
        },
        groupMemberModeration: {
            visible: false,
            loading: false,
            id: '',
            groupRef: {},
            auditLogTypes: [],
            selectedAuditLogTypes: [],
            note: '',
            selectedUsers: new Map(),
            selectedUsersArray: [],
            selectedRoles: [],
            progressCurrent: 0,
            progressTotal: 0,
            selectUserId: ''
        }
        // groupMemberModerationTable: {
        //     data: [],
        //     tableProps: {
        //         stripe: true,
        //         size: 'mini'
        //     },
        //     pageSize: 15,
        //     paginationProps: {
        //         small: true,
        //         layout: 'sizes,prev,pager,next,total',
        //         pageSizes: [10, 15, 25, 50, 100]
        //     }
        // },
        // groupBansModerationTable: {
        //     data: [],
        //     filters: [
        //         {
        //             prop: ['$displayName'],
        //             value: ''
        //         }
        //     ],
        //     tableProps: {
        //         stripe: true,
        //         size: 'mini'
        //     },
        //     pageSize: 15,
        //     paginationProps: {
        //         small: true,
        //         layout: 'sizes,prev,pager,next,total',
        //         pageSizes: [10, 15, 25, 50, 100]
        //     }
        // },
        // groupLogsModerationTable: {
        //     data: [],
        //     filters: [
        //         {
        //             prop: ['description'],
        //             value: ''
        //         }
        //     ],
        //     tableProps: {
        //         stripe: true,
        //         size: 'mini'
        //     },
        //     pageSize: 15,
        //     paginationProps: {
        //         small: true,
        //         layout: 'sizes,prev,pager,next,total',
        //         pageSizes: [10, 15, 25, 50, 100]
        //     }
        // },
        // groupInvitesModerationTable: {
        //     data: [],
        //     tableProps: {
        //         stripe: true,
        //         size: 'mini'
        //     },
        //     pageSize: 15,
        //     paginationProps: {
        //         small: true,
        //         layout: 'sizes,prev,pager,next,total',
        //         pageSizes: [10, 15, 25, 50, 100]
        //     }
        // },
        // groupJoinRequestsModerationTable: {
        //     data: [],
        //     tableProps: {
        //         stripe: true,
        //         size: 'mini'
        //     },
        //     pageSize: 15,
        //     paginationProps: {
        //         small: true,
        //         layout: 'sizes,prev,pager,next,total',
        //         pageSizes: [10, 15, 25, 50, 100]
        //     }
        // },
        // groupBlockedModerationTable: {
        //     data: [],
        //     tableProps: {
        //         stripe: true,
        //         size: 'mini'
        //     },
        //     pageSize: 15,
        //     paginationProps: {
        //         small: true,
        //         layout: 'sizes,prev,pager,next,total',
        //         pageSizes: [10, 15, 25, 50, 100]
        //     }
        // },
        // checkedGroupLogsExportLogsOptions: [
        //     'created_at',
        //     'eventType',
        //     'actorDisplayName',
        //     'description',
        //     'data'
        // ],
        // checkGroupsLogsExportLogsOptions: [
        //     {
        //         label: 'created_at',
        //         text: 'dialog.group_member_moderation.created_at'
        //     },
        //     {
        //         label: 'eventType',
        //         text: 'dialog.group_member_moderation.type'
        //     },
        //     {
        //         label: 'actorDisplayName',
        //         text: 'dialog.group_member_moderation.display_name'
        //     },
        //     {
        //         label: 'description',
        //         text: 'dialog.group_member_moderation.description'
        //     },
        //     {
        //         label: 'data',
        //         text: 'dialog.group_member_moderation.data'
        //     }
        // ],
        // groupLogsExportContent: ''
    };

    _methods = {
        blockGroup(groupId) {
            this.$confirm(
                'Are you sure you want to block this group?',
                'Confirm',
                {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            groupRequest
                                .blockGroup({
                                    groupId
                                })
                                .then((args) => {
                                    // API.$on('GROUP:BLOCK', function (args) {
                                    if (
                                        this.groupDialog.visible &&
                                        this.groupDialog.id ===
                                            args.params.groupId
                                    ) {
                                        this.showGroupDialog(
                                            args.params.groupId
                                        );
                                    }
                                    // });
                                });
                        }
                    }
                }
            );
        },

        unblockGroup(groupId) {
            this.$confirm(
                'Are you sure you want to unblock this group?',
                'Confirm',
                {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            groupRequest
                                .unblockGroup({
                                    groupId,
                                    userId: API.currentUser.id
                                })
                                .then((args) => {
                                    // API.$on('GROUP:UNBLOCK', function (args) {
                                    if (
                                        this.groupDialog.visible &&
                                        this.groupDialog.id ===
                                            args.params.groupId
                                    ) {
                                        this.showGroupDialog(
                                            args.params.groupId
                                        );
                                    }
                                    // });
                                });
                        }
                    }
                }
            );
        },

        // async getAllGroupBans(groupId) {
        //     this.groupBansModerationTable.data = [];
        //     var params = {
        //         groupId,
        //         n: 100,
        //         offset: 0
        //     };
        //     var count = 50; // 5000 max
        //     this.isGroupMembersLoading = true;
        //     try {
        //         for (var i = 0; i < count; i++) {
        //             var args = await groupRequest.getGroupBans(params);
        //             if (args) {
        //                 // API.$on('GROUP:BANS', function (args) {
        //                 if (
        //                     this.groupMemberModeration.id !==
        //                     args.params.groupId
        //                 ) {
        //                     return;
        //                 }

        //                 for (const json of args.json) {
        //                     var ref = this.applyGroupMember(json);
        //                     this.groupBansModerationTable.data.push(ref);
        //                 }
        //                 // });
        //             }

        //             params.offset += params.n;
        //             if (args.json.length < params.n) {
        //                 break;
        //             }
        //             if (!this.groupMemberModeration.visible) {
        //                 break;
        //             }
        //         }
        //     } catch (err) {
        //         this.$message({
        //             message: 'Failed to get group bans',
        //             type: 'error'
        //         });
        //     } finally {
        //         this.isGroupMembersLoading = false;
        //     }
        // },

        // async getAllGroupLogs(groupId) {
        //     this.groupLogsModerationTable.data = [];
        //     var params = {
        //         groupId,
        //         n: 100,
        //         offset: 0
        //     };
        //     if (this.groupMemberModeration.selectedAuditLogTypes.length) {
        //         params.eventTypes =
        //             this.groupMemberModeration.selectedAuditLogTypes;
        //     }
        //     var count = 50; // 5000 max
        //     this.isGroupMembersLoading = true;
        //     try {
        //         for (var i = 0; i < count; i++) {
        //             var args = await groupRequest.getGroupLogs(params);
        //             if (args) {
        //                 // API.$on('GROUP:LOGS', function (args) {
        //                 if (
        //                     this.groupMemberModeration.id !==
        //                     args.params.groupId
        //                 ) {
        //                     return;
        //                 }

        //                 for (var json of args.json.results) {
        //                     const existsInData =
        //                         this.groupLogsModerationTable.data.some(
        //                             (dataItem) => dataItem.id === json.id
        //                         );
        //                     if (!existsInData) {
        //                         this.groupLogsModerationTable.data.push(json);
        //                     }
        //                 }
        //                 // });
        //             }
        //             params.offset += params.n;
        //             if (!args.json.hasNext) {
        //                 break;
        //             }
        //             if (!this.groupMemberModeration.visible) {
        //                 break;
        //             }
        //         }
        //     } catch (err) {
        //         this.$message({
        //             message: 'Failed to get group logs',
        //             type: 'error'
        //         });
        //     } finally {
        //         this.isGroupMembersLoading = false;
        //     }
        // },

        // getAuditLogTypeName(auditLogType) {
        //     if (!auditLogType) {
        //         return '';
        //     }
        //     return auditLogType
        //         .replace('group.', '')
        //         .replace(/\./g, ' ')
        //         .replace(/\b\w/g, (l) => l.toUpperCase());
        // },

        // async getAllGroupInvitesAndJoinRequests(groupId) {
        //     await this.getAllGroupInvites(groupId);
        //     await this.getAllGroupJoinRequests(groupId);
        //     await this.getAllGroupBlockedRequests(groupId);
        // },

        // async getAllGroupInvites(groupId) {
        //     this.groupInvitesModerationTable.data = [];
        //     var params = {
        //         groupId,
        //         n: 100,
        //         offset: 0
        //     };
        //     var count = 50; // 5000 max
        //     this.isGroupMembersLoading = true;
        //     try {
        //         for (var i = 0; i < count; i++) {
        //             var args = await groupRequest.getGroupInvites(params);
        //             if (args) {
        //                 // API.$on('GROUP:INVITES', function (args) {
        //                 if (
        //                     this.groupMemberModeration.id !==
        //                     args.params.groupId
        //                 ) {
        //                     return;
        //                 }

        //                 for (const json of args.json) {
        //                     const ref = this.applyGroupMember(json);
        //                     this.groupInvitesModerationTable.data.push(ref);
        //                 }
        //                 // });
        //             }
        //             params.offset += params.n;
        //             if (args.json.length < params.n) {
        //                 break;
        //             }
        //             if (!this.groupMemberModeration.visible) {
        //                 break;
        //             }
        //         }
        //     } catch (err) {
        //         this.$message({
        //             message: 'Failed to get group invites',
        //             type: 'error'
        //         });
        //     } finally {
        //         this.isGroupMembersLoading = false;
        //     }
        // },

        // async getAllGroupJoinRequests(groupId) {
        //     this.groupJoinRequestsModerationTable.data = [];
        //     var params = {
        //         groupId,
        //         n: 100,
        //         offset: 0
        //     };
        //     var count = 50; // 5000 max
        //     this.isGroupMembersLoading = true;
        //     try {
        //         for (var i = 0; i < count; i++) {
        //             var args = await groupRequest.getGroupJoinRequests(params);
        //             // API.$on('GROUP:JOINREQUESTS', function (args) {
        //             if (this.groupMemberModeration.id !== args.params.groupId) {
        //                 return;
        //             }

        //             if (!args.params.blocked) {
        //                 for (var json of args.json) {
        //                     var ref = API.applyGroupMember(json);
        //                     this.groupJoinRequestsModerationTable.data.push(
        //                         ref
        //                     );
        //                 }
        //             } else {
        //                 for (var json of args.json) {
        //                     var ref = API.applyGroupMember(json);
        //                     this.groupBlockedModerationTable.data.push(ref);
        //                 }
        //             }
        //             // });
        //             params.offset += params.n;
        //             if (args.json.length < params.n) {
        //                 break;
        //             }
        //             if (!this.groupMemberModeration.visible) {
        //                 break;
        //             }
        //         }
        //     } catch (err) {
        //         this.$message({
        //             message: 'Failed to get group join requests',
        //             type: 'error'
        //         });
        //     } finally {
        //         this.isGroupMembersLoading = false;
        //     }
        // },

        // async getAllGroupBlockedRequests(groupId) {
        //     this.groupBlockedModerationTable.data = [];
        //     var params = {
        //         groupId,
        //         n: 100,
        //         offset: 0,
        //         blocked: true
        //     };
        //     var count = 50; // 5000 max
        //     this.isGroupMembersLoading = true;
        //     try {
        //         for (var i = 0; i < count; i++) {
        //             var args = await groupRequest.getGroupJoinRequests(params);
        //             // API.$on('GROUP:JOINREQUESTS', function (args) {
        //             if (this.groupMemberModeration.id !== args.params.groupId) {
        //                 return;
        //             }

        //             if (!args.params.blocked) {
        //                 for (var json of args.json) {
        //                     var ref = API.applyGroupMember(json);
        //                     this.groupJoinRequestsModerationTable.data.push(
        //                         ref
        //                     );
        //                 }
        //             } else {
        //                 for (var json of args.json) {
        //                     var ref = API.applyGroupMember(json);
        //                     this.groupBlockedModerationTable.data.push(ref);
        //                 }
        //             }
        //             // });
        //             params.offset += params.n;
        //             if (args.json.length < params.n) {
        //                 break;
        //             }
        //             if (!this.groupMemberModeration.visible) {
        //                 break;
        //             }
        //         }
        //     } catch (err) {
        //         this.$message({
        //             message: 'Failed to get group join requests',
        //             type: 'error'
        //         });
        //     } finally {
        //         this.isGroupMembersLoading = false;
        //     }
        // },

        async groupOwnerChange(ref, oldUserId, newUserId) {
            var oldUser = await userRequest.getCachedUser({
                userId: oldUserId
            });
            var newUser = await userRequest.getCachedUser({
                userId: newUserId
            });
            var oldDisplayName = oldUser?.ref?.displayName;
            var newDisplayName = newUser?.ref?.displayName;

            this.groupChange(
                ref,
                `Owner changed from ${oldDisplayName} to ${newDisplayName}`
            );
        },

        groupRoleChange(ref, oldRoles, newRoles, oldRoleIds, newRoleIds) {
            // check for removed/added roleIds
            for (var roleId of oldRoleIds) {
                if (!newRoleIds.includes(roleId)) {
                    var roleName = '';
                    var role = oldRoles.find(
                        (fineRole) => fineRole.id === roleId
                    );
                    if (role) {
                        roleName = role.name;
                    }
                    this.groupChange(ref, `Role ${roleName} removed`);
                }
            }
            for (var roleId of newRoleIds) {
                if (!oldRoleIds.includes(roleId)) {
                    var roleName = '';
                    var role = newRoles.find(
                        (fineRole) => fineRole.id === roleId
                    );
                    if (role) {
                        roleName = role.name;
                    }
                    this.groupChange(ref, `Role ${roleName} added`);
                }
            }
        },

        groupChange(ref, message) {
            if (!this.currentUserGroupsInit) {
                return;
            }
            // oh the level of cursed for compibility
            var json = {
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
            workerTimers.setTimeout(this.saveCurrentUserGroups, 100);
        },

        saveCurrentUserGroups() {
            if (!this.currentUserGroupsInit) {
                return;
            }
            var groups = [];
            for (var ref of API.currentUserGroups.values()) {
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
        },

        async loadCurrentUserGroups(userId, groups) {
            var savedGroups = JSON.parse(
                await configRepository.getString(
                    `VRCX_currentUserGroups_${userId}`,
                    '[]'
                )
            );
            API.cachedGroups.clear();
            API.currentUserGroups.clear();
            for (var group of savedGroups) {
                var json = {
                    id: group.id,
                    name: group.name,
                    iconUrl: group.iconUrl,
                    ownerId: group.ownerId,
                    roles: group.roles,
                    myMember: {
                        roleIds: group.roleIds
                    }
                };
                var ref = API.applyGroup(json);
                API.currentUserGroups.set(group.id, ref);
            }

            if (groups) {
                const promises = groups.map(async (groupId) => {
                    const groupRef = API.cachedGroups.get(groupId);

                    if (
                        typeof groupRef !== 'undefined' &&
                        groupRef.roles?.length > 0
                    ) {
                        return;
                    }

                    try {
                        console.log(
                            `Fetching group with missing roles ${groupId}`
                        );
                        const args = await groupRequest.getGroup({
                            groupId,
                            includeRoles: true
                        });
                        const ref = API.applyGroup(args.json);
                        API.currentUserGroups.set(groupId, ref);
                    } catch (err) {
                        console.error(err);
                    }
                });

                await Promise.allSettled(promises);
            }

            this.currentUserGroupsInit = true;
            this.getCurrentUserGroups();
        },

        async getCurrentUserGroups() {
            var args = await groupRequest.getGroups({
                userId: API.currentUser.id
            });
            API.currentUserGroups.clear();
            for (var group of args.json) {
                var ref = API.applyGroup(group);
                if (!API.currentUserGroups.has(group.id)) {
                    API.currentUserGroups.set(group.id, ref);
                }
            }
            await groupRequest.getGroupPermissions({
                userId: API.currentUser.id
            });
            this.saveCurrentUserGroups();
        },

        showGroupDialog(groupId) {
            if (!groupId) {
                return;
            }
            // if (
            //     this.groupMemberModeration.visible &&
            //     this.groupMemberModeration.id !== groupId
            // ) {
            //     this.groupMemberModeration.visible = false;
            // }
            // this.$nextTick(() =>
            //     $app.adjustDialogZ(this.$refs.groupDialog.$el)
            // );
            var D = this.groupDialog;
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
            if (this.groupDialogLastGallery !== groupId) {
                D.galleries = {};
            }
            if (this.groupDialogLastMembers !== groupId) {
                D.members = [];
                D.memberFilter = this.groupDialogFilterOptions.everyone;
            }
            API.getCachedGroup({
                groupId
            })
                .catch((err) => {
                    D.loading = false;
                    D.visible = false;
                    this.$message({
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
                        this.applyGroupDialogInstances();
                        this.getGroupDialogGroup(groupId);
                    }
                });
        },

        getGroupDialogGroup(groupId) {
            var D = this.groupDialog;
            return groupRequest
                .getGroup({ groupId, includeRoles: true })
                .catch((err) => {
                    throw err;
                })
                .then((args1) => {
                    if (D.id === args1.ref.id) {
                        D.ref = args1.ref;
                        D.inGroup = args1.ref.membershipStatus === 'member';
                        for (var role of args1.ref.roles) {
                            if (
                                D.ref &&
                                D.ref.myMember &&
                                Array.isArray(D.ref.myMember.roleIds) &&
                                D.ref.myMember.roleIds.includes(role.id)
                            ) {
                                D.memberRoles.push(role);
                            }
                        }
                        API.getAllGroupPosts({
                            groupId
                        });
                        if (D.inGroup) {
                            groupRequest
                                .getGroupInstances({
                                    groupId
                                })
                                .then((args) => {
                                    // API.$on('GROUP:INSTANCES', function (args) {
                                    if (
                                        this.groupDialog.id ===
                                        args.params.groupId
                                    ) {
                                        this.applyGroupDialogInstances(
                                            args.json.instances
                                        );
                                    }
                                    // });

                                    // API.$on('GROUP:INSTANCES', function (args) {
                                    for (const json of args.json.instances) {
                                        this.$emit('INSTANCE', {
                                            json,
                                            params: {
                                                fetchedAt: args.json.fetchedAt
                                            }
                                        });
                                        worldRequest
                                            .getCachedWorld({
                                                worldId: json.world.id
                                            })
                                            .then((args1) => {
                                                json.world = args1.ref;
                                                return args1;
                                            });
                                        // get queue size etc
                                        instanceRequest.getInstance({
                                            worldId: json.worldId,
                                            instanceId: json.instanceId
                                        });
                                    }
                                    // });
                                });
                        }

                        // TODO
                        if (this.$refs.groupDialogTabs?.currentName === '2') {
                            if (this.groupDialogLastMembers !== groupId) {
                                this.groupDialogLastMembers = groupId;
                                this.getGroupDialogGroupMembers();
                            }
                        } else if (
                            this.$refs.groupDialogTabs?.currentName === '3'
                        ) {
                            if (this.groupDialogLastGallery !== groupId) {
                                this.groupDialogLastGallery = groupId;
                                this.getGroupGalleries();
                            }
                        } else if (
                            this.$refs.groupDialogTabs?.currentName === '4'
                        ) {
                            this.refreshGroupDialogTreeData();
                        }
                    }
                    return args1;
                });
        },

        groupDialogCommand(command) {
            var D = this.groupDialog;
            if (D.visible === false) {
                return;
            }
            switch (command) {
                case 'Refresh':
                    this.showGroupDialog(D.id);
                    break;
                // case 'Moderation Tools':
                //     this.showGroupMemberModerationDialog(D.id);
                //     break;
                case 'Leave Group':
                    this.leaveGroupPrompt(D.id);
                    break;
                case 'Block Group':
                    this.blockGroup(D.id);
                    break;
                case 'Unblock Group':
                    this.unblockGroup(D.id);
                    break;
                case 'Visibility Everyone':
                    this.setGroupVisibility(D.id, 'visible');
                    break;
                case 'Visibility Friends':
                    this.setGroupVisibility(D.id, 'friends');
                    break;
                case 'Visibility Hidden':
                    this.setGroupVisibility(D.id, 'hidden');
                    break;
                case 'Subscribe To Announcements':
                    this.setGroupSubscription(D.id, true);
                    break;
                case 'Unsubscribe To Announcements':
                    this.setGroupSubscription(D.id, false);
                    break;
                case 'Invite To Group':
                    this.showInviteGroupDialog(D.id, '');
                    break;
            }
        },

        refreshGroupDialogTreeData() {
            var D = this.groupDialog;
            D.treeData = $utils.buildTreeData({
                group: D.ref,
                posts: D.posts,
                instances: D.instances,
                members: D.members,
                galleries: D.galleries
            });
        },

        leaveGroupPrompt(groupId) {
            this.$confirm(
                'Are you sure you want to leave this group?',
                'Confirm',
                {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            groupRequest
                                .leaveGroup({
                                    groupId
                                })
                                .then((args) => {
                                    // API.$on('GROUP:LEAVE', function (args) {
                                    const groupId = args.params.groupId;
                                    if (
                                        this.groupDialog.visible &&
                                        this.groupDialog.id === groupId
                                    ) {
                                        this.groupDialog.inGroup = false;
                                        this.getGroupDialogGroup(groupId);
                                    }
                                    if (
                                        this.userDialog.visible &&
                                        this.userDialog.id ===
                                            this.currentUser.id &&
                                        this.userDialog.representedGroup.id ===
                                            groupId
                                    ) {
                                        this.getCurrentUserRepresentedGroup();
                                    }
                                    // });
                                });
                        }
                    }
                }
            );
        },

        setGroupVisibility(groupId, visibility) {
            return groupRequest
                .setGroupMemberProps(API.currentUser.id, groupId, {
                    visibility
                })
                .then((args) => {
                    this.$message({
                        message: 'Group visibility updated',
                        type: 'success'
                    });
                    return args;
                });
        },

        setGroupSubscription(groupId, subscribe) {
            return groupRequest
                .setGroupMemberProps(API.currentUser.id, groupId, {
                    isSubscribedToAnnouncements: subscribe
                })
                .then((args) => {
                    this.$message({
                        message: 'Group subscription updated',
                        type: 'success'
                    });
                    return args;
                });
        },

        onGroupJoined(groupId) {
            if (
                this.groupMemberModeration.visible &&
                this.groupMemberModeration.id === groupId
            ) {
                // ignore this event if we were the one to trigger it
                return;
            }
            if (!API.currentUserGroups.has(groupId)) {
                API.currentUserGroups.set(groupId, {
                    id: groupId,
                    name: '',
                    iconUrl: ''
                });
                groupRequest
                    .getGroup({ groupId, includeRoles: true })
                    .then((args) => {
                        API.applyGroup(args.json); // make sure this runs before saveCurrentUserGroups
                        this.saveCurrentUserGroups();
                        return args;
                    });
            }
        },

        onGroupLeft(groupId) {
            if (this.groupDialog.visible && this.groupDialog.id === groupId) {
                this.showGroupDialog(groupId);
            }
            if (API.currentUserGroups.has(groupId)) {
                API.currentUserGroups.delete(groupId);
                API.getCachedGroup({ groupId }).then((args) => {
                    this.groupChange(args.ref, 'Left group');
                });
            }
        },

        // groupMembersSearchDebounce() {
        //     var D = this.groupDialog;
        //     var search = D.memberSearch;
        //     D.memberSearchResults = [];
        //     if (!search || search.length < 3) {
        //         this.setGroupMemberModerationTable(D.members);
        //         return;
        //     }
        //     this.isGroupMembersLoading = true;
        //     groupRequest
        //         .getGroupMembersSearch({
        //             groupId: D.id,
        //             query: search,
        //             n: 100,
        //             offset: 0
        //         })
        //         .then((args) => {
        //             // API.$on('GROUP:MEMBERS:SEARCH', function (args) {
        //             for (const json of args.json.results) {
        //                 API.$emit('GROUP:MEMBER', {
        //                     json,
        //                     params: {
        //                         groupId: args.params.groupId
        //                     }
        //                 });
        //             }
        //             // });
        //             if (D.id === args.params.groupId) {
        //                 D.memberSearchResults = args.json.results;
        //                 this.setGroupMemberModerationTable(args.json.results);
        //             }
        //         })
        //         .finally(() => {
        //             this.isGroupMembersLoading = false;
        //         });
        // },

        // groupMembersSearch() {
        //     if (this.groupMembersSearchTimer) {
        //         this.groupMembersSearchPending = true;
        //     } else {
        //         this.groupMembersSearchExecute();
        //         this.groupMembersSearchTimer = setTimeout(() => {
        //             if (this.groupMembersSearchPending) {
        //                 this.groupMembersSearchExecute();
        //             }
        //             this.groupMembersSearchTimer = null;
        //         }, 500);
        //     }
        // },

        // groupMembersSearchExecute() {
        //     try {
        //         this.groupMembersSearchDebounce();
        //     } catch (err) {
        //         console.error(err);
        //     }
        //     this.groupMembersSearchTimer = null;
        //     this.groupMembersSearchPending = false;
        // },

        updateGroupPostSearch() {
            var D = this.groupDialog;
            var search = D.postsSearch.toLowerCase();
            D.postsFiltered = D.posts.filter((post) => {
                if (search === '') {
                    return true;
                }
                if (post.title.toLowerCase().includes(search)) {
                    return true;
                }
                if (post.text.toLowerCase().includes(search)) {
                    return true;
                }
                return false;
            });
        },

        async getGroupDialogGroupMembers() {
            var D = this.groupDialog;
            D.members = [];
            this.isGroupMembersDone = false;
            this.loadMoreGroupMembersParams = {
                n: 100,
                offset: 0,
                groupId: D.id
            };
            if (D.memberSortOrder.value) {
                this.loadMoreGroupMembersParams.sort = D.memberSortOrder.value;
            }
            if (D.memberFilter.id !== null) {
                this.loadMoreGroupMembersParams.roleId = D.memberFilter.id;
            }
            if (D.inGroup) {
                await groupRequest
                    .getGroupMember({
                        groupId: D.id,
                        userId: API.currentUser.id
                    })
                    .then((args) => {
                        if (args.json) {
                            args.json.user = API.currentUser;
                            if (D.memberFilter.id === null) {
                                // when flitered by role don't include self
                                D.members.push(args.json);
                            }
                        }
                        return args;
                    });
            }
            await this.loadMoreGroupMembers();
        },

        async loadMoreGroupMembers() {
            if (this.isGroupMembersDone || this.isGroupMembersLoading) {
                return;
            }
            var D = this.groupDialog;
            var params = this.loadMoreGroupMembersParams;
            D.memberSearch = '';
            this.isGroupMembersLoading = true;
            await groupRequest
                .getGroupMembers(params)
                .finally(() => {
                    this.isGroupMembersLoading = false;
                })
                .then((args) => {
                    for (var i = 0; i < args.json.length; i++) {
                        var member = args.json[i];
                        if (member.userId === API.currentUser.id) {
                            if (
                                D.members.length > 0 &&
                                D.members[0].userId === API.currentUser.id
                            ) {
                                // remove duplicate and keep sort order
                                D.members.splice(0, 1);
                            }
                            break;
                        }
                    }
                    if (args.json.length < params.n) {
                        this.isGroupMembersDone = true;
                    }
                    D.members = [...D.members, ...args.json];
                    params.offset += params.n;
                    return args;
                })
                .catch((err) => {
                    this.isGroupMembersDone = true;
                    throw err;
                });
        },

        async loadAllGroupMembers() {
            if (this.isGroupMembersLoading) {
                return;
            }
            await this.getGroupDialogGroupMembers();
            while (this.groupDialog.visible && !this.isGroupMembersDone) {
                this.isGroupMembersLoading = true;
                await new Promise((resolve) => {
                    workerTimers.setTimeout(resolve, 1000);
                });
                this.isGroupMembersLoading = false;
                await this.loadMoreGroupMembers();
            }
        },

        async setGroupMemberSortOrder(sortOrder) {
            var D = this.groupDialog;
            if (D.memberSortOrder === sortOrder) {
                return;
            }
            D.memberSortOrder = sortOrder;
            await this.getGroupDialogGroupMembers();
        },

        async setGroupMemberFilter(filter) {
            var D = this.groupDialog;
            if (D.memberFilter === filter) {
                return;
            }
            D.memberFilter = filter;
            await this.getGroupDialogGroupMembers();
        },

        getCurrentUserRepresentedGroup() {
            return groupRequest
                .getRepresentedGroup({
                    userId: API.currentUser.id
                })
                .then((args) => {
                    this.userDialog.representedGroup = args.json;
                    return args;
                });
        },

        async getGroupGalleries() {
            this.groupDialog.galleries = {};
            if (this.$refs.groupDialogGallery) {
                this.$refs.groupDialogGallery.currentName = '0'; // select first tab
            }
            this.isGroupGalleryLoading = true;
            for (var i = 0; i < this.groupDialog.ref.galleries.length; i++) {
                var gallery = this.groupDialog.ref.galleries[i];
                await this.getGroupGallery(this.groupDialog.id, gallery.id);
            }
            this.isGroupGalleryLoading = false;
        },

        async getGroupGallery(groupId, galleryId) {
            try {
                var params = {
                    groupId,
                    galleryId,
                    n: 100,
                    offset: 0
                };
                var count = 50; // 5000 max
                for (var i = 0; i < count; i++) {
                    var args = await groupRequest.getGroupGallery(params);
                    if (args) {
                        // API.$on('GROUP:GALLERY', function (args) {
                        for (const json of args.json) {
                            if (this.groupDialog.id === json.groupId) {
                                if (
                                    !this.groupDialog.galleries[json.galleryId]
                                ) {
                                    this.groupDialog.galleries[json.galleryId] =
                                        [];
                                }
                                this.groupDialog.galleries[json.galleryId].push(
                                    json
                                );
                            }
                        }
                        // });
                    }
                    params.offset += 100;
                    if (args.json.length < 100) {
                        break;
                    }
                }
            } catch (err) {
                console.error(err);
            }
        },

        showInviteGroupDialog(groupId, userId) {
            const D = this.inviteGroupDialog;
            D.userIds = '';
            D.groups = [];
            D.groupId = groupId;
            D.groupName = groupId;
            D.userId = userId;
            D.userObject = {};
            D.visible = true;
        },

        // setGroupMemberModerationTable(data) {
        //     if (!this.groupMemberModeration.visible) {
        //         return;
        //     }
        //     for (var i = 0; i < data.length; i++) {
        //         var member = data[i];
        //         member.$selected = this.groupMemberModeration.selectedUsers.has(
        //             member.userId
        //         );
        //     }
        //     this.groupMemberModerationTable.data = data;
        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // showGroupMemberModerationDialog(groupId) {
        //     this.$nextTick(() =>
        //         $app.adjustDialogZ(this.$refs.groupMemberModeration.$el)
        //     );
        //     if (groupId !== this.groupDialog.id) {
        //         return;
        //     }
        //     var D = this.groupMemberModeration;
        //     D.id = groupId;
        //     D.selectedUsers.clear();
        //     D.selectedUsersArray = [];
        //     D.selectedRoles = [];
        //     D.groupRef = {};
        //     D.auditLogTypes = [];
        //     D.selectedAuditLogTypes = [];
        //     API.getCachedGroup({ groupId }).then((args) => {
        //         D.groupRef = args.ref;
        //         if ($utils.hasGroupPermission(D.groupRef, 'group-audit-view')) {
        //             groupRequest
        //                 .getGroupAuditLogTypes({ groupId })
        //                 .then((args) => {
        //                     // API.$on('GROUP:AUDITLOGTYPES', function (args) {
        //                     if (
        //                         this.groupMemberModeration.id !==
        //                         args.params.groupId
        //                     ) {
        //                         return;
        //                     }

        //                     this.groupMemberModeration.auditLogTypes =
        //                         args.json;
        //                     // });
        //                 });
        //         }
        //     });
        //     this.groupMemberModerationTableForceUpdate = 0;
        //     D.visible = true;
        //     this.setGroupMemberModerationTable(this.groupDialog.members);
        // },

        // groupMemberModerationTableSelectionChange(row) {
        //     var D = this.groupMemberModeration;
        //     if (row.$selected && !D.selectedUsers.has(row.userId)) {
        //         D.selectedUsers.set(row.userId, row);
        //     } else if (!row.$selected && D.selectedUsers.has(row.userId)) {
        //         D.selectedUsers.delete(row.userId);
        //     }
        //     D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // deleteSelectedGroupMember(user) {
        //     var D = this.groupMemberModeration;
        //     D.selectedUsers.delete(user.userId);
        //     D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //     for (
        //         var i = 0;
        //         i < this.groupMemberModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupMemberModerationTable.data[i];
        //         if (row.userId === user.userId) {
        //             row.$selected = false;
        //             break;
        //         }
        //     }
        //     for (
        //         var i = 0;
        //         i < this.groupBansModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupBansModerationTable.data[i];
        //         if (row.userId === user.userId) {
        //             row.$selected = false;
        //             break;
        //         }
        //     }
        //     for (
        //         var i = 0;
        //         i < this.groupInvitesModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupInvitesModerationTable.data[i];
        //         if (row.userId === user.userId) {
        //             row.$selected = false;
        //             break;
        //         }
        //     }
        //     for (
        //         var i = 0;
        //         i < this.groupJoinRequestsModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupJoinRequestsModerationTable.data[i];
        //         if (row.userId === user.userId) {
        //             row.$selected = false;
        //             break;
        //         }
        //     }
        //     for (
        //         var i = 0;
        //         i < this.groupBlockedModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupBlockedModerationTable.data[i];
        //         if (row.userId === user.userId) {
        //             row.$selected = false;
        //             break;
        //         }
        //     }

        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // clearSelectedGroupMembers() {
        //     var D = this.groupMemberModeration;
        //     D.selectedUsers.clear();
        //     D.selectedUsersArray = [];
        //     for (
        //         var i = 0;
        //         i < this.groupMemberModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupMemberModerationTable.data[i];
        //         row.$selected = false;
        //     }
        //     for (
        //         var i = 0;
        //         i < this.groupBansModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupBansModerationTable.data[i];
        //         row.$selected = false;
        //     }
        //     for (
        //         var i = 0;
        //         i < this.groupInvitesModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupInvitesModerationTable.data[i];
        //         row.$selected = false;
        //     }
        //     for (
        //         var i = 0;
        //         i < this.groupJoinRequestsModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupJoinRequestsModerationTable.data[i];
        //         row.$selected = false;
        //     }
        //     for (
        //         var i = 0;
        //         i < this.groupBlockedModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupBlockedModerationTable.data[i];
        //         row.$selected = false;
        //     }
        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // selectAllGroupMembers() {
        //     var D = this.groupMemberModeration;
        //     for (
        //         var i = 0;
        //         i < this.groupMemberModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupMemberModerationTable.data[i];
        //         row.$selected = true;
        //         D.selectedUsers.set(row.userId, row);
        //     }
        //     D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // selectAllGroupBans() {
        //     var D = this.groupMemberModeration;
        //     for (
        //         var i = 0;
        //         i < this.groupBansModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupBansModerationTable.data[i];
        //         row.$selected = true;
        //         D.selectedUsers.set(row.userId, row);
        //     }
        //     D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // selectAllGroupInvites() {
        //     var D = this.groupMemberModeration;
        //     for (
        //         var i = 0;
        //         i < this.groupInvitesModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupInvitesModerationTable.data[i];
        //         row.$selected = true;
        //         D.selectedUsers.set(row.userId, row);
        //     }
        //     D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // selectAllGroupJoinRequests() {
        //     var D = this.groupMemberModeration;
        //     for (
        //         var i = 0;
        //         i < this.groupJoinRequestsModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupJoinRequestsModerationTable.data[i];
        //         row.$selected = true;
        //         D.selectedUsers.set(row.userId, row);
        //     }
        //     D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // selectAllGroupBlocked() {
        //     var D = this.groupMemberModeration;
        //     for (
        //         var i = 0;
        //         i < this.groupBlockedModerationTable.data.length;
        //         i++
        //     ) {
        //         var row = this.groupBlockedModerationTable.data[i];
        //         row.$selected = true;
        //         D.selectedUsers.set(row.userId, row);
        //     }
        //     D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //     // force redraw
        //     this.groupMemberModerationTableForceUpdate++;
        // },

        // async groupMembersKick() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.userId === API.currentUser.id) {
        //             continue;
        //         }
        //         console.log(`Kicking ${user.userId} ${i + 1}/${memberCount}`);
        //         try {
        //             await groupRequest.kickGroupMember({
        //                 groupId: D.id,
        //                 userId: user.userId
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to kick group member: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //     }
        //     this.$message({
        //         message: `Kicked ${memberCount} group members`,
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersBan() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.userId === API.currentUser.id) {
        //             continue;
        //         }
        //         console.log(`Banning ${user.userId} ${i + 1}/${memberCount}`);
        //         try {
        //             await groupRequest.banGroupMember({
        //                 groupId: D.id,
        //                 userId: user.userId
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to ban group member: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //     }
        //     this.$message({
        //         message: `Banned ${memberCount} group members`,
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersUnban() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;

        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.userId === API.currentUser.id) {
        //             continue;
        //         }
        //         console.log(`Unbanning ${user.userId} ${i + 1}/${memberCount}`);
        //         try {
        //             await groupRequest.unbanGroupMember({
        //                 groupId: D.id,
        //                 userId: user.userId
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to unban group member: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //     }
        //     this.$message({
        //         message: `Unbanned ${memberCount} group members`,
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersDeleteSentInvite() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.userId === API.currentUser.id) {
        //             continue;
        //         }
        //         console.log(
        //             `Deleting group invite ${user.userId} ${i + 1}/${memberCount}`
        //         );
        //         try {
        //             await groupRequest.deleteSentGroupInvite({
        //                 groupId: D.id,
        //                 userId: user.userId
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to delete group invites: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //     }
        //     this.$message({
        //         message: `Deleted ${memberCount} group invites`,
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersDeleteBlockedRequest() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.userId === API.currentUser.id) {
        //             continue;
        //         }
        //         console.log(
        //             `Deleting blocked group request ${user.userId} ${i + 1}/${memberCount}`
        //         );
        //         try {
        //             await groupRequest.deleteBlockedGroupRequest({
        //                 groupId: D.id,
        //                 userId: user.userId
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to delete blocked group requests: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //     }
        //     this.$message({
        //         message: `Deleted ${memberCount} blocked group requests`,
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersAcceptInviteRequest() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.userId === API.currentUser.id) {
        //             continue;
        //         }
        //         console.log(
        //             `Accepting group join request ${user.userId} ${i + 1}/${memberCount}`
        //         );
        //         try {
        //             await groupRequest.acceptGroupInviteRequest({
        //                 groupId: D.id,
        //                 userId: user.userId
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to accept group join requests: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //     }
        //     this.$message({
        //         message: `Accepted ${memberCount} group join requests`,
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersRejectInviteRequest() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.userId === API.currentUser.id) {
        //             continue;
        //         }
        //         console.log(
        //             `Rejecting group join request ${user.userId} ${i + 1}/${memberCount}`
        //         );
        //         try {
        //             await groupRequest.rejectGroupInviteRequest({
        //                 groupId: D.id,
        //                 userId: user.userId
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to reject group join requests: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //         this.$message({
        //             message: `Rejected ${memberCount} group join requests`,
        //             type: 'success'
        //         });
        //         D.progressCurrent = 0;
        //         D.progressTotal = 0;
        //     }
        // },

        // async groupMembersBlockJoinRequest() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.userId === API.currentUser.id) {
        //             continue;
        //         }
        //         console.log(
        //             `Blocking group join request ${user.userId} ${i + 1}/${memberCount}`
        //         );
        //         try {
        //             await groupRequest.blockGroupInviteRequest({
        //                 groupId: D.id,
        //                 userId: user.userId
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to block group join requests: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //     }
        //     this.$message({
        //         message: `Blocked ${memberCount} group join requests`,
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersSaveNote() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         if (user.managerNotes === D.note) {
        //             continue;
        //         }
        //         console.log(
        //             `Setting note ${D.note} ${user.userId} ${
        //                 i + 1
        //             }/${memberCount}`
        //         );
        //         try {
        //             await groupRequest.setGroupMemberProps(user.userId, D.id, {
        //                 managerNotes: D.note
        //             });
        //         } catch (err) {
        //             console.error(err);
        //             this.$message({
        //                 message: `Failed to set group member note: ${err}`,
        //                 type: 'error'
        //             });
        //         }
        //     }
        //     this.$message({
        //         message: `Saved notes for ${memberCount} group members`,
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersAddRoles() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         var rolesToAdd = [];
        //         D.selectedRoles.forEach((roleId) => {
        //             if (!user.roleIds.includes(roleId)) {
        //                 rolesToAdd.push(roleId);
        //             }
        //         });

        //         if (!rolesToAdd.length) {
        //             continue;
        //         }
        //         for (var j = 0; j < rolesToAdd.length; j++) {
        //             var roleId = rolesToAdd[j];
        //             console.log(
        //                 `Adding role: ${roleId} ${user.userId} ${
        //                     i + 1
        //                 }/${memberCount}`
        //             );
        //             try {
        //                 await groupRequest.addGroupMemberRole({
        //                     groupId: D.id,
        //                     userId: user.userId,
        //                     roleId
        //                 });
        //             } catch (err) {
        //                 console.error(err);
        //                 this.$message({
        //                     message: `Failed to add group member roles: ${err}`,
        //                     type: 'error'
        //                 });
        //             }
        //         }
        //     }
        //     this.$message({
        //         message: 'Added group member roles',
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async groupMembersRemoveRoles() {
        //     var D = this.groupMemberModeration;
        //     var memberCount = D.selectedUsersArray.length;
        //     D.progressTotal = memberCount;
        //     for (var i = 0; i < memberCount; i++) {
        //         if (!D.visible || !D.progressTotal) {
        //             break;
        //         }
        //         var user = D.selectedUsersArray[i];
        //         D.progressCurrent = i + 1;
        //         var rolesToRemove = [];
        //         D.selectedRoles.forEach((roleId) => {
        //             if (user.roleIds.includes(roleId)) {
        //                 rolesToRemove.push(roleId);
        //             }
        //         });
        //         if (!rolesToRemove.length) {
        //             continue;
        //         }
        //         for (var j = 0; j < rolesToRemove.length; j++) {
        //             var roleId = rolesToRemove[j];
        //             console.log(
        //                 `Removing role ${roleId} ${user.userId} ${
        //                     i + 1
        //                 }/${memberCount}`
        //             );
        //             try {
        //                 await groupRequest.removeGroupMemberRole({
        //                     groupId: D.id,
        //                     userId: user.userId,
        //                     roleId
        //                 });
        //             } catch (err) {
        //                 console.error(err);
        //                 this.$message({
        //                     message: `Failed to remove group member roles: ${err}`,
        //                     type: 'error'
        //                 });
        //             }
        //         }
        //     }
        //     this.$message({
        //         message: 'Roles removed',
        //         type: 'success'
        //     });
        //     D.progressCurrent = 0;
        //     D.progressTotal = 0;
        // },

        // async selectGroupMemberUserId() {
        //     var D = this.groupMemberModeration;
        //     if (!D.selectUserId) {
        //         return;
        //     }

        //     var regexUserId =
        //         /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
        //     var match = [];
        //     var userIdList = new Set();
        //     while ((match = regexUserId.exec(D.selectUserId)) !== null) {
        //         userIdList.add(match[0]);
        //     }
        //     if (userIdList.size === 0) {
        //         // for those users missing the usr_ prefix
        //         userIdList.add(D.selectUserId);
        //     }
        //     for (var userId of userIdList) {
        //         try {
        //             await this.addGroupMemberToSelection(userId);
        //         } catch {
        //             console.error(`Failed to add user ${userId}`);
        //         }
        //     }

        //     D.selectUserId = '';
        // },

        // async addGroupMemberToSelection(userId) {
        //     var D = this.groupMemberModeration;

        //     // fetch member if there is one
        //     // banned members don't have a user object

        //     var member = {};
        //     var memberArgs = await groupRequest.getGroupMember({
        //         groupId: D.id,
        //         userId
        //     });
        //     if (memberArgs.json) {
        //         member = API.applyGroupMember(memberArgs.json);
        //     }
        //     if (member.user) {
        //         D.selectedUsers.set(member.userId, member);
        //         D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //         this.groupMemberModerationTableForceUpdate++;
        //         return;
        //     }

        //     var userArgs = await userRequest.getCachedUser({
        //         userId
        //     });
        //     member.userId = userArgs.json.id;
        //     member.user = userArgs.json;
        //     member.displayName = userArgs.json.displayName;

        //     D.selectedUsers.set(member.userId, member);
        //     D.selectedUsersArray = Array.from(D.selectedUsers.values());
        //     this.groupMemberModerationTableForceUpdate++;
        // },
        // showGroupLogsExportDialog() {
        //     this.$nextTick(() =>
        //         $app.adjustDialogZ(this.$refs.groupLogsExportDialogRef.$el)
        //     );
        //     this.groupLogsExportContent = '';
        //     this.updateGrouptLogsExporContent();
        //     this.isGroupLogsExportDialogVisible = true;
        // },
        handleCopyGroupLogsExportContent(event) {
            event.target.tagName === 'TEXTAREA' && event.target.select();
            navigator.clipboard
                .writeText(this.groupLogsExportContent)
                .then(() => {
                    this.$message({
                        message: 'Copied successfully!',
                        type: 'success',
                        duration: 2000
                    });
                })
                .catch((err) => {
                    console.error('Copy failed:', err);
                    this.$message.error('Copy failed!');
                });
        }
        // updateGrouptLogsExporContent() {
        //     const formatter = (str) =>
        //         /[\x00-\x1f,"]/.test(str)
        //             ? `"${str.replace(/"/g, '""')}"`
        //             : str;

        //     const sortedCheckedOptions = this.checkGroupsLogsExportLogsOptions
        //         .filter((option) =>
        //             this.checkedGroupLogsExportLogsOptions.includes(
        //                 option.label
        //             )
        //         )
        //         .map((option) => option.label);

        //     const header = sortedCheckedOptions.join(',') + '\n';

        //     const content = this.groupLogsModerationTable.data
        //         .map((item) =>
        //             sortedCheckedOptions
        //                 .map((key) =>
        //                     formatter(
        //                         key === 'data'
        //                             ? JSON.stringify(item[key])
        //                             : item[key]
        //                     )
        //                 )
        //                 .join(',')
        //         )
        //         .join('\n');

        //     this.groupLogsExportContent = header + content;
        // }
    };
}
