<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="sendInviteResponseConfirmDialog"
        :visible.sync="sendInviteResponseConfirmDialog.visible"
        :title="t('dialog.invite_response_message.header')"
        width="400px">
        <div style="font-size: 12px">
            <span>{{ t('dialog.invite_response_message.confirmation') }}</span>
        </div>

        <template v-slot:footer>
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
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    const { t } = useI18n();

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

    function cancelInviteResponseConfirm() {
        sendInviteResponseConfirmDialog.visible = false;
    }

    function sendInviteResponseConfirm() {
        sendInviteResponseConfirmDialog.visible = false;
        sendInviteResponseConfirmDialog.callback();
    }
</script>
