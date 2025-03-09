<template>
    <div class="x-friend-item">
        <template v-if="favorite.ref">
            <div class="avatar" :class="userStatusClass(favorite.ref)">
                <img v-lazy="userImage(favorite.ref)" />
            </div>
            <div class="detail">
                <span
                    class="name"
                    v-text="favorite.ref.displayName"
                    :style="{ color: favorite.ref.$userColour }"></span>
                <location-extra
                    v-if="favorite.ref.location !== 'offline'"
                    :location="favorite.ref.location"
                    :traveling="favorite.ref.travelingToLocation"
                    :link="false"></location-extra>
                <span v-else v-text="favorite.ref.statusDescription"></span>
            </div>
            <template v-if="editFavoritesMode">
                <el-dropdown trigger="click" @click.native.stop size="mini" style="margin-left: 5px">
                    <el-tooltip placement="left" :content="$t('view.favorite.move_tooltip')" :disabled="hideTooltips">
                        <el-button type="default" icon="el-icon-back" size="mini" circle></el-button>
                    </el-tooltip>
                    <el-dropdown-menu slot="dropdown">
                        <template v-for="groupAPI in API.favoriteFriendGroups" v-if="groupAPI.name !== group.name">
                            <el-dropdown-item
                                :key="groupAPI.name"
                                style="display: block; margin: 10px 0"
                                @click.native="moveFavorite(favorite.ref, groupAPI, 'friend')"
                                :disabled="groupAPI.count >= groupAPI.capacity">
                                {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                            </el-dropdown-item>
                        </template>
                    </el-dropdown-menu>
                </el-dropdown>
                <el-button type="text" size="mini" @click.stop style="margin-left: 5px">
                    <el-checkbox v-model="favorite.$selected"></el-checkbox>
                </el-button>
            </template>
            <template v-else>
                <el-tooltip
                    placement="right"
                    :content="$t('view.favorite.unfavorite_tooltip')"
                    :disabled="hideTooltips">
                    <el-button
                        v-if="shiftHeld"
                        @click.stop="deleteFavorite(favorite.id)"
                        size="mini"
                        icon="el-icon-close"
                        circle
                        style="color: #f56c6c; margin-left: 5px"></el-button>
                    <el-button
                        v-else
                        @click.stop="showFavoriteDialog('friend', favorite.id)"
                        type="default"
                        icon="el-icon-star-on"
                        size="mini"
                        circle
                        style="margin-left: 5px"></el-button>
                </el-tooltip>
            </template>
        </template>
        <template v-else>
            <div class="avatar"></div>
            <div class="detail">
                <span v-text="favorite.name || favorite.id"></span>
            </div>
            <el-button
                type="text"
                icon="el-icon-close"
                size="mini"
                @click.stop="deleteFavorite(favorite.id)"
                style="margin-left: 5px"></el-button>
        </template>
    </div>
</template>

<script>
    import { favoriteRequest } from '../../classes/request';
    export default {
        inject: ['showDialog', 'userImage', 'userStatusClass', 'API'],
        props: {},
        methods: {
            moveFavorite(ref, group, type) {
                favoriteRequest
                    .deleteFavorite({
                        objectId: ref.id
                    })
                    .then(() => {
                        favoriteRequest.addFavorite({
                            type,
                            favoriteId: ref.id,
                            tags: group.name
                        });
                    });
            },
            deleteFavorite(objectId) {
                favoriteRequest.deleteFavorite({
                    objectId
                });
                // FIXME: 메시지 수정
                // this.$confirm('Continue? Delete Favorite', 'Confirm', {
                //     confirmButtonText: 'Confirm',
                //     cancelButtonText: 'Cancel',
                //     type: 'info',
                //     callback: (action) => {
                //         if (action === 'confirm') {
                //             API.deleteFavorite({
                //                 objectId
                //             });
                //         }
                //     }
                // });
            },
            showFavoriteDialog(param1, param2) {
                this.$emit('show-favorite-dialog', param1, param2);
            }
        }
    };
</script>
