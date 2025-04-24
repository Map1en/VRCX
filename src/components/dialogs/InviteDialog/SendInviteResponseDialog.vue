<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="sendInviteResponseDialog"
        :visible.sync="sendInviteResponseDialogVisible"
        :title="t('dialog.invite_response_message.header')"
        width="800px">
        <template v-if="API.currentUser.$isVRCPlus">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <data-tables
            v-if="sendInviteResponseDialogVisible"
            v-bind="inviteResponseMessageTable"
            @row-click="showSendInviteResponseConfirmDialog"
            style="margin-top: 10px; cursor: pointer">
            <el-table-column
                :label="t('table.profile.invite_messages.slot')"
                prop="slot"
                sortable="custom"
                width="70" />
            <el-table-column :label="t('table.profile.invite_messages.message')" prop="message" />
            <el-table-column
                :label="t('table.profile.invite_messages.cool_down')"
                prop="updatedAt"
                sortable="custom"
                width="110"
                align="right">
                <template #default="scope">
                    <countdown-timer :datetime="scope.row.updatedAt" :hours="1" />
                </template>
            </el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.action')" width="70" align="right">
                <template #default="scope">
                    <el-button
                        type="text"
                        icon="el-icon-edit"
                        size="mini"
                        @click="showEditAndSendInviteResponseDialog('response', scope.row)" />
                </template>
            </el-table-column>
        </data-tables>

        <template #footer>
            <el-button type="small" @click="cancelSendInviteResponse">{{
                t('dialog.invite_response_message.cancel')
            }}</el-button>
            <el-button type="small" @click="API.refreshInviteMessageTableData('response')">{{
                t('dialog.invite_response_message.refresh')
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
    const API = inject('API');
    const props = defineProps({
        sendInviteResponseDialogVisible: {
            type: Boolean,
            default: false
        },
        inviteResponseMessageTable: {
            type: Object,
            default: () => ({})
        }
    });

    function cancelSendInviteResponse() {
        API.closeDialog('sendInviteResponseDialog');
    }

    function showEditAndSendInviteResponseDialog(type, row) {
        API.showDialog('editAndSendInviteResponseDialog', { type, row });
    }

    function inviteImageUpload() {
        //
    }

    function showSendInviteResponseConfirmDialog(row) {
        API.showDialog('sendInviteResponseConfirmDialog', { row });
    }
</script>
