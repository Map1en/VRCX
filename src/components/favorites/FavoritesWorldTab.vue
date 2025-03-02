<template>
    <div>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
                <el-button size="small" @click="showWorldExportDialog">{{ $t('view.favorite.export') }}</el-button>
                <el-button size="small" @click="showWorldImportDialog" style="margin-left: 5px">{{
                    $t('view.favorite.import')
                }}</el-button>
            </div>
            <div style="display: flex; align-items: center; font-size: 13px; margin-right: 10px">
                <span class="name" style="margin-right: 5px; line-height: 10px">{{ $t('view.favorite.sort_by') }}</span>
                <el-radio-group v-model="sortFavorites" @change="saveSortFavoritesOption" style="margin-right: 12px">
                    <el-radio :label="false">{{
                        $t('view.settings.appearance.appearance.sort_favorite_by_name')
                    }}</el-radio>
                    <el-radio :label="true">{{
                        $t('view.settings.appearance.appearance.sort_favorite_by_date')
                    }}</el-radio>
                </el-radio-group>
                <el-input
                    v-model="worldFavoriteSearch"
                    @input="searchWorldFavorites"
                    clearable
                    size="mini"
                    :placeholder="$t('view.favorite.worlds.search')"
                    style="width: 200px" />
            </div>
        </div>
        <div class="x-friend-list" style="margin-top: 10px">
            <div
                style="display: inline-block; width: 300px; margin-right: 15px"
                v-for="favorite in worldFavoriteSearchResults"
                :key="favorite.id"
                @click="showWorldDialog(favorite.id)">
                <div class="x-friend-item">
                    <template v-if="favorite.name">
                        <div class="avatar">
                            <img v-lazy="favorite.thumbnailImageUrl" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="favorite.name"></span>
                            <span class="extra" v-if="favorite.occupants"
                                >{{ favorite.authorName }} ({{ favorite.occupants }})</span
                            >
                            <span class="extra" v-else v-text="favorite.authorName"></span>
                        </div>
                    </template>
                    <template v-else>
                        <div class="avatar"></div>
                        <div class="detail">
                            <span v-text="favorite.id"></span>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <span style="display: block; margin-top: 20px">{{ $t('view.favorite.worlds.vrchat_favorites') }}</span>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in API.favoriteWorldGroups" :key="group.name">
                <template slot="title">
                    <div style="display: flex; align-items: center">
                        <span
                            v-text="group.displayName"
                            style="font-weight: bold; font-size: 14px; margin-left: 10px" />
                        <el-tag
                            style="margin: 1px 0 0 5px"
                            size="mini"
                            :type="userFavoriteWorldsStatusForFavTab(group.visibility)"
                            effect="plain"
                            >{{ group.visibility.charAt(0).toUpperCase() + group.visibility.slice(1) }}</el-tag
                        >
                        <span style="color: #909399; font-size: 12px; margin-left: 10px"
                            >{{ group.count }}/{{ group.capacity }}</span
                        >
                        <el-dropdown trigger="click" @click.native.stop size="mini" style="margin-left: 10px">
                            <el-tooltip
                                placement="top"
                                :content="$t('view.favorite.visibility_tooltip')"
                                :disabled="hideTooltips">
                                <el-button type="default" icon="el-icon-view" size="mini" circle />
                            </el-tooltip>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item
                                    v-if="group.visibility !== visibility"
                                    v-for="visibility in worldGroupVisibilityOptions"
                                    :key="visibility"
                                    style="display: block; margin: 10px 0"
                                    v-text="visibility.charAt(0).toUpperCase() + visibility.slice(1)"
                                    @click.native="changeWorldGroupVisibility(group.name, visibility)" />
                            </el-dropdown-menu>
                            <el-tooltip
                                placement="top"
                                :content="$t('view.favorite.rename_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    @click.stop="changeFavoriteGroupName(group)"
                                    size="mini"
                                    icon="el-icon-edit"
                                    circle
                                    style="margin-left: 5px" />
                            </el-tooltip>
                            <el-tooltip
                                placement="right"
                                :content="$t('view.favorite.clear_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    @click.stop="clearFavoriteGroup(group)"
                                    size="mini"
                                    icon="el-icon-delete"
                                    circle
                                    style="margin-left: 5px" />
                            </el-tooltip>
                        </el-dropdown>
                    </div>
                </template>
                <div class="x-friend-list" v-if="group.count" style="margin-top: 10px">
                    <favorites-world-item
                        v-for="favorite in groupedByGroupKeyFavoriteWorlds[group.key]"
                        :key="favorite.id"
                        :group="group"
                        :favorite="favorite"
                        :edit-favorites-mode="editFavoritesMode"
                        :hide-tooltips="hideTooltips"
                        :shift-held="shiftHeld"
                        @click="showWorldDialog(favorite.id)"
                        @handle-select="favorite.$selected = $event"
                        @new-instance-self-invite="newInstanceSelfInvite"
                        @show-favorite-dialog="showFavoriteDialog" />
                </div>
                <div
                    v-else
                    style="
                        padding-top: 25px;
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgb(144, 147, 153);
                    ">
                    <span>No Data</span>
                </div>
            </el-collapse-item>
        </el-collapse>
        <span style="display: block; margin-top: 20px">{{ $t('view.favorite.worlds.local_favorites') }}</span>
        <br />
        <el-button size="small" @click="promptNewLocalWorldFavoriteGroup">{{
            $t('view.favorite.worlds.new_group')
        }}</el-button>
        <el-button
            v-if="!refreshingLocalFavorites"
            size="small"
            @click="refreshLocalWorldFavorites"
            style="margin-left: 5px"
            >{{ $t('view.favorite.worlds.refresh') }}</el-button
        >
        <el-button v-else size="small" @click="refreshingLocalFavorites = false" style="margin-left: 5px">
            <i class="el-icon-loading" style="margin-right: 5px" />
            <span>{{ $t('view.favorite.worlds.cancel_refresh') }}</span>
        </el-button>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in localWorldFavoriteGroups" v-if="localWorldFavorites[group]" :key="group">
                <template slot="title">
                    <span v-text="group" style="font-weight: bold; font-size: 14px; margin-left: 10px" />
                    <span style="color: #909399; font-size: 12px; margin-left: 10px">{{
                        getLocalWorldFavoriteGroupLength(group)
                    }}</span>
                    <el-tooltip placement="top" :content="$t('view.favorite.rename_tooltip')" :disabled="hideTooltips">
                        <el-button
                            @click.stop="promptLocalWorldFavoriteGroupRename(group)"
                            size="mini"
                            icon="el-icon-edit"
                            circle
                            style="margin-left: 10px" />
                    </el-tooltip>
                    <el-tooltip
                        placement="right"
                        :content="$t('view.favorite.delete_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            @click.stop="promptLocalWorldFavoriteGroupDelete(group)"
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px" />
                    </el-tooltip>
                </template>
                <div
                    class="x-friend-list"
                    style="margin-top: 10px"
                    v-if="localFavoriteShowDelayedContent[0] && localWorldFavorites[group].length">
                    <favorites-world-item
                        v-for="favorite in localWorldFavorites[group]"
                        :key="favorite.id"
                        is-local-favorite
                        :group="group"
                        :favorite="favorite"
                        :edit-favorites-mode="editFavoritesMode"
                        :hide-tooltips="hideTooltips"
                        :shift-held="shiftHeld"
                        @click="showWorldDialog(favorite.id)"
                        @add-favorite-world="addFavoriteWorld"
                        @new-instance-self-invite="newInstanceSelfInvite"
                        @remove-local-world-favorite="removeLocalWorldFavorite"
                        @show-favorite-dialog="showFavoriteDialog" />
                </div>
                <div
                    v-else
                    style="
                        padding-top: 25px;
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgb(144, 147, 153);
                    ">
                    <span>No Data</span>
                </div>
            </el-collapse-item>
        </el-collapse>
    </div>
