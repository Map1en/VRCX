<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="editAndSendInviteDialog"
        :visible.sync="editAndSendInviteDialog.visible"
        :title="t('dialog.edit_send_invite_message.header')"
        width="400px">
        <div style="font-size: 12px">
            <span>{{ t('dialog.edit_send_invite_message.description') }}</span>
        </div>

        <el-input
            type="textarea"
            v-model="editAndSendInviteDialog.newMessage"
            size="mini"
            maxlength="64"
            show-word-limit
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder=""
            style="margin-top: 10px"></el-input>

        <template #footer>
            <el-button type="small" @click="cancelEditAndSendInvite">
                {{ t('dialog.edit_send_invite_message.cancel') }}
            </el-button>
            <el-button type="primary" size="small" @click="saveEditAndSendInvite">
                {{ t('dialog.edit_send_invite_message.send') }}
            </el-button>
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
        editAndSendInviteDialog: {
            type: Object,
            required: true
        }
    });

    function cancelEditAndSendInvite() {
        editAndSendInviteDialog.visible = false;
    }

    function saveEditAndSendInvite() {
        editAndSendInviteDialog.visible = false;
        editAndSendInviteDialog.onSave(editAndSendInviteDialog.newMessage);
    }
</script>
