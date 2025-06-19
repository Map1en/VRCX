import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

export const useInviteStore = defineStore('Invite', () => {
    const state = reactive({
        editInviteMessageDialog: {
            visible: false,
            inviteMessage: {},
            messageType: '',
            newMessage: ''
        }
    });

    const editInviteMessageDialog = computed({
        get: () => state.editInviteMessageDialog,
        set: (value) => {
            state.editInviteMessageDialog = value;
        }
    });

    /**
     *
     * @param {string} messageType
     * @param {string} inviteMessage
     */
    function showEditInviteMessageDialog(messageType, inviteMessage) {
        const D = state.editInviteMessageDialog;
        D.newMessage = inviteMessage.message;
        D.visible = true;
        D.inviteMessage = inviteMessage;
        D.messageType = messageType;
    }

    return { state, editInviteMessageDialog, showEditInviteMessageDialog };
});
