<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="editAndSendInviteResponseDialog"
        :visible.sync="editAndSendInviteResponseDialog.visible"
        :title="t('dialog.edit_send_invite_response_message.header')"
        width="400px">
        <div style="font-size: 12px">
            <span>{{ t('dialog.edit_send_invite_response_message.description') }}</span>
        </div>
        <el-input
            type="textarea"
            v-model="editAndSendInviteResponseDialog.newMessage"
            size="mini"
            maxlength="64"
            show-word-limit
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder=""
            style="margin-top: 10px">
        </el-input>
        <template #footer>
            <el-button type="small" @click="cancelEditAndSendInviteResponse">{{
                t('dialog.edit_send_invite_response_message.cancel')
            }}</el-button>
            <el-button type="primary" size="small" @click="saveEditAndSendInviteResponse">{{
                t('dialog.edit_send_invite_response_message.send')
            }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';

    const { t } = useI18n();

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

    const props = defineProps({
        editAndSendInviteResponseDialog: {
            type: Object,
            required: true
        }
    });

    function cancelEditAndSendInviteResponse() {
        editAndSendInviteResponseDialog.visible = false;
    }

    function saveEditAndSendInviteResponse() {
        if (editAndSendInviteResponseDialog.newMessage) {
            editAndSendInviteResponseDialog.visible = false;
            editAndSendInviteResponseDialog.callback(editAndSendInviteResponseDialog.newMessage);
        } else {
            editAndSendInviteResponseDialog.visible = true;
        }
    }
</script>
