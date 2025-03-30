<template>
    <el-dialog
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="groupPostEditDialog"
        :visible.sync="groupPostEditDialog.visible"
        :title="$t('dialog.group_post_edit.header')"
        width="650px">
        <div v-if="groupPostEditDialog.visible">
            <h3 v-text="groupPostEditDialog.groupRef.name"></h3>
            <el-form :model="groupPostEditDialog" label-width="150px">
                <el-form-item :label="$t('dialog.group_post_edit.title')">
                    <el-input v-model="groupPostEditDialog.title" size="mini"></el-input>
                </el-form-item>
                <el-form-item :label="$t('dialog.group_post_edit.message')">
                    <el-input
                        v-model="groupPostEditDialog.text"
                        type="textarea"
                        :rows="4"
                        :autosize="{ minRows: 4, maxRows: 20 }"
                        style="margin-top: 10px"
                        resize="none"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-checkbox
                        v-if="!groupPostEditDialog.postId"
                        v-model="groupPostEditDialog.sendNotification"
                        size="small">
                        {{ $t('dialog.group_post_edit.send_notification') }}
                    </el-checkbox>
                </el-form-item>
                <el-form-item :label="$t('dialog.group_post_edit.post_visibility')">
                    <el-radio-group v-model="groupPostEditDialog.visibility" size="small">
                        <el-radio label="public">
                            {{ $t('dialog.group_post_edit.visibility_public') }}
                        </el-radio>
                        <el-radio label="group">
                            {{ $t('dialog.group_post_edit.visibility_group') }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item
                    v-if="groupPostEditDialog.visibility === 'group'"
                    :label="$t('dialog.new_instance.roles')">
                    <el-select
                        v-model="groupPostEditDialog.roleIds"
                        multiple
                        clearable
                        :placeholder="$t('dialog.new_instance.role_placeholder')"
                        style="width: 100%">
                        <el-option-group :label="$t('dialog.new_instance.role_placeholder')">
                            <el-option
                                v-for="role in groupPostEditDialog.groupRef?.roles"
                                :key="role.id"
                                :label="role.name"
                                :value="role.id"
                                style="height: auto; width: 478px">
                                <div class="detail">
                                    <span class="name" v-text="role.name"></span>
                                </div>
                            </el-option>
                        </el-option-group>
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('dialog.group_post_edit.image')">
                    <template v-if="gallerySelectDialog.selectedFileId">
                        <div style="display: inline-block; flex: none; margin-right: 5px">
                            <el-popover placement="right" width="500px" trigger="click">
                                <img
                                    slot="reference"
                                    v-lazy="gallerySelectDialog.selectedImageUrl"
                                    style="
                                        flex: none;
                                        width: 60px;
                                        height: 60px;
                                        border-radius: 4px;
                                        object-fit: cover;
                                    " />
                                <img
                                    v-lazy="gallerySelectDialog.selectedImageUrl"
                                    style="height: 500px"
                                    @click="showFullscreenImageDialog(gallerySelectDialog.selectedImageUrl)" />
                            </el-popover>
                            <el-button size="mini" @click="clearImageGallerySelect" style="vertical-align: top">
                                {{ $t('dialog.invite_message.clear_selected_image') }}
                            </el-button>
                        </div>
                    </template>
                    <template v-else>
                        <el-button size="mini" @click="showGallerySelectDialog" style="margin-right: 5px">
                            {{ $t('dialog.invite_message.select_image') }}
                        </el-button>
                    </template>
                </el-form-item>
            </el-form>
        </div>
        <template #footer>
            <el-button size="small" @click="groupPostEditDialog.visible = false">
                {{ $t('dialog.group_post_edit.cancel') }}
            </el-button>
            <el-button v-if="groupPostEditDialog.postId" size="small" @click="editGroupPost">
                {{ $t('dialog.group_post_edit.edit_post') }}
            </el-button>
            <el-button v-else size="small" @click="createGroupPost">
                {{ $t('dialog.group_post_edit.create_post') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script>
    export default {
        name: 'GroupPostEditDialog',
        inject: ['beforeDialogClose', 'showFullscreenImageDialog', 'dialogMouseDown', 'dialogMouseUp'],
        props: {
            groupPostEditDialog: {
                type: Object,
                required: true
            },
            gallerySelectDialog: {
                type: Object,
                required: true
            },
            clearImageGallerySelect: {
                type: Function,
                required: true
            },
            showGallerySelectDialog: {
                type: Function,
                required: true
            },
            editGroupPost: {
                type: Function,
                required: true
            },
            createGroupPost: {
                type: Function,
                required: true
            }
        }
    };
</script>
