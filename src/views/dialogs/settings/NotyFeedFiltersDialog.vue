<template>
    <el-dialog
        ref="notyFeedFiltersDialogRef"
        :before-close="beforeDialogClose"
        :visible="notyFeedFiltersDialogVisible"
        :title="t('dialog.shared_feed_filters.notification')"
        width="550px"
        top="5vh"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        @close="handleDialogClose">
        <div class="toggle-list" style="height: 75vh; overflow-y: auto">
            <div v-for="setting in notificationSettings" :key="setting.key" class="toggle-item">
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
                    v-model="sharedFeedFilters.noty[setting.key]"
                    size="mini"
                    @change="saveSharedFeedFilters">
                    <el-radio-button v-for="option in setting.options" :key="option.label" :label="option.label">
                        {{ t(option.textKey) }}
                    </el-radio-button>
                </el-radio-group>
            </div>

            <template v-if="props.photonLoggingEnabled">
                <br />
                <div class="toggle-item">
                    <span class="toggle-name">Photon Event Logging</span>
                </div>
                <div v-for="setting in photonSettings" :key="setting.key" class="toggle-item">
                    <span class="toggle-name">{{ setting.name }}</span>
                    <el-radio-group
                        v-model="sharedFeedFilters.noty[setting.key]"
                        size="mini"
                        @change="saveSharedFeedFilters">
                        <el-radio-button v-for="option in setting.options" :key="option.label" :label="option.label">
                            {{ t(option.textKey) }}
                        </el-radio-button>
                    </el-radio-group>
                </div>
            </template>
        </div>

        <template #footer>
            <el-button size="small" @click="resetNotyFeedFilters">{{
                t('dialog.shared_feed_filters.reset')
            }}</el-button>
            <el-button size="small" type="primary" style="margin-left: 10px" @click="handleDialogClose">{{
                t('dialog.shared_feed_filters.close')
            }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import configRepository from '../../../repository/config';
    import { useNotifyFeedFiltersOptions } from '../../../composables/settings/useFeedFilters';

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

    const { t } = useI18n();

    const { notificationSettings, photonSettings } = useNotifyFeedFiltersOptions();

    const props = defineProps({
        notyFeedFiltersDialogVisible: {
            type: Boolean,
            required: true
        },
        photonLoggingEnabled: {
            type: Boolean,
            default: false
        },
        sharedFeedFilters: {
            type: Object,
            default: () => ({
                noty: {},
                wrist: {}
            })
        },
        sharedFeedFiltersDefaults: {
            type: Object,
            default: () => ({
                noty: {},
                wrist: {}
            })
        }
    });

    const emit = defineEmits(['update:notyFeedFiltersDialogVisible', 'updateSharedFeed']);

    function saveSharedFeedFilters() {
        configRepository.setString('sharedFeedFilters', JSON.stringify(props.sharedFeedFilters));
        emit('updateSharedFeed', true);
    }

    function resetNotyFeedFilters() {
        props.sharedFeedFilters.noty = {
            ...props.sharedFeedFiltersDefaults.noty
        };
        saveSharedFeedFilters();
    }

    function handleDialogClose() {
        emit('update:notyFeedFiltersDialogVisible', false);
    }
</script>
