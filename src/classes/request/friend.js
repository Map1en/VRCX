// #region | API: Friend

const friendReq = {
    /**
     * Fetch friends of current user.
     * @param {{ n: number, offset: number, offline: boolean }} params
     * @returns {Promise<{json: any, params}>}
     */
    getFriends(params) {
        return window.API.call('auth/user/friends', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FRIEND:LIST', args);
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: T, params}>}
     */
    sendFriendRequest(params) {
        return window.API.call(`user/${params.userId}/friendRequest`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FRIEND:REQUEST', args);
            return args;
        });
    },

    /**
     * @param {{ userId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    cancelFriendRequest(params) {
        return window.API.call(`user/${params.userId}/friendRequest`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('FRIEND:REQUEST:CANCEL', args);
            return args;
        });
    }
};
// #endregion

export default friendReq;
