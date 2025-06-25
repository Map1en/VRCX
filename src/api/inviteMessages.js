import { API } from '../app';
import { request } from '../service/apiRequestHandler';

const inviteMessagesReq = {
    refreshInviteMessageTableData(messageType) {
        return request(`message/${API.currentUser.id}/${messageType}`, {
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
        return request(`message/${API.currentUser.id}/${messageType}/${slot}`, {
            method: 'PUT',
            params
        }).then((json) => {
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

export default inviteMessagesReq;
