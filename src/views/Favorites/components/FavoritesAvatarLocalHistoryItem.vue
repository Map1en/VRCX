<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <div class="avatar">
                <img v-lazy="smallThumbnail" />
            </div>
            <div class="detail">
                <span class="name" v-text="favorite.name"></span>
                <span class="extra" v-text="favorite.authorName"></span>
            </div>
            <el-tooltip placement="left" :content="$t('view.favorite.select_avatar_tooltip')" :disabled="hideTooltips">
                <el-button
                    :disabled="API.currentUser.currentAvatar === favorite.id"
                    size="mini"
                    icon="el-icon-check"
                    circle
                    style="margin-left: 5px"
                    @click.stop="selectAvatarWithConfirmation"></el-button>
            </el-tooltip>
            <template v-if="cachedFavoritesByObjectId.has(favorite.id)">
                <el-tooltip placement="right" content="Unfavorite" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        icon="el-icon-star-on"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                </el-tooltip>
            </template>
            <template v-else>
                <el-tooltip placement="right" content="Favorite" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        icon="el-icon-star-off"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                </el-tooltip>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { API } from '../../../app';
    import { useAppearanceSettingsStore } from '../../../stores/settings/appearance';
    import { useFavoriteStore } from '../../../stores/favorite';
    import { useAvatarStore } from '../../../stores/avatar';

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { hideTooltips } = storeToRefs(appearanceSettingsStore);
    const favoriteStore = useFavoriteStore();
    const { cachedFavoritesByObjectId } = storeToRefs(favoriteStore);
    const { showFavoriteDialog } = favoriteStore;
    const avatarStore = useAvatarStore();
    const { selectAvatarWithConfirmation } = avatarStore;

    const props = defineProps({
        favorite: {
            type: Object,
            required: true
        }
    });

    const smallThumbnail = computed(() => {
        return props.favorite.thumbnailImageUrl.replace('256', '128') || props.favorite.thumbnailImageUrl;
    });
</script>
