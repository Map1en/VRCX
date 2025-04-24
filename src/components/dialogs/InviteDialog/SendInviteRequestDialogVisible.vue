<template>
    <el-dialog
        ref="sendInviteRequestDialog"
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible.sync="sendInviteRequestDialogVisible"
        :title="t('dialog.invite_request_message.header')"
        width="800px"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <template v-if="API.currentUser.$isVRCPlus">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <data-tables
            v-if="sendInviteRequestDialogVisible"
            v-bind="inviteRequestMessageTable"
            style="margin-top: 10px; cursor: pointer"
            @row-click="showSendInviteConfirmDialog">
            <el-table-column
                :label="t('table.profile.invite_messages.slot')"
                prop="slot"
                sortable="custom"
                width="70"></el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
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
                        @click="showEditAndSendInviteDialog('request', scope.row)"></el-button>
                </template>
            </el-table-column>
        </data-tables>

        <template #footer>
            <el-button type="small" @click="cancelSendInviteRequest">{{
                t('dialog.invite_request_message.cancel')
            }}</el-button>
            <el-button type="small" @click="API.refreshInviteMessageTableData('request')">{{
                t('dialog.invite_request_message.refresh')
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
        sendInviteRequestDialogVisible: {
            type: Boolean,
            default: false
        },
        inviteRequestMessageTable: {
            type: Object,
            default: () => ({})
        }
    });

    function inviteImageUpload() {
        //
    }

    function showSendInviteConfirmDialog(row) {
        API.showSendInviteConfirmDialog('request', row);
    }

    function showEditAndSendInviteDialog(type, row) {
        API.showEditAndSendInviteDialog(type, row);
    }

    function cancelSendInviteRequest() {
        API.cancelSendInviteRequest();
    }
</script>
