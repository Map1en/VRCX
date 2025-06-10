<template>
    <div v-show="isSideBarTabShow" id="aside" class="x-aside-container" :style="{ width: `${asideWidth}px` }">
        <div style="display: flex; align-items: baseline">
            <el-select
                value=""
                clearable
                :placeholder="$t('side_panel.search_placeholder')"
                filterable
                remote
                :remote-method="quickSearchRemoteMethod"
                popper-class="x-quick-search"
                style="flex: 1; padding: 10px"
                @change="$emit('quick-search-change', $event)">
                <el-option v-for="item in quickSearchItems" :key="item.value" :value="item.value" :label="item.label">
                    <div class="x-friend-item">
                        <template v-if="item.ref">
                            <div class="detail">
                                <span class="name" :style="{ color: item.ref.$userColour }">{{
                                    item.ref.displayName
                                }}</span>
                                <span v-if="!item.ref.isFriend" class="extra"></span>
                                <span v-else-if="item.ref.state === 'offline'" class="extra">{{
                                    $t('side_panel.search_result_active')
                                }}</span>
                                <span v-else-if="item.ref.state === 'active'" class="extra">{{
                                    $t('side_panel.search_result_offline')
                                }}</span>
                                <location
                                    v-else
                                    class="extra"
                                    :location="item.ref.location"
                                    :traveling="item.ref.travelingToLocation"
                                    :link="false"></location>
                            </div>
                            <img v-lazy="userImage(item.ref)" class="avatar" />
                        </template>
                        <span v-else>
                            {{ $t('side_panel.search_result_more') }}
                            <span style="font-weight: bold">{{ item.label }}</span>
                        </span>
                    </div>
                </el-option>
            </el-select>
            <el-tooltip placement="bottom" :content="$t('side_panel.direct_access_tooltip')" :disabled="hideTooltips">
                <el-button
                    type="default"
                    size="mini"
                    icon="el-icon-discover"
                    circle
                    @click="$emit('direct-access-paste')"></el-button>
            </el-tooltip>
            <el-tooltip placement="bottom" :content="$t('side_panel.refresh_tooltip')" :disabled="hideTooltips">
                <el-button
                    type="default"
                    :loading="isRefreshFriendsLoading"
                    size="mini"
                    icon="el-icon-refresh"
                    circle
                    style="margin-right: 10px"
                    @click="refreshFriendsList" />
            </el-tooltip>
        </div>
        <el-tabs class="zero-margin-tabs" stretch style="height: calc(100% - 60px); margin-top: 5px">
            <el-tab-pane>
                <template slot="label">
                    <span>{{ $t('side_panel.friends') }}</span>
                    <span style="color: #909399; font-size: 12px; margin-left: 10px">
                        ({{ onlineFriendCount }}/{{ friends.size }})
                    </span>
                </template>
                <el-backtop target=".zero-margin-tabs .el-tabs__content" :bottom="20" :right="20"></el-backtop>
                <FriendsSidebar
                    :is-game-running="isGameRunning"
                    :last-location="lastLocation"
                    :last-location-destination="lastLocationDestination"
                    :grouped-by-group-key-favorite-friends="groupedByGroupKeyFavoriteFriends"
                    @confirm-delete-friend="$emit('confirm-delete-friend', $event)" />
            </el-tab-pane>
            <el-tab-pane lazy>
                <template slot="label">
                    <span>{{ $t('side_panel.groups') }}</span>
                    <span style="color: #909399; font-size: 12px; margin-left: 10px">
                        ({{ groupInstances.length }})
                    </span>
                </template>
                <GroupsSidebar
                    :group-instances="groupInstances"
                    :group-order="inGameGroupOrder"
                    @show-group-dialog="$emit('show-group-dialog', $event)" />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
    import { storeToRefs } from 'pinia';
    import Location from '../../components/Location.vue';
    import { useFriendStore } from '../../stores/friend';
    import { useAppearanceSettingsStore } from '../../stores/settings/appearance';
    import FriendsSidebar from './components/FriendsSidebar.vue';
    import GroupsSidebar from './components/GroupsSidebar.vue';
    import { API } from '../../app';
    import { userImage } from '../../shared/utils';

    export default {
        name: 'Sidebar',
        components: {
            FriendsSidebar,
            GroupsSidebar,
            Location
        },
        props: {
            isGameRunning: Boolean,

            isSideBarTabShow: Boolean,

            quickSearchRemoteMethod: Function,
            quickSearchItems: Array,

            lastLocation: Object,
            lastLocationDestination: String,

            groupInstances: Array,
            inGameGroupOrder: Array,
            groupedByGroupKeyFavoriteFriends: Object
        },
        setup() {
            const appearanceSettingsStore = useAppearanceSettingsStore();
            const friendsStore = useFriendStore();
            const { friends, isRefreshFriendsLoading, onlineFriendCount } = storeToRefs(friendsStore);
            const { refreshFriendsList } = friendsStore;
            const { hideTooltips, asideWidth } = storeToRefs(appearanceSettingsStore);
            return {
                hideTooltips,
                asideWidth,
                friends,
                isRefreshFriendsLoading,
                refreshFriendsList,
                onlineFriendCount,
                API,
                userImage
            };
        }
    };
</script>
