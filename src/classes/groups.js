import { groupRequest } from '../api';
import { $app, API } from '../app.js';
import configRepository from '../service/config.js';
import { replaceBioSymbols } from '../shared/utils';

export default function init() {
    API.$on('GROUP', function (args) {
        args.ref = $app.store.group.applyGroup(args.json);
    });

    API.$on('GROUP', function (args) {
        var { ref } = args;
        var D = $app.store.group.groupDialog;
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
            $app.store.group.groupDialog.visible &&
            $app.store.group.groupDialog.id === json.groupId
        ) {
            $app.store.group.groupDialog.ref.myMember.visibility =
                json.visibility;
            $app.store.group.groupDialog.ref.myMember.isSubscribedToAnnouncements =
                json.isSubscribedToAnnouncements;
        }
        if (
            $app.store.user.userDialog.visible &&
            $app.store.user.userDialog.id === this.currentUser.id
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
        let member;
        if ($app.store.group.groupDialog.id === args.json.groupId) {
            let i;
            for (i = 0; i < $app.store.group.groupDialog.members.length; ++i) {
                member = $app.store.group.groupDialog.members[i];
                if (member.userId === args.json.userId) {
                    Object.assign(member, this.applyGroupMember(args.json));
                    break;
                }
            }
            for (
                i = 0;
                i < $app.store.group.groupDialog.memberSearchResults.length;
                ++i
            ) {
                member = $app.store.group.groupDialog.memberSearchResults[i];
                if (member.userId === args.json.userId) {
                    Object.assign(member, this.applyGroupMember(args.json));
                    break;
                }
            }
        }

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

    API.$on('GROUP:PERMISSIONS', function (args) {
        if (args.params.userId !== this.currentUser.id) {
            return;
        }
        var json = args.json;
        for (var groupId in json) {
            var permissions = json[groupId];
            var group = $app.store.group.cachedGroups.get(groupId);
            if (group) {
                group.myMember.permissions = permissions;
            }
        }
    });

    API.$on('GROUP:POST', function (args) {
        var D = $app.store.group.groupDialog;
        if (D.id !== args.params.groupId) {
            return;
        }

        var newPost = args.json;
        newPost.title = replaceBioSymbols(newPost.title);
        newPost.text = replaceBioSymbols(newPost.text);
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
        $app.store.group.updateGroupPostSearch();
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

    API.$on('GROUP:USER:INSTANCES', function (args) {
        $app.store.group.groupInstances = [];
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
            const ref = $app.store.group.cachedGroups.get(json.ownerId);
            if (typeof ref === 'undefined') {
                if ($app.store.friend.friendLogInitStatus) {
                    groupRequest.getGroup({ groupId: json.ownerId });
                }
                return;
            }
            $app.store.group.groupInstances.push({
                group: ref,
                instance: $app.store.instance.applyInstance(json)
            });
        }
    });

    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    API.getCachedGroup = function (params) {
        return new Promise((resolve, reject) => {
            var ref = $app.store.group.cachedGroups.get(params.groupId);
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
        if (json?.userId === this.currentUser.id) {
            var ref = $app.store.group.cachedGroups.get(json.groupId);
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
            var value = $app.store.user.subsetOfLanguages[language];
            if (typeof value === 'undefined') {
                continue;
            }
            ref.$languages.push({
                key: language,
                value
            });
        }
    };

    const _data = {
        currentUserGroupsInit: false,
        // maybe unnecessary
        // groupDialogLastMembers: '',
        // groupDialogLastGallery: '',
        groupMembersSearchTimer: null,
        groupMembersSearchPending: false
    };

    const _methods = {
        async loadCurrentUserGroups(userId, groups) {
            var savedGroups = JSON.parse(
                await configRepository.getString(
                    `VRCX_currentUserGroups_${userId}`,
                    '[]'
                )
            );
            $app.store.group.cachedGroups.clear();
            $app.store.group.currentUserGroups.clear();
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
                var ref = $app.store.group.applyGroup(json);
                $app.store.group.currentUserGroups.set(group.id, ref);
            }

            if (groups) {
                const promises = groups.map(async (groupId) => {
                    const groupRef = $app.store.group.cachedGroups.get(groupId);

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
                        const ref = $app.store.group.applyGroup(args.json);
                        $app.store.group.currentUserGroups.set(groupId, ref);
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
            $app.store.group.currentUserGroups.clear();
            for (var group of args.json) {
                var ref = $app.store.group.applyGroup(group);
                if (!$app.store.group.currentUserGroups.has(group.id)) {
                    $app.store.group.currentUserGroups.set(group.id, ref);
                }
            }
            await groupRequest.getGroupPermissions({
                userId: API.currentUser.id
            });
            this.store.group.saveCurrentUserGroups();
        },

        getCurrentUserRepresentedGroup() {
            return groupRequest
                .getRepresentedGroup({
                    userId: API.currentUser.id
                })
                .then((args) => {
                    this.store.user.userDialog.representedGroup = args.json;
                    return args;
                });
        }
    };

    $app.data = { ...$app.data, ..._data };
    $app.methods = { ...$app.methods, ..._methods };
}
