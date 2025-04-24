<template>
    <el-dialog
        ref="sendInviteRequestResponseDialog"
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible.sync="sendInviteRequestResponseDialogVisible"
        :title="t('dialog.invite_request_response_message.header')"
        width="800px"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <template v-if="API.currentUser.$isVRCPlus">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <data-tables
            v-if="sendInviteRequestResponseDialogVisible"
            v-bind="inviteRequestResponseMessageTable"
            style="margin-top: 10px; cursor: pointer"
            @row-click="showSendInviteResponseConfirmDialog">
            <el-table-column :label="t('table.profile.invite_messages.slot')" prop="slot" sortable="custom" width="70">
            </el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"> </el-table-column>
            <el-table-column
                :label="t('table.profile.invite_messages.cool_down')"
                prop="updatedAt"
                sortable="custom"
                width="110"
                align="right">
                <template #default="scope">
                    <countdown-timer :datetime="scope.row.updatedAt" :hours="1"></countdown-timer>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.action')" width="70" align="right">
                <template #default="scope">
                    <el-button
                        type="text"
                        icon="el-icon-edit"
                        size="mini"
                        @click="showEditAndSendInviteResponseDialog('requestResponse', scope.row)">
                    </el-button>
                </template>
            </el-table-column>
        </data-tables>

        <template #footer>
            <el-button type="small" @click="cancelSendInviteRequestResponse">
                {{ t('dialog.invite_request_response_message.cancel') }}
            </el-button>
            <el-button type="small" @click="API.refreshInviteMessageTableData('requestResponse')">
                {{ t('dialog.invite_request_response_message.refresh') }}
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
        sendInviteRequestResponseDialogVisible: {
            type: Boolean,
            default: false
        },
        inviteRequestResponseMessageTable: {
            type: Object,
            default: () => ({})
        }
    });

    function inviteImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            API.uploadInviteImage(file);
        }
    }

    function showSendInviteResponseConfirmDialog(row) {
        API.showSendInviteResponseConfirmDialog(row);
    }

    function showEditAndSendInviteResponseDialog(type, row) {
        API.showEditAndSendInviteResponseDialog(type, row);
    }

    function cancelSendInviteRequestResponse() {
        API.cancelSendInviteRequestResponse();
    }
</script>
