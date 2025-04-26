<template>
    <el-dialog
        ref="sendInviteConfirmDialog"
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible="sendInviteConfirmDialog.visible"
        :title="t('dialog.invite_message.header')"
        width="400px"
        @close="cancelInviteConfirm"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <div style="font-size: 12px">
            <span>{{ t('dialog.invite_message.confirmation') }}</span>
        </div>

        <template #footer>
            <el-button type="small" @click="cancelInviteConfirm">
                {{ t('dialog.invite_message.cancel') }}
            </el-button>
            <el-button type="primary" size="small" @click="sendInviteConfirm">
                {{ t('dialog.invite_message.confirm') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { inject, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { instanceRequest, notificationRequest } from '../../../api';
    import utils from '../../../classes/utils';
    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');
    const API = inject('API');

    const props = defineProps({
        sendInviteConfirmDialog: {
            type: Object,
            required: true
        },
        sendInviteDialog: {
            type: Object,
            required: true
        },
        inviteDialog: {
            type: Object,
            required: true
        },
        uploadImage: {
            type: String
        },
        sendInviteDialogVisible: {
            type: Boolean,
            default: false
        },
        sendInviteRequestDialogVisible: {
            type: Boolean,
            required: false
        }
    });

    const emit = defineEmits([
        'update:sendInviteConfirmDialog',
        'update:sendInviteDialogVisible',
        'update:sendInviteRequestDialogVisible'
    ]);

    function cancelInviteConfirm() {
        emit('update:sendInviteConfirmDialog', { visible: false });
    }

    function sendInviteConfirm() {
        const D = props.sendInviteDialog;
        const J = props.inviteDialog;
        if (J.visible) {
            const inviteLoop = () => {
                if (J.userIds.length > 0) {
                    const receiverUserId = J.userIds.shift();
                    if (receiverUserId === API.currentUser.id) {
                        // can't invite self!?
                        const L = utils.parseLocation(J.worldId);
                        instanceRequest
                            .selfInvite({
                                instanceId: L.instanceId,
                                worldId: L.worldId
                            })
                            .finally(inviteLoop);
                    } else if (props.uploadImage) {
                        notificationRequest
                            .sendInvitePhoto(
                                {
                                    instanceId: J.worldId,
                                    worldId: J.worldId,
                                    worldName: J.worldName,
                                    messageSlot: D.messageSlot
                                },
                                receiverUserId
                            )
                            .finally(inviteLoop);
                    } else {
                        notificationRequest
                            .sendInvite(
                                {
                                    instanceId: J.worldId,
                                    worldId: J.worldId,
                                    worldName: J.worldName,
                                    messageSlot: D.messageSlot
                                },
                                receiverUserId
                            )
                            .finally(inviteLoop);
                    }
                } else {
                    J.loading = false;
                    J.visible = false;
                    $message({
                        message: 'Invite message sent',
                        type: 'success'
                    });
                }
            };
            inviteLoop();
        } else if (D.messageType === 'invite') {
            D.params.messageSlot = D.messageSlot;
            if (props.uploadImage) {
                notificationRequest
                    .sendInvitePhoto(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        $message({
                            message: 'Invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                notificationRequest
                    .sendInvite(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        $message({
                            message: 'Invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
            }
        } else if (D.messageType === 'requestInvite') {
            D.params.requestSlot = D.messageSlot;
            if (props.uploadImage) {
                notificationRequest
                    .sendRequestInvitePhoto(D.params, D.userId)
                    .catch((err) => {
                        this.clearInviteImageUpload();
                        throw err;
                    })
                    .then((args) => {
                        $message({
                            message: 'Request invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                notificationRequest
                    .sendRequestInvite(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        $message({
                            message: 'Request invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
            }
        }
        cancelInviteConfirm();
        emit('update:sendInviteDialogVisible', false);
        emit('update:sendInviteRequestDialogVisible', false);
    }
</script>
