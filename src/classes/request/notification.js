// #region | API: Notification

const notificationReq = {
    /** @typedef {{
     *      n: number,
     *      offset: number,
     *      sent: boolean,
     *      type: string,
     *      //  (ISO8601 or 'five_minutes_ago')
     *      after: 'five_minutes_ago' | (string & {})
     }} NotificationFetchParameter */

    /**
     *
     * @param {NotificationFetchParameter} params
     * @returns {Promise<{json: any, params}>}
     */
    getNotifications(params) {
        return window.API.call('auth/user/notifications', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('NOTIFICATION:LIST', args);
            return args;
        });
    },

    getHiddenFriendRequests(params) {
        return window.API.call('auth/user/notifications', {
            method: 'GET',
            params: {
                type: 'friendRequest',
                hidden: true,
                ...params
            }
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('NOTIFICATION:LIST:HIDDEN', args);
            return args;
        });
    },

    getNotificationsV2(params) {
        return window.API.call('notifications', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            window.API.$emit('NOTIFICATION:V2:LIST', args);
            return args;
        });
    },

    // use in sendNotificationResponse
    hideNotificationV2(notificationId) {
        return window.API.call(`notifications/${notificationId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params: {
                    notificationId
                }
            };
            window.API.$emit('NOTIFICATION:V2:HIDE', args);
            return args;
        });
    },

    /**
     * @param {{
     * notificationId: string,
     * responseType: string,
     * responseData: string
     * }} params
     * @return { Promise<{json: any, params}> }
     */
    sendNotificationResponse(params) {
        return window.API.call(
            `notifications/${params.notificationId}/respond`,
            {
                method: 'POST',
                params
            }
        )
            .then((json) => {
                const args = {
                    json,
                    params
                };
                window.API.$emit('NOTIFICATION:RESPONSE', args);
                return args;
            })
            .catch((err) => {
                // TODO: need to test
                // something went wrong, lets assume it's already expired
                window.API.$emit('NOTIFICATION:HIDE', { params });
                notificationReq.hideNotificationV2(params.notificationId);
                throw err;
            });
    }

    // look like no place use this

    // API.clearNotifications = function () {
    //     return this.call('auth/user/notifications/clear', {
    //         method: 'PUT'
    //     }).then((json) => {
    //         var args = {
    //             json
    //         };
    //         // FIXME: NOTIFICATION:CLEAR 핸들링
    //         this.$emit('NOTIFICATION:CLEAR', args);
    //         return args;
    //     });
    // };
};
// #endregion

export default notificationReq;
