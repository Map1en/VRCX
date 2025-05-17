import { API } from '../app';

const groupReq = {
    /**
     * @param {string} groupId
     * @param {{isRepresenting: bool}} params
     * @returns
     */
    setGroupRepresentation(groupId, params) {
        return API.call(`groups/${groupId}/representation`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                groupId,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    cancelGroupRequest(params) {
        return API.call(`groups/${params.groupId}/requests`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ groupId: string, postId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    deleteGroupPost(params) {
        return API.call(`groups/${params.groupId}/posts/${params.postId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     */
    getGroup(params) {
        return API.call(`groups/${params.groupId}`, {
            method: 'GET',
            params: {
                includeRoles: params.includeRoles || false
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP', args);
            return args;
        });
    },
    /**
     * @param {{ userId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getRepresentedGroup(params) {
        return API.call(`users/${params.userId}/groups/represented`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:REPRESENTED', args);
            return args;
        });
    },
    /**
     * @param {{ userId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroups(params) {
        return API.call(`users/${params.userId}/groups`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:LIST', args);
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    joinGroup(params) {
        return API.call(`groups/${params.groupId}/join`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:JOIN', args);
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    leaveGroup(params) {
        return API.call(`groups/${params.groupId}/leave`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ query: string }} params
     * @return { Promise<{json: any, params}> }
     */
    groupStrictsearch(params) {
        return API.call(`groups/strictsearch`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
    userId: string,
    groupId: string,
    params: {
        visibility: string,
        isSubscribedToAnnouncements: bool,
        managerNotes: string
    }
    */
    setGroupMemberProps(userId, groupId, params) {
        return API.call(`groups/${groupId}/members/${userId}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                userId,
                groupId,
                params
            };
            API.$emit('GROUP:MEMBER:PROPS', args);
            return args;
        });
    },
    /**
     * @param {{
     * userId: string,
     * groupId: string,
     * roleId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    addGroupMemberRole(params) {
        return API.call(
            `groups/${params.groupId}/members/${params.userId}/roles/${params.roleId}`,
            {
                method: 'PUT'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('GROUP:MEMBER:ROLE:CHANGE', args);
            return args;
        });
    },
    /**
     * @param {{
     * userId: string,
     * groupId: string,
     * roleId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    removeGroupMemberRole(params) {
        return API.call(
            `groups/${params.groupId}/members/${params.userId}/roles/${params.roleId}`,
            {
                method: 'DELETE'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('GROUP:MEMBER:ROLE:CHANGE', args);
            return args;
        });
    },
    getGroupPermissions(params) {
        return API.call(`users/${params.userId}/groups/permissions`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:PERMISSIONS', args);
            return args;
        });
    },
    /**
     * @param {{
     groupId: string,
     n: number,
     offset: number
     }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupPosts(params) {
        return API.call(`groups/${params.groupId}/posts`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:POSTS', args);
            return args;
        });
    },
    editGroupPost(params) {
        return API.call(`groups/${params.groupId}/posts/${params.postId}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:POST', args);
            return args;
        });
    },
    createGroupPost(params) {
        return API.call(`groups/${params.groupId}/posts`, {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:POST', args);
            return args;
        });
    },
    /**
     * @param {{
     * groupId: string,
     * userId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupMember(params) {
        return API.call(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('GROUP:MEMBER', args);
            return args;
        });
    },
    /**
     * @param {{
     * groupId: string,
     * n: number,
     * offset: number
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupMembers(params) {
        return API.call(`groups/${params.groupId}/members`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:MEMBERS', args);
            return args;
        });
    },
    /**
     * @param {{
     * groupId: string,
     * query: string,
     * n: number,
     * offset: number
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupMembersSearch(params) {
        return API.call(`groups/${params.groupId}/members/search`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{
     * groupId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    blockGroup(params) {
        return API.call(`groups/${params.groupId}/block`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{
     * groupId: string,
     * userId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    unblockGroup(params) {
        return API.call(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{
     * groupId: string,
     * userId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    sendGroupInvite(params) {
        return API.call(`groups/${params.groupId}/invites`, {
            method: 'POST',
            params: {
                userId: params.userId
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GROUP:INVITE', args);
            return args;
        });
    },
    /**
     * @param {{
     * groupId: string,
     * userId: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    kickGroupMember(params) {
        return API.call(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // API.$emit('GROUP:MEMBER:KICK', args);
            return args;
        });
    },
    /**
     * @param {{ groupId: string, userId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    banGroupMember(params) {
        return API.call(`groups/${params.groupId}/bans`, {
            method: 'POST',
            params: {
                userId: params.userId
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // API.$emit('GROUP:MEMBER:BAN', args);
            return args;
        });
    },
    unbanGroupMember(params) {
        return API.call(`groups/${params.groupId}/bans/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // API.$emit('GROUP:MEMBER:UNBAN', args);
            return args;
        });
    },
    /**
     * @param {{ groupId: string, userId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    deleteSentGroupInvite(params) {
        return API.call(`groups/${params.groupId}/invites/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // API.$emit('GROUP:INVITE:DELETE', args);
            return args;
        });
    },
    deleteBlockedGroupRequest(params) {
        return API.call(`groups/${params.groupId}/members/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // API.$emit('GROUP:BLOCKED:DELETE', args);
            return args;
        });
    },
    acceptGroupInviteRequest(params) {
        return API.call(`groups/${params.groupId}/requests/${params.userId}`, {
            method: 'PUT',
            params: {
                action: 'accept'
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // API.$emit('GROUP:INVITE:ACCEPT', args);
            return args;
        });
    },
    rejectGroupInviteRequest(params) {
        return API.call(`groups/${params.groupId}/requests/${params.userId}`, {
            method: 'PUT',
            params: {
                action: 'reject'
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // API.$emit('GROUP:INVITE:REJECT', args);
            return args;
        });
    },
    blockGroupInviteRequest(params) {
        return API.call(`groups/${params.groupId}/requests/${params.userId}`, {
            method: 'PUT',
            params: {
                action: 'reject',
                block: true
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // API.$emit('GROUP:INVITE:BLOCK', args);
            return args;
        });
    },
    getGroupBans(params) {
        return API.call(`groups/${params.groupId}/bans`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupAuditLogTypes(params) {
        return API.call(`groups/${params.groupId}/auditLogTypes`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string, eventTypes: array }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupLogs(params) {
        return API.call(`groups/${params.groupId}/auditLogs`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupInvites(params) {
        return API.call(`groups/${params.groupId}/invites`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupJoinRequests(params) {
        return API.call(`groups/${params.groupId}/requests`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('GROUP:JOINREQUESTS', args);
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupInstances(params) {
        return API.call(
            `users/${API.currentUser.id}/instances/groups/${params.groupId}`,
            {
                method: 'GET'
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{ groupId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupRoles(params) {
        return API.call(`groups/${params.groupId}/roles`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // useless code
            // this.$emit('GROUP:ROLES', args);
            return args;
        });
    },
    getUsersGroupInstances() {
        return API.call(`users/${API.currentUser.id}/instances/groups`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            API.$emit('GROUP:USER:INSTANCES', args);
            return args;
        });
    },

    /**
     * @param {{
     query: string,
     n: number,
     offset: number,
     order: string,
     sortBy: string
     }} params
     * @return { Promise<{json: any, params}> }
     */
    groupSearch(params) {
        return API.call(`groups`, {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            return args;
        });
    },
    /**
     * @param {{
     groupId: string,
     galleryId: string,
     n: number,
     offset: number
     }} params
     * @return { Promise<{json: any, params}> }
     */
    getGroupGallery(params) {
        return API.call(
            `groups/${params.groupId}/galleries/${params.galleryId}`,
            {
                method: 'GET',
                params: {
                    n: params.n,
                    offset: params.offset
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    }

    // no place to use this
    // getRequestedGroups() {
    //     return API.call(
    //         `users/${API.currentUser.id}/groups/requested`,
    //         {
    //             method: 'GET'
    //         }
    //     ).then((json) => {
    //         const args = {
    //             json
    //         };
    //         API.$emit('GROUP:REQUESTED', args);
    //         return args;
    //     });
    // }

    // ----------------- left over code -----------------
    // /**
    // * @param {{ groupId: string }} params
    // * @return { Promise<{json: any, params}> }
    // */
    // API.getGroupAnnouncement = function (params) {
    //     return this.call(`groups/${params.groupId}/announcement`, {
    //         method: 'GET'
    //     }).then((json) => {
    //         var args = {
    //             json,
    //             params
    //         };
    //         this.$emit('GROUP:ANNOUNCEMENT', args);
    //         return args;
    //     });
    // };
};

export default groupReq;
