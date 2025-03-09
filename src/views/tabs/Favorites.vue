<template>
    <div v-show="menuActiveIndex === 'favorite'" class="x-container">
        <div style="font-size: 13px; position: absolute; display: flex; right: 0; z-index: 1; margin-right: 15px">
            <div v-if="isEditMode" style="display: inline-block; margin-right: 10px">
                <el-button size="small" @click="clearBulkFavoriteSelection">{{ $t('view.favorite.clear') }}</el-button>
                <el-button size="small" @click="bulkCopyFavoriteSelection">{{ $t('view.favorite.copy') }}</el-button>
                <el-button size="small" @click="showBulkUnfavoriteSelectionConfirm">{{
                    $t('view.favorite.bulk_unfavorite')
                }}</el-button>
            </div>
            <div style="display: flex; align-items: center; margin-right: 10px">
                <span class="name">{{ $t('view.favorite.edit_mode') }}</span>
                <el-switch v-model="isEditMode" style="margin-left: 5px"></el-switch>
            </div>
            <el-tooltip placement="bottom" :content="$t('view.favorite.refresh_tooltip')" :disabled="hideTooltips">
                <el-button
                    type="default"
                    :loading="API.isFavoriteLoading"
                    @click="
                        API.refreshFavorites();
                        getLocalWorldFavorites();
                    "
                    size="small"
                    icon="el-icon-refresh"
                    circle></el-button>
            </el-tooltip>
        </div>
        <el-tabs type="card" v-loading="API.isFavoriteLoading" style="height: 100%">
            <el-tab-pane :label="$t('view.favorite.friends.header')" lazy>
                <favorites-friend-tab
                    :favorite-friends="favoriteFriends"
                    :sort-favorites.sync="isSortByTime"
                    :hide-tooltips="hideTooltips"
                    :grouped-by-group-key-favorite-friends="groupedByGroupKeyFavoriteFriends"
                    :edit-favorites-mode="isEditMode"
                    @show-friend-import-dialog="showFriendImportDialog"
                    @save-sort-favorites-option="saveSortFavoritesOption"
                    @clear-favorite-group="clearFavoriteGroup"
                    @change-favorite-group-name="changeFavoriteGroupName"></favorites-friend-tab>
            </el-tab-pane>
            <el-tab-pane :label="$t('view.favorite.worlds.header')" lazy>
                <favorites-world-tab
                    @show-world-import-dialog="showWorldImportDialog"
                    @save-sort-favorites-option="saveSortFavoritesOption"
                    @show-world-dialog="showWorldDialog"
                    @change-favorite-group-name="changeFavoriteGroupName"
                    @clear-favorite-group="clearFavoriteGroup"
                    @new-instance-self-invite="newInstanceSelfInvite"
                    @show-favorite-dialog="showFavoriteDialog"
                    @refresh-local-world-favorite="refreshLocalWorldFavorites"
                    @delete-local-world-favorite-group="deleteLocalWorldFavoriteGroup"
                    @search-world-favorites="searchWorldFavorites"
                    @remove-local-world-favorite="removeLocalWorldFavorite"
                    :sort-favorites.sync="isSortByTime"
                    :hide-tooltips="hideTooltips"
                    :favorite-worlds="favoriteWorlds"
                    :edit-favorites-mode="isEditMode"
                    :shift-held="shiftHeld"
                    :refresh-local-world-favorites="refreshLocalWorldFavorites"
                    :local-world-favorite-groups="localWorldFavoriteGroups"
                    :local-world-favorites="localWorldFavorites"></favorites-world-tab>
            </el-tab-pane>
            <el-tab-pane :label="$t('view.favorite.avatars.header')" lazy>
                <favorites-avatar-tab
                    :sort-favorites.sync="isSortByTime"
                    :hide-tooltips="hideTooltips"
                    :shift-held="shiftHeld"
                    :edit-favorites-mode="isEditMode"
                    :avatar-history-array="avatarHistoryArray"
                    :refreshing-local-favorites="refreshingLocalFavorites"
                    :local-avatar-favorite-groups="localAvatarFavoriteGroups"
                    :local-avatar-favorites="localAvatarFavorites"
                    :favorite-avatars="favoriteAvatars"
                    @show-avatar-import-dialog="showAvatarImportDialog"
                    @save-sort-favorites-option="saveSortFavoritesOption"
                    @show-avatar-dialog="showAvatarDialog"
                    @show-favorite-dialog="showFavoriteDialog"
                    @remove-local-avatar-favorite="removeLocalAvatarFavorite"
                    @select-avatar-with-confirmation="selectAvatarWithConfirmation"
                    @prompt-clear-avatar-history="promptClearAvatarHistory"
                    @prompt-new-local-avatar-favorite-group="promptNewLocalAvatarFavoriteGroup"
                    @refresh-local-avatar-favorites="refreshLocalAvatarFavorites"
                    @prompt-local-avatar-favorite-group-rename="promptLocalAvatarFavoriteGroupRename"
                    @prompt-local-avatar-favorite-group-delete="
                        promptLocalAvatarFavoriteGroupDelete
                    "></favorites-avatar-tab>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
    import FavoritesFriendTab from '../../components/favorites/FavoritesFriendTab.vue';
    import FavoritesWorldTab from '../../components/favorites/FavoritesWorldTab.vue';
    import FavoritesAvatarTab from '../../components/favorites/FavoritesAvatarTab.vue';
    import { favoriteRequest } from '../../classes/request';

    export default {
        name: 'FavoritesTab',
        components: {
            FavoritesFriendTab,
            FavoritesWorldTab,
            FavoritesAvatarTab
        },
        inject: ['API'],
        props: {
            menuActiveIndex: String,
            hideTooltips: Boolean,
            shiftHeld: Boolean,
            favoriteFriends: Array,
            sortFavorites: Boolean,
            groupedByGroupKeyFavoriteFriends: Object,
            favoriteWorlds: Array,
            localWorldFavoriteGroups: Array,
            localWorldFavorites: Object,
            avatarHistoryArray: Array,
            refreshingLocalFavorites: Boolean,
            localAvatarFavoriteGroups: Array,
            localAvatarFavorites: Object,
            favoriteAvatars: Array
        },
        data() {
            return {
                editFavoritesMode: false
            };
        },
        computed: {
            isEditMode: {
                get() {
                    return this.editFavoritesMode;
                },
                set(value) {
                    this.$emit('update:editFavoritesMode', value);
                }
            },
            isSortByTime: {
                get() {
                    return this.sortFavorites;
                },
                set(value) {
                    this.$emit('update:sortFavorites', value);
                }
            }
        },
        methods: {
            clearBulkFavoriteSelection() {
                this.$emit('clear-bulk-favorite-selection');
            },
            bulkCopyFavoriteSelection() {
                this.$emit('bulk-copy-favorite-selection');
            },

            showBulkUnfavoriteSelectionConfirm() {
                const elementsTicked = [];
                // check favorites type
                for (const ctx of this.favoriteFriends) {
                    if (ctx.$selected) {
                        elementsTicked.push(ctx.id);
                    }
                }
                for (const ctx of this.favoriteWorlds) {
                    if (ctx.$selected) {
                        elementsTicked.push(ctx.id);
                    }
                }
                for (const ctx of this.favoriteAvatars) {
                    if (ctx.$selected) {
                        elementsTicked.push(ctx.id);
                    }
                }
                if (elementsTicked.length === 0) {
                    return;
                }
                this.$confirm(
                    `Are you sure you want to unfavorite ${elementsTicked.length} favorites?
            This action cannot be undone.`,
                    `Delete ${elementsTicked.length} favorites?`,
                    {
                        confirmButtonText: 'Confirm',
                        cancelButtonText: 'Cancel',
                        type: 'info',
                        callback: (action) => {
                            if (action === 'confirm') {
                                this.bulkUnfavoriteSelection(elementsTicked);
                            }
                        }
                    }
                );
            },

            bulkUnfavoriteSelection(elementsTicked) {
                for (const id of elementsTicked) {
                    favoriteRequest.deleteFavorite({
                        objectId: id
                    });
                }
                this.editFavoritesMode = false;
            },
            getLocalWorldFavorites() {
                this.$emit('get-local-world-favorites');
            },
            showFriendImportDialog() {
                this.$emit('show-friend-import-dialog');
            },
            saveSortFavoritesOption() {
                this.$emit('save-sort-favorites-option');
            },
            clearFavoriteGroup() {
                this.$emit('clear-favorite-group');
            },
            changeFavoriteGroupName() {
                this.$emit('change-favorite-group-name');
            },
            showWorldImportDialog() {
                this.$emit('show-world-import-dialog');
            },
            showWorldDialog() {
                this.$emit('show-world-dialog');
            },
            newInstanceSelfInvite() {
                this.$emit('new-instance-self-invite');
            },
            showFavoriteDialog() {
                this.$emit('show-favorite-dialog');
            },
            refreshLocalWorldFavorites() {
                this.$emit('refresh-local-world-favorites');
            },
            deleteLocalWorldFavoriteGroup() {
                this.$emit('delete-local-world-favorite-group');
            },
            searchWorldFavorites() {
                this.$emit('search-world-favorites');
            },
            removeLocalWorldFavorite() {
                this.$emit('remove-local-world-favorite');
            },
            showAvatarImportDialog() {
                this.$emit('show-avatar-import-dialog');
            },
            showAvatarDialog() {
                this.$emit('show-avatar-dialog');
            },
            removeLocalAvatarFavorite() {
                this.$emit('remove-local-avatar-favorite');
            },
            selectAvatarWithConfirmation() {
                this.$emit('select-avatar-with-confirmation');
            },
            promptClearAvatarHistory() {
                this.$emit('prompt-clear-avatar-history');
            },
            promptNewLocalAvatarFavoriteGroup() {
                this.$emit('prompt-new-local-avatar-favorite-group');
            },
            refreshLocalAvatarFavorites() {
                this.$emit('refresh-local-avatar-favorites');
            },
            promptLocalAvatarFavoriteGroupRename() {
                this.$emit('prompt-local-avatar-favorite-group-rename');
            },
            promptLocalAvatarFavoriteGroupDelete() {
                this.$emit('prompt-local-avatar-favorite-group-delete');
            }
        }
    };
</script>
