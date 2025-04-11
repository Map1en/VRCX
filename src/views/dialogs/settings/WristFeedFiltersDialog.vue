<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        :visible.sync="wristFeedFiltersDialog.visible"
        :title="$t('dialog.shared_feed_filters.wrist')"
        width="550px"
        top="5vh">
        <div class="toggle-list" style="height: 75vh; overflow-y: auto">
            <div v-for="setting in wristSettings" :key="setting.key" class="toggle-item">
                <span class="toggle-name"
                    >{{ setting.name
                    }}<el-tooltip
                        v-if="setting.tooltip"
                        placement="top"
                        style="margin-left: 5px"
                        :content="setting.tooltip">
                        <i :class="setting.tooltipIcon || 'el-icon-info'"></i> </el-tooltip
                ></span>

                <el-radio-group
                    v-model="sharedFeedFilters.wrist[setting.key]"
                    size="mini"
                    @change="saveSharedFeedFilters">
                    <el-radio-button v-for="option in setting.options" :key="option.label" :label="option.label">
                        {{ $t(option.textKey) }}
                    </el-radio-button>
                </el-radio-group>
            </div>

            <template v-if="photonLoggingEnabled">
                <br />
                <div class="toggle-item">
                    <span class="toggle-name">Photon Event Logging</span>
                </div>
                <div v-for="setting in wristPhotonSettings" :key="setting.key" class="toggle-item">
                    <span class="toggle-name">{{ setting.name }}</span>
                    <el-radio-group
                        v-model="sharedFeedFilters.wrist[setting.key]"
                        size="mini"
                        @change="saveSharedFeedFilters">
                        <el-radio-button v-for="option in setting.options" :key="option.label" :label="option.label">
                            {{ $t(option.textKey) }}
                        </el-radio-button>
                    </el-radio-group>
                </div>
            </template>
        </div>

        <template #footer>
            <span class="dialog-footer">
                <el-button size="small" @click="resetWristFeedFilters">{{
                    $t('dialog.shared_feed_filters.reset')
                }}</el-button>
                <el-button
                    size="small"
                    type="primary"
                    style="margin-left: 10px"
                    @click="wristFeedFiltersDialog.visible = false"
                    >{{ $t('dialog.shared_feed_filters.close') }}</el-button
                >
            </span>
        </template>
    </el-dialog>
</template>

<script setup>
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

    const { t } = useI18n();
</script>
