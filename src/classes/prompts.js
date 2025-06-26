import { worldRequest } from '../api';
import { $app, t } from '../app.js';

export default function init() {
    const _methods = {
        promptRenameWorld(world) {
            this.$prompt(
                t('prompt.rename_world.description'),
                t('prompt.rename_world.header'),
                {
                    distinguishCancelAndClose: true,
                    confirmButtonText: t('prompt.rename_world.ok'),
                    cancelButtonText: t('prompt.rename_world.cancel'),
                    inputValue: world.ref.name,
                    inputErrorMessage: t('prompt.rename_world.input_error'),
                    callback: (action, instance) => {
                        if (
                            action === 'confirm' &&
                            instance.inputValue !== world.ref.name
                        ) {
                            worldRequest
                                .saveWorld({
                                    id: world.id,
                                    name: instance.inputValue
                                })
                                .then((args) => {
                                    this.$message({
                                        message: t(
                                            'prompt.rename_world.message.success'
                                        ),
                                        type: 'success'
                                    });
                                    return args;
                                });
                        }
                    }
                }
            );
        },

        promptChangeWorldDescription(world) {
            this.$prompt(
                t('prompt.change_world_description.description'),
                t('prompt.change_world_description.header'),
                {
                    distinguishCancelAndClose: true,
                    confirmButtonText: t('prompt.change_world_description.ok'),
                    cancelButtonText: t(
                        'prompt.change_world_description.cancel'
                    ),
                    inputValue: world.ref.description,
                    inputErrorMessage: t(
                        'prompt.change_world_description.input_error'
                    ),
                    callback: (action, instance) => {
                        if (
                            action === 'confirm' &&
                            instance.inputValue !== world.ref.description
                        ) {
                            worldRequest
                                .saveWorld({
                                    id: world.id,
                                    description: instance.inputValue
                                })
                                .then((args) => {
                                    this.$message({
                                        message: t(
                                            'prompt.change_world_description.message.success'
                                        ),
                                        type: 'success'
                                    });
                                    return args;
                                });
                        }
                    }
                }
            );
        },

        promptChangeWorldCapacity(world) {
            this.$prompt(
                t('prompt.change_world_capacity.description'),
                t('prompt.change_world_capacity.header'),
                {
                    distinguishCancelAndClose: true,
                    confirmButtonText: t('prompt.change_world_capacity.ok'),
                    cancelButtonText: t('prompt.change_world_capacity.cancel'),
                    inputValue: world.ref.capacity,
                    inputPattern: /\d+$/,
                    inputErrorMessage: t(
                        'prompt.change_world_capacity.input_error'
                    ),
                    callback: (action, instance) => {
                        if (
                            action === 'confirm' &&
                            instance.inputValue !== world.ref.capacity
                        ) {
                            worldRequest
                                .saveWorld({
                                    id: world.id,
                                    capacity: instance.inputValue
                                })
                                .then((args) => {
                                    this.$message({
                                        message: t(
                                            'prompt.change_world_capacity.message.success'
                                        ),
                                        type: 'success'
                                    });
                                    return args;
                                });
                        }
                    }
                }
            );
        },

        promptChangeWorldRecommendedCapacity(world) {
            this.$prompt(
                t('prompt.change_world_recommended_capacity.description'),
                t('prompt.change_world_recommended_capacity.header'),
                {
                    distinguishCancelAndClose: true,
                    confirmButtonText: t('prompt.change_world_capacity.ok'),
                    cancelButtonText: t('prompt.change_world_capacity.cancel'),
                    inputValue: world.ref.recommendedCapacity,
                    inputPattern: /\d+$/,
                    inputErrorMessage: t(
                        'prompt.change_world_recommended_capacity.input_error'
                    ),
                    callback: (action, instance) => {
                        if (
                            action === 'confirm' &&
                            instance.inputValue !==
                                world.ref.recommendedCapacity
                        ) {
                            worldRequest
                                .saveWorld({
                                    id: world.id,
                                    recommendedCapacity: instance.inputValue
                                })
                                .then((args) => {
                                    this.$message({
                                        message: t(
                                            'prompt.change_world_recommended_capacity.message.success'
                                        ),
                                        type: 'success'
                                    });
                                    return args;
                                });
                        }
                    }
                }
            );
        },

        promptChangeWorldYouTubePreview(world) {
            this.$prompt(
                t('prompt.change_world_preview.description'),
                t('prompt.change_world_preview.header'),
                {
                    distinguishCancelAndClose: true,
                    confirmButtonText: t('prompt.change_world_preview.ok'),
                    cancelButtonText: t('prompt.change_world_preview.cancel'),
                    inputValue: world.ref.previewYoutubeId,
                    inputErrorMessage: t(
                        'prompt.change_world_preview.input_error'
                    ),
                    callback: (action, instance) => {
                        if (
                            action === 'confirm' &&
                            instance.inputValue !== world.ref.previewYoutubeId
                        ) {
                            if (instance.inputValue.length > 11) {
                                try {
                                    var url = new URL(instance.inputValue);
                                    var id1 = url.pathname;
                                    var id2 = url.searchParams.get('v');
                                    if (id1 && id1.length === 12) {
                                        instance.inputValue = id1.substring(
                                            1,
                                            12
                                        );
                                    }
                                    if (id2 && id2.length === 11) {
                                        instance.inputValue = id2;
                                    }
                                } catch {
                                    this.$message({
                                        message: t(
                                            'prompt.change_world_preview.message.error'
                                        ),
                                        type: 'error'
                                    });
                                    return;
                                }
                            }
                            if (
                                instance.inputValue !==
                                world.ref.previewYoutubeId
                            ) {
                                worldRequest
                                    .saveWorld({
                                        id: world.id,
                                        previewYoutubeId: instance.inputValue
                                    })
                                    .then((args) => {
                                        this.$message({
                                            message: t(
                                                'prompt.change_world_preview.message.success'
                                            ),
                                            type: 'success'
                                        });
                                        return args;
                                    });
                            }
                        }
                    }
                }
            );
        }
    };
    $app.methods = { ...$app.methods, ..._methods };
}
