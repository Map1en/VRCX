<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible.sync="changeWorldImageDialogVisible"
        :title="$t('dialog.change_content_image.world')"
        width="850px"
        append-to-body
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <div v-if="changeWorldImageDialogVisible" v-loading="changeWorldImageDialogLoading">
            <input
                id="WorldImageUploadButton"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onFileChangeWorldImage" />
            <span>{{ $t('dialog.change_content_image.description') }}</span>
            <br />
            <el-button-group style="padding-bottom: 10px; padding-top: 10px">
                <el-button
                    type="default"
                    size="small"
                    icon="el-icon-refresh"
                    @click="displayPreviousImages('World', 'Change')"
                    >{{ $t('dialog.change_content_image.refresh') }}</el-button
                >
                <el-button type="default" size="small" icon="el-icon-upload2" @click="uploadWorldImage">{{
                    $t('dialog.change_content_image.upload')
                }}</el-button>
            </el-button-group>
            <br />
            <div
                v-for="image in previousImagesTable"
                v-if="image.file"
                :key="image.version"
                style="display: inline-block">
                <div
                    class="x-change-image-item"
                    style="cursor: pointer"
                    :class="{ 'current-image': compareCurrentImage(image) }"
                    @click="setWorldImage(image)">
                    <img v-lazy="image.file.url" class="image" />
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
    import { inject } from 'vue';
</script>
