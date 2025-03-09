<template>
    <el-dialog :visible.sync="avatarExportDialogVisible" :title="$t('dialog.avatar_export.header')" width="650px">
        <el-checkbox-group
            v-model="exportSelectedOptions"
            style="margin-bottom: 10px"
            @change="updateAvatarExportDialog()">
            <template v-for="option in exportSelectOptions">
                <el-checkbox :key="option.value" :label="option.label"></el-checkbox>
            </template>
        </el-checkbox-group>

        <el-dropdown trigger="click" size="small" @click.native.stop>
            <el-button size="mini">
                <span v-if="avatarExportFavoriteGroup">
                    {{ avatarExportFavoriteGroup.displayName }} ({{ avatarExportFavoriteGroup.count }}/{{
                        avatarExportFavoriteGroup.capacity
                    }})
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <span v-else>
                    All Favorites
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
            </el-button>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item style="display: block; margin: 10px 0" @click.native="selectAvatarExportGroup(null)">
                    All Favorites
                </el-dropdown-item>
                <template v-for="groupAPI in API.favoriteAvatarGroups">
                    <el-dropdown-item
                        :key="groupAPI.name"
                        style="display: block; margin: 10px 0"
                        @click.native="selectAvatarExportGroup(groupAPI)">
                        {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </el-dropdown>

        <el-dropdown trigger="click" size="small" style="margin-left: 10px" @click.native.stop>
            <el-button size="mini">
                <span v-if="avatarExportLocalFavoriteGroup">
                    {{ avatarExportLocalFavoriteGroup }} ({{
                        getLocalAvatarFavoriteGroupLength(avatarExportLocalFavoriteGroup)
                    }})
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <span v-else>
                    Select Group
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
            </el-button>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                    style="display: block; margin: 10px 0"
                    @click.native="selectAvatarExportLocalGroup(null)">
                    None
                </el-dropdown-item>
                <template v-for="group in localAvatarFavoriteGroups">
                    <el-dropdown-item
                        :key="group"
                        style="display: block; margin: 10px 0"
                        @click.native="selectAvatarExportLocalGroup(group)">
                        {{ group }} ({{ getLocalAvatarFavoriteGroupLength(group) }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </el-dropdown>
        <br />
        <el-input
            v-model="avatarExportContent"
            type="textarea"
            size="mini"
            rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click.native="handleCopyAvatarExportData"></el-input>
    </el-dialog>
</template>

<script>
    export default {
        name: 'AvatarExportDialog',
        inject: ['API'],
        props: {
            avatarExportDialogVisible: Boolean,
            exportSelectedOptions: Array,
            exportSelectOptions: Array,
            avatarExportFavoriteGroup: Object,
            avatarExportLocalFavoriteGroup: String,
            getLocalAvatarFavoriteGroupLength: Function
        },
        data() {
            return {
                avatarExportContent: ''
            };
        },
        methods: {
            updateAvatarExportDialog() {
                this.$emit('update-avatar-export-dialog');
            },
            selectAvatarExportGroup() {
                this.$emit('select-avatar-export-group');
            },
            selectAvatarExportLocalGroup(group) {
                this.$emit('select-avatar-export-local-group', group);
            },
            handleCopyAvatarExportData() {
                this.$emit('handle-copy-avatar-export-data');
            }
        }
    };
</script>
