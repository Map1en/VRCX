<template>
    <el-dialog
        ref="sendInviteResponseConfirmDialog"
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible="sendInviteResponseConfirmDialog.visible"
        :title="t('dialog.invite_response_message.header')"
        width="400px"
        @close="cancelInviteResponseConfirm"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <div style="font-size: 12px">
            <span>{{ t('dialog.invite_response_message.confirmation') }}</span>
        </div>

        <template #footer>
            <el-button type="small" @click="cancelInviteResponseConfirm">{{
                t('dialog.invite_response_message.cancel')
            }}</el-button>
            <el-button type="primary" size="small" @click="sendInviteResponseConfirm">{{
                t('dialog.invite_response_message.confirm')
            }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { getCurrentInstance, inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { notificationRequest } from '../../../api';
    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

    const props = defineProps({
        sendInviteResponseConfirmDialog: {
            type: Object,
            required: true
        },
        uploadImage: {
            type: String
        },
        sendInviteResponseDialogVisible: {
            type: Boolean,
            default: false
        },
        sendInviteRequestResponseDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits([
        'update:sendInviteResponseConfirmDialog',
        'update:sendInviteResponseDialogVisible',
        'update:sendInviteRequestResponseDialogVisible'
    ]);

    function cancelInviteResponseConfirm() {
        emit('update:sendInviteResponseConfirmDialog', { visible: false });
    }

    function sendInviteResponseConfirm() {
        const D = props.sendInviteResponseDialog;
        const params = {
            responseSlot: D.messageSlot,
            rsvp: true
        };
        if (props.uploadImage) {
            notificationRequest
                .sendInviteResponsePhoto(params, D.invite.id, D.messageType)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: D.invite.id
                    });
                    $message({
                        message: 'Invite response photo message sent',
                        type: 'success'
                    });
                    return args;
                });
        } else {
            notificationRequest
                .sendInviteResponse(params, D.invite.id, D.messageType)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: D.invite.id
                    });
                    $message({
                        message: 'Invite response message sent',
                        type: 'success'
                    });
                    return args;
                });
        }
        emit('update:sendInviteResponseDialogVisible', false);
        emit('update:sendInviteRequestResponseDialogVisible', false);
        emit('update:sendInviteResponseConfirmDialog', { visible: false });
    }
</script>
