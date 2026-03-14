<template>
    <div v-if="isMockRuntime" class="pointer-events-none fixed right-4 bottom-4 z-[90]">
        <Popover v-model:open="isOpen">
            <PopoverTrigger as-child>
                <Button
                    size="sm"
                    class="pointer-events-auto rounded-full border shadow-lg"
                    variant="secondary">
                    {{ t('mock_runtime.controls.trigger') }}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" side="top" class="pointer-events-auto w-[26rem]">
                <div class="space-y-4">
                    <div class="space-y-1">
                        <div class="font-semibold">
                            {{ t('mock_runtime.controls.title') }}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            {{ t('mock_runtime.controls.description') }}
                        </p>
                    </div>

                    <section class="space-y-2">
                        <div class="text-sm font-medium">
                            {{ t('mock_runtime.controls.data_section') }}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <label
                                v-for="field in dataFields"
                                :key="field.key"
                                class="space-y-1 text-xs text-muted-foreground">
                                <span>{{ t(field.label) }}</span>
                                <Input
                                    v-model.number="draft.data[field.key]"
                                    :step="field.step || 1"
                                    :min="field.min || 0"
                                    type="number"
                                    class="h-8" />
                            </label>
                        </div>
                    </section>

                    <section class="space-y-2">
                        <div class="text-sm font-medium">
                            {{ t('mock_runtime.controls.ws_section') }}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <label
                                v-for="field in wsFields"
                                :key="field.key"
                                class="space-y-1 text-xs text-muted-foreground">
                                <span>{{ t(field.label) }}</span>
                                <Input
                                    v-model.number="draft.ws[field.key]"
                                    :step="field.step || 1"
                                    :min="field.min || 0"
                                    type="number"
                                    class="h-8" />
                            </label>
                        </div>
                    </section>

                    <section class="space-y-2">
                        <div class="text-sm font-medium">
                            {{ t('mock_runtime.controls.log_section') }}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <label
                                v-for="field in logFields"
                                :key="field.key"
                                class="space-y-1 text-xs text-muted-foreground">
                                <span>{{ t(field.label) }}</span>
                                <Input
                                    v-model.number="draft.log[field.key]"
                                    :step="field.step || 1"
                                    :min="field.min || 0"
                                    type="number"
                                    class="h-8" />
                            </label>
                        </div>
                    </section>

                    <div class="flex justify-between gap-2">
                        <Button variant="outline" size="sm" @click="applyWsOnly">
                            {{ t('mock_runtime.controls.apply_ws') }}
                        </Button>
                        <Button variant="outline" size="sm" @click="resetAndReload">
                            {{ t('mock_runtime.controls.reset_reload') }}
                        </Button>
                        <Button size="sm" @click="applyAndReload">
                            {{ t('mock_runtime.controls.apply_reload') }}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    </div>
</template>

<script setup>
    import { reactive, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

    import { getMockSettingsSnapshot, resetMockSettings, saveMockSettings } from './config';
    import { isMockRuntime } from './mode';

    const { t } = useI18n();

    const isOpen = ref(false);
    const draft = reactive(getMockSettingsSnapshot());

    const dataFields = [
        { key: 'friendCount', label: 'mock_runtime.controls.friend_count', min: 1 },
        { key: 'groupCount', label: 'mock_runtime.controls.group_count', min: 1 },
        { key: 'worldCount', label: 'mock_runtime.controls.world_count', min: 3 },
        { key: 'avatarCount', label: 'mock_runtime.controls.avatar_count', min: 8 },
        { key: 'instanceCount', label: 'mock_runtime.controls.instance_count', min: 3 },
        { key: 'onlineRatio', label: 'mock_runtime.controls.online_ratio', min: 0, step: 0.01 },
        { key: 'activeRatio', label: 'mock_runtime.controls.active_ratio', min: 0, step: 0.01 },
        { key: 'travelingRatio', label: 'mock_runtime.controls.traveling_ratio', min: 0, step: 0.01 }
    ];

    const wsFields = [
        { key: 'intervalMs', label: 'mock_runtime.controls.interval_ms', min: 50 },
        { key: 'batchSize', label: 'mock_runtime.controls.batch_size', min: 1 },
        { key: 'cohortSize', label: 'mock_runtime.controls.cohort_size', min: 2 },
        { key: 'locationWeight', label: 'mock_runtime.controls.location_weight', min: 0 },
        { key: 'onlineWeight', label: 'mock_runtime.controls.online_weight', min: 0 },
        { key: 'offlineWeight', label: 'mock_runtime.controls.offline_weight', min: 0 },
        { key: 'updateWeight', label: 'mock_runtime.controls.update_weight', min: 0 },
        { key: 'activeWeight', label: 'mock_runtime.controls.active_weight', min: 0 },
        { key: 'clusterWeight', label: 'mock_runtime.controls.cluster_weight', min: 0 },
        { key: 'splitWeight', label: 'mock_runtime.controls.split_weight', min: 0 },
        { key: 'chaosWeight', label: 'mock_runtime.controls.chaos_weight', min: 0 }
    ];

    const logFields = [
        { key: 'intervalMs', label: 'mock_runtime.controls.log_interval_ms', min: 250 },
        { key: 'batchSize', label: 'mock_runtime.controls.log_batch_size', min: 1 },
        { key: 'minPlayers', label: 'mock_runtime.controls.log_min_players', min: 1 },
        { key: 'maxPlayers', label: 'mock_runtime.controls.log_max_players', min: 2 },
        { key: 'joinWeight', label: 'mock_runtime.controls.log_join_weight', min: 0 },
        { key: 'leaveWeight', label: 'mock_runtime.controls.log_leave_weight', min: 0 },
        { key: 'avatarWeight', label: 'mock_runtime.controls.log_avatar_weight', min: 0 },
        { key: 'portalWeight', label: 'mock_runtime.controls.log_portal_weight', min: 0 },
        { key: 'videoWeight', label: 'mock_runtime.controls.log_video_weight', min: 0 },
        { key: 'photonWeight', label: 'mock_runtime.controls.log_photon_weight', min: 0 },
        { key: 'stickerWeight', label: 'mock_runtime.controls.log_sticker_weight', min: 0 },
        { key: 'travelWeight', label: 'mock_runtime.controls.log_travel_weight', min: 0 }
    ];

    function syncDraft() {
        const snapshot = getMockSettingsSnapshot();
        Object.assign(draft.data, snapshot.data);
        Object.assign(draft.ws, snapshot.ws);
        Object.assign(draft.log, snapshot.log);
    }

    function applyWsOnly() {
        saveMockSettings({ ws: draft.ws, log: draft.log });
        syncDraft();
    }

    function applyAndReload() {
        saveMockSettings(draft);
        window.location.reload();
    }

    function resetAndReload() {
        resetMockSettings();
        syncDraft();
        window.location.reload();
    }
</script>
