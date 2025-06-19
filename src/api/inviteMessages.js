import { API } from '../app';

// #region | App: Invite Messages
const inviteMessagesReq = {
    refreshInviteMessageTableData(messageType) {
        return API.call(`message/${API.currentUser.id}/${messageType}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                messageType
            };
            return args;
        });
    },

    editInviteMessage(params, messageType, slot) {
        return API.call(
            `message/${API.currentUser.id}/${messageType}/${slot}`,
            {
                method: 'PUT',
                params
            }
        ).then((json) => {
            const args = {
                json,
                params,
                messageType,
                slot
            };
            return args;
        });
    }
};

// #endregion

export default inviteMessagesReq;
