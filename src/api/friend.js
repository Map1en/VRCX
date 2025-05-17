import { API } from '../app';

// #region | API: Friend
const friendReq = {
    /**
     * Fetch friends of current user.
     * @param {{ n: number, offset: number, offline: boolean }} params
     * @returns {Promise<{json: any, params}>}
     */
    getFriends(params) {
        return API.call('auth/user/friends', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('FRIEND:LIST', args);
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: T, params}>}
     */
    sendFriendRequest(params) {
        return API.call(`user/${params.userId}/friendRequest`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('FRIEND:REQUEST', args);
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    cancelFriendRequest(params) {
        return API.call(`user/${params.userId}/friendRequest`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('FRIEND:REQUEST:CANCEL', args);
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    deleteFriend(params) {
        return API.call(`auth/user/friends/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('FRIEND:DELETE', args);
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getFriendStatus(params) {
        return API.call(`user/${params.userId}/friendStatus`, {
            method: 'GET'
        }).then((json) => {
            console.log('getFriendStatus', json);
            const args = {
                json,
                params
            };
            API.$emit('FRIEND:STATUS', args);
            return args;
        });
    },

    // ------------------- need to test -------------------

    deleteHiddenFriendRequest(params, userId) {
        return API.call(`user/${userId}/friendRequest`, {
            method: 'DELETE',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                userId
            };
            API.$emit('NOTIFICATION:HIDE', args);
            return args;
        });
    }
};
// #endregion

export default friendReq;
