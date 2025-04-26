<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="sendInviteConfirmDialog"
        :visible.sync="sendInviteConfirmDialog.visible"
        :title="t('dialog.invite_message.header')"
        width="400px">
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
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    const { t } = useI18n();

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

    const props = defineProps({
        sendInviteConfirmDialog: {
            type: Object,
            required: true
        }
    });

    function cancelInviteConfirm() {
        sendInviteConfirmDialog.visible = false;
    }

    function sendInviteConfirm() {
        sendInviteConfirmDialog.visible = false;
        sendInviteConfirmDialog.callback();
    }
</script>