</template>

<script>
    import FavoritesWorldItem from './FavoritesWorldItem.vue';
    export default {
        name: 'FavoritesWorldTab',
        components: {
            FavoritesWorldItem
        },
        inject: ['API'],
        props: {
            // on
            showWorldExportDialog: Function,
            showWorldImportDialog: Function,
            saveSortFavoritesOption: Function,
            showWorldDialog: Function,
            changeFavoriteGroupName: Function,
            clearFavoriteGroup: Function,
            newInstanceSelfInvite: Function,
            showFavoriteDialog: Function,
            newLocalWorldFavoriteGroup: Function,
            refreshLocalWorldFavorites: Function,
            renameLocalWorldFavoriteGroup: Function,
            deleteLocalAvatarFavoriteGroup: Function,

            // computed sync
            sortFavorites: Boolean,

            // local
            worldFavoriteSearch: String,

            // args: worldFavoriteSearch
            searchWorldFavorites: Function,

            worldFavoriteSearchResults: Array,

            // userFavoriteWorldsStatusForFavTab: Function,

            hideTooltips: Boolean,

            favoriteWorlds: Array,

            // worldGroupVisibilityOptions: Array,
            // changeWorldGroupVisibility: Function,

            // groupedByGroupKeyFavoriteWorlds: Object,
            editFavoritesMode: Boolean,
            shiftHeld: Boolean,

            refreshingLocalFavorites: Boolean,

            localWorldFavoriteGroups: Array,
            localWorldFavorites: Object,

            getLocalWorldFavoriteGroupLength: Function,
            // promptLocalWorldFavoriteGroupRename: Function,
            // promptLocalAvatarFavoriteGroupDelete: Function,
            localFavoriteShowDelayedContent: Array,

            addFavoriteWorld: Function,

            removeLocalWorldFavorite: Function
        },
        data() {
            worldGroupVisibilityOptions: ['private', 'friends', 'public'];
        },
        computed: {
            groupedByGroupKeyFavoriteWorlds() {
                const groupedByGroupKeyFavoriteWorlds = {};

                this.favoriteWorlds.forEach((world) => {
                    if (world.groupKey) {
                        if (!groupedByGroupKeyFavoriteWorlds[world.groupKey]) {
                            groupedByGroupKeyFavoriteWorlds[world.groupKey] = [];
                        }
                        groupedByGroupKeyFavoriteWorlds[world.groupKey].push(world);
                    }
                });

                return groupedByGroupKeyFavoriteWorlds;
            }
        },
        methods: {
            userFavoriteWorldsStatusForFavTab(visibility) {
                let style = '';
                if (visibility === 'public') {
                    style = '';
                } else if (visibility === 'friends') {
                    style = 'success';
                } else {
                    style = 'info';
                }
                return style;
            },
            changeWorldGroupVisibility(name, visibility) {
                const params = {
                    type: 'world',
                    group: name,
                    visibility
                };
                // check splitting API requests PR #1166
                this.API.saveFavoriteGroup(params).then((args) => {
                    this.$message({
                        message: 'Group visibility changed',
                        type: 'success'
                    });
                    return args;
                });
            },
            promptNewLocalWorldFavoriteGroup() {
                this.$prompt(
                    $t('prompt.new_local_favorite_group.description'),
                    $t('prompt.new_local_favorite_group.header'),
                    {
                        distinguishCancelAndClose: true,
                        confirmButtonText: $t('prompt.new_local_favorite_group.ok'),
                        cancelButtonText: $t('prompt.new_local_favorite_group.cancel'),
                        inputPattern: /\S+/,
                        inputErrorMessage: $t('prompt.new_local_favorite_group.input_error'),
                        callback: (action, instance) => {
                            if (action === 'confirm' && instance.inputValue) {
                                this.newLocalWorldFavoriteGroup(instance.inputValue);
                            }
                        }
                    }
                );
            },
            promptLocalWorldFavoriteGroupRename(group) {
                this.$prompt(
                    $t('prompt.local_favorite_group_rename.description'),
                    $t('prompt.local_favorite_group_rename.header'),
                    {
                        distinguishCancelAndClose: true,
                        confirmButtonText: $t('prompt.local_favorite_group_rename.save'),
                        cancelButtonText: $t('prompt.local_favorite_group_rename.cancel'),
                        inputPattern: /\S+/,
                        inputErrorMessage: $t('prompt.local_favorite_group_rename.input_error'),
                        inputValue: group,
                        callback: (action, instance) => {
                            if (action === 'confirm' && instance.inputValue) {
                                this.renameLocalWorldFavoriteGroup(instance.inputValue, group);
                            }
                        }
                    }
                );
            },
            promptLocalAvatarFavoriteGroupDelete(group) {
                this.$confirm(`Delete Group? ${group}`, 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            this.deleteLocalAvatarFavoriteGroup(group);
                        }
                    }
                });
            }
        }
    };
</script>

<style scoped></style>
