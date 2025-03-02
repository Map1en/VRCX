<template>
    <el-dialog
        class="x-dialog x-world-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="worldDialog"
        :visible.sync="worldDialog.visible"
        :show-close="false"
        width="770px">
        <div v-loading="worldDialog.loading">
            <div style="display: flex">
                <el-popover placement="right" width="500px" trigger="click">
                    <img
                        class="x-link"
                        slot="reference"
                        v-lazy="worldDialog.ref.thumbnailImageUrl"
                        style="flex: none; width: 160px; height: 120px; border-radius: 12px" />
                    <img
                        class="x-link"
                        v-lazy="worldDialog.ref.imageUrl"
                        style="width: 500px; height: 375px"
                        @click="showFullscreenImageDialog(worldDialog.ref.imageUrl)" />
                </el-popover>
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <i
                                v-show="
                                    API.currentUser.$homeLocation &&
                                    API.currentUser.$homeLocation.worldId === worldDialog.id
                                "
                                class="el-icon-s-home"
                                style="margin-right: 5px" />
                            <span class="dialog-title" v-text="worldDialog.ref.name" />
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                class="x-link x-grey"
                                v-text="worldDialog.ref.authorName"
                                @click="showUserDialog(worldDialog.ref.authorId)"
                                style="font-family: monospace" />
                        </div>
                        <div>
                            <el-tag
                                v-if="worldDialog.ref.$isLabs"
                                type="primary"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.labs') }}
                            </el-tag>
                            <el-tag
                                v-else-if="worldDialog.ref.releaseStatus === 'public'"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.public') }}
                            </el-tag>
                            <el-tag
                                v-else
                                type="danger"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.private') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.isPC"
                                class="x-tag-platform-pc"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                PC
                            </el-tag>
                            <span
                                v-if="worldDialog.bundleSizes['standalonewindows']"
                                class="x-grey"
                                style="margin-left: 5px; border-left: inherit; padding-left: 5px">
                                {{ worldDialog.bundleSizes['standalonewindows'].fileSize }}
                            </span>
                            <el-tag
                                v-if="worldDialog.isQuest"
                                class="x-tag-platform-quest"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                Android
                            </el-tag>
                            <span
                                v-if="worldDialog.bundleSizes['android']"
                                class="x-grey"
                                style="margin-left: 5px; border-left: inherit; padding-left: 5px">
                                {{ worldDialog.bundleSizes['android'].fileSize }}
                            </span>
                            <el-tag
                                v-if="worldDialog.isIos"
                                class="x-tag-platform-ios"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                iOS
                            </el-tag>
                            <span
                                v-if="worldDialog.bundleSizes['ios']"
                                class="x-grey"
                                style="margin-left: 5px; border-left: inherit; padding-left: 5px">
                                {{ worldDialog.bundleSizes['ios'].fileSize }}
                            </span>
                            <el-tag
                                v-if="worldDialog.avatarScalingDisabled"
                                type="warning"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.avatar_scaling_disabled') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.focusViewDisabled"
                                type="warning"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.focus_view_disabled') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.stickersDisabled"
                                type="warning"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.stickers_disabled') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.ref.unityPackageUrl"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.future_proofing') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.inCache"
                                class="x-link"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                @click="openFolderGeneric(worldDialog.cachePath)">
                                <span v-text="worldDialog.cacheSize" />
                                | {{ $t('dialog.world.tags.cache') }}
                            </el-tag>
                        </div>
                        <div>
                            <template v-for="tag in worldDialog.ref.tags">
                                <el-tag
                                    v-if="tag.startsWith('content_')"
                                    :key="tag"
                                    effect="plain"
                                    size="mini"
                                    style="margin-right: 5px; margin-top: 5px">
                                    <template v-if="tag === 'content_horror'">
                                        {{ $t('dialog.world.tags.content_horror') }}
                                    </template>
                                    <template v-else-if="tag === 'content_gore'">
                                        {{ $t('dialog.world.tags.content_gore') }}
                                    </template>
                                    <template v-else-if="tag === 'content_violence'">
                                        {{ $t('dialog.world.tags.content_violence') }}
                                    </template>
                                    <template v-else-if="tag === 'content_adult'">
                                        {{ $t('dialog.world.tags.content_adult') }}
                                    </template>
                                    <template v-else-if="tag === 'content_sex'">
                                        {{ $t('dialog.world.tags.content_sex') }}
                                    </template>
                                    <template v-else>
                                        {{ tag.replace('content_', '') }}
                                    </template>
                                </el-tag>
                            </template>
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                v-show="worldDialog.ref.name !== worldDialog.ref.description"
                                v-text="worldDialog.ref.description"
                                style="font-size: 12px" />
                        </div>
                    </div>
                    <div style="flex: none; margin-left: 10px">
                        <el-tooltip
                            v-if="worldDialog.inCache"
                            placement="top"
                            :content="$t('dialog.world.actions.delete_cache_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                icon="el-icon-delete"
                                circle
                                @click="deleteVRChatCache(worldDialog.ref)"
                                :disabled="isGameRunning && worldDialog.cacheLocked" />
                        </el-tooltip>
                        <el-tooltip
                            v-if="worldDialog.isFavorite"
                            placement="top"
                            :content="$t('dialog.world.actions.favorites_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                type="default"
                                icon="el-icon-star-on"
                                circle
                                @click="worldDialogCommand('Add Favorite')"
                                style="margin-left: 5px" />
                        </el-tooltip>
                        <el-tooltip
                            v-else
                            placement="top"
                            :content="$t('dialog.world.actions.favorites_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                type="default"
                                icon="el-icon-star-off"
                                circle
                                @click="worldDialogCommand('Add Favorite')"
                                style="margin-left: 5px" />
                        </el-tooltip>
                        <el-dropdown
                            trigger="click"
                            @command="worldDialogCommand"
                            size="small"
                            style="margin-left: 5px">
                            <el-button type="default" icon="el-icon-more" circle />
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item icon="el-icon-refresh" command="Refresh">
                                    {{ $t('dialog.world.actions.refresh') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-share" command="Share">
                                    {{ $t('dialog.world.actions.share') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-s-flag" command="New Instance" divided>
                                    {{ $t('dialog.world.actions.new_instance') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-message" command="New Instance and Self Invite">
                                    {{ $t('dialog.world.actions.new_instance_and_self_invite') }}
                                </el-dropdown-item>
                                <el-dropdown-item
                                    v-if="
                                        API.currentUser.$homeLocation &&
                                        API.currentUser.$homeLocation.worldId === worldDialog.id
                                    "
                                    icon="el-icon-magic-stick"
                                    command="Reset Home"
                                    divided>
                                    {{ $t('dialog.world.actions.reset_home') }}
                                </el-dropdown-item>
                                <el-dropdown-item v-else icon="el-icon-s-home" command="Make Home" divided>
                                    {{ $t('dialog.world.actions.make_home') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-tickets" command="Previous Instances">
                                    {{ $t('dialog.world.actions.show_previous_instances') }}
                                </el-dropdown-item>
                                <template v-if="API.currentUser.id !== worldDialog.ref.authorId">
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Previous Images">
                                        {{ $t('dialog.world.actions.show_previous_images') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        :disabled="!worldDialog.hasPersistData"
                                        icon="el-icon-upload"
                                        command="Delete Persistent Data">
                                        {{ $t('dialog.world.actions.delete_persistent_data') }}
                                    </el-dropdown-item>
                                </template>
                                <template v-else>
                                    <el-dropdown-item icon="el-icon-edit" command="Rename">
                                        {{ $t('dialog.world.actions.rename') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Description">
                                        {{ $t('dialog.world.actions.change_description') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Capacity">
                                        {{ $t('dialog.world.actions.change_capacity') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Recommended Capacity">
                                        {{ $t('dialog.world.actions.change_recommended_capacity') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change YouTube Preview">
                                        {{ $t('dialog.world.actions.change_preview') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Tags">
                                        {{ $t('dialog.world.actions.change_tags') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Allowed Domains">
                                        {{ $t('dialog.world.actions.change_allowed_video_player_domains') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Change Image">
                                        {{ $t('dialog.world.actions.change_image') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="worldDialog.ref.unityPackageUrl"
                                        icon="el-icon-download"
                                        command="Download Unity Package">
                                        {{ $t('dialog.world.actions.download_package') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="
                                            worldDialog.ref.tags.includes('system_approved') ||
                                            worldDialog.ref.tags.includes('system_labs')
                                        "
                                        icon="el-icon-view"
                                        command="Unpublish"
                                        divided>
                                        {{ $t('dialog.world.actions.unpublish') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-else icon="el-icon-view" command="Publish" divided>
                                        {{ $t('dialog.world.actions.publish_to_labs') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        :disabled="!worldDialog.hasPersistData"
                                        icon="el-icon-upload"
                                        command="Delete Persistent Data">
                                        {{ $t('dialog.world.actions.delete_persistent_data') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-delete" command="Delete" style="color: #f56c6c">
                                        {{ $t('dialog.world.actions.delete') }}
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>
            <el-tabs>
                <el-tab-pane :label="$t('dialog.world.instances.header')">
                    <div class="">
                        <i class="el-icon-user" />
                        {{ $t('dialog.world.instances.public_count', { count: worldDialog.ref.publicOccupants }) }}
                        <i class="el-icon-user-solid" style="margin-left: 10px" />
                        {{ $t('dialog.world.instances.private_count', { count: worldDialog.ref.privateOccupants }) }}
                        <i class="el-icon-check" style="margin-left: 10px" />
                        {{
                            $t('dialog.world.instances.capacity_count', {
                                count: worldDialog.ref.recommendedCapacity,
                                max: worldDialog.ref.capacity
                            })
                        }}
                    </div>
                    <div v-for="room in worldDialog.rooms" :key="room.id">
                        <div style="margin: 5px 0">
                            <location-world
                                :locationobject="room.$location"
                                :currentuserid="API.currentUser.id"
                                :worlddialogshortname="worldDialog.$location.shortName"
                                @show-launch-dialog="showLaunchDialog" />
                            <launch
                                :location="room.tag"
                                @show-launch-dialog="showLaunchDialog"
                                style="margin-left: 5px" />
                            <el-tooltip
                                placement="top"
                                :content="$t('dialog.world.instances.self_invite_tooltip')"
                                :disabled="hideTooltips">
                                <invite-yourself
                                    :location="room.$location.tag"
                                    :shortname="room.$location.shortName"
                                    style="margin-left: 5px" />
                            </el-tooltip>
                            <el-tooltip
                                placement="top"
                                :content="$t('dialog.world.instances.refresh_instance_info')"
                                :disabled="hideTooltips">
                                <el-button
                                    @click="refreshInstancePlayerCount(room.tag)"
                                    size="mini"
                                    icon="el-icon-refresh"
                                    style="margin-left: 5px"
                                    circle />
                            </el-tooltip>
                            <el-tooltip
                                v-if="instanceJoinHistory.get(room.$location.tag)"
                                placement="top"
                                :content="$t('dialog.previous_instances.info')"
                                :disabled="hideTooltips">
                                <el-button
                                    @click="showPreviousInstanceInfoDialog(room.location)"
                                    size="mini"
                                    icon="el-icon-s-data"
                                    style="margin-left: 5px"
                                    plain
                                    circle />
                            </el-tooltip>
                            <last-join :location="room.$location.tag" :currentlocation="lastLocation.location" />
                            <instance-info
                                :location="room.tag"
                                :instance="room.ref"
                                :friendcount="room.friendCount"
                                :updateelement="updateInstanceInfo" />
                            <div
                                class="x-friend-list"
                                style="margin: 10px 0; max-height: unset"
                                v-if="room.$location.userId || room.users.length">
                                <div
                                    v-if="room.$location.userId"
                                    class="x-friend-item x-friend-item-border"
                                    @click="showUserDialog(room.$location.userId)">
                                    <template v-if="room.$location.user">
                                        <div class="avatar" :class="userStatusClass(room.$location.user)">
                                            <img v-lazy="userImage(room.$location.user)" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                v-text="room.$location.user.displayName"
                                                :style="{ color: room.$location.user.$userColour }" />
                                            <span class="extra">
                                                {{ $t('dialog.world.instances.instance_creator') }}
                                            </span>
                                        </div>
                                    </template>
                                    <span v-else v-text="room.$location.userId" />
                                </div>
                                <div
                                    v-for="user in room.users"
                                    :key="user.id"
                                    class="x-friend-item x-friend-item-border"
                                    @click="showUserDialog(user.id)">
                                    <div class="avatar" :class="userStatusClass(user)">
                                        <img v-lazy="userImage(user)" />
                                    </div>
                                    <div class="detail">
                                        <span
                                            class="name"
                                            v-text="user.displayName"
                                            :style="{ color: user.$userColour }" />
                                        <span class="extra" v-if="user.location === 'traveling'">
                                            <i class="el-icon-loading" style="margin-right: 5px" />
                                            <timer :epoch="user.$travelingToTime" />
                                        </span>
                                        <span class="extra" v-else>
                                            <timer :epoch="user.$location_at" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane :label="$t('dialog.world.info.header')" lazy>
                    <div class="x-friend-list" style="max-height: none">
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.memo') }}
                                </span>
                                <el-input
                                    class="extra"
                                    v-model="worldDialog.memo"
                                    @change="onWorldMemoChange"
                                    type="textarea"
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    :placeholder="$t('dialog.world.info.memo_placeholder')"
                                    size="mini"
                                    resize="none" />
                            </div>
                        </div>
                        <div style="width: 100%; display: flex">
                            <div class="x-friend-item" style="width: 100%; cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ $t('dialog.world.info.id') }}
                                    </span>
                                    <span class="extra">
                                        {{ worldDialog.id }}
                                    </span>
                                    <el-tooltip
                                        placement="top"
                                        :content="$t('dialog.world.info.id_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-dropdown
                                            trigger="click"
                                            @click.native.stop
                                            size="mini"
                                            style="margin-left: 5px">
                                            <el-button type="default" icon="el-icon-s-order" size="mini" circle />
                                            <el-dropdown-menu slot="dropdown">
                                                <el-dropdown-item @click.native="copyWorldId(worldDialog.id)">
                                                    {{ $t('dialog.world.info.copy_id') }}
                                                </el-dropdown-item>
                                                <el-dropdown-item @click.native="copyWorldUrl(worldDialog.id)">
                                                    {{ $t('dialog.world.info.copy_url') }}
                                                </el-dropdown-item>
                                                <el-dropdown-item @click.native="copyWorldName(worldDialog.ref.name)">
                                                    {{ $t('dialog.world.info.copy_name') }}
                                                </el-dropdown-item>
                                            </el-dropdown-menu>
                                        </el-dropdown>
                                    </el-tooltip>
                                </div>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.previewYoutubeId"
                            class="x-friend-item"
                            style="width: 350px"
                            @click="
                                openExternalLink(`https://www.youtube.com/watch?v=${worldDialog.ref.previewYoutubeId}`)
                            ">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.youtube_preview') }}
                                </span>
                                <span class="extra">
                                    https://www.youtube.com/watch?v={{ worldDialog.ref.previewYoutubeId }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.author_tags') }}
                                </span>
                                <span
                                    class="extra"
                                    v-if="
                                        worldDialog.ref.tags?.filter((tag) => tag.startsWith('author_tag')).length > 0
                                    ">
                                    {{
                                        worldDialog.ref.tags
                                            .filter((tag) => tag.startsWith('author_tag'))
                                            .map((tag) => tag.replace('author_tag_', ''))
                                            .join(', ')
                                    }}
                                </span>
                                <span class="extra" v-else> - </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.players') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.occupants | commaNumber }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.favorites') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.favorites | commaNumber }}
                                </span>
                                |
                                <span v-if="worldDialog.ref.favorites > 0 && worldDialog.ref.visits > 0" class="extra">
                                    ({{
                                        Math.round(
                                            (((worldDialog.ref.favorites - worldDialog.ref.visits) /
                                                worldDialog.ref.visits) *
                                                100 +
                                                100) *
                                                100
                                        ) / 100
                                    }}%)
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.visits') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.visits | commaNumber }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.capacity') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.recommendedCapacity | commaNumber }} ({{
                                        worldDialog.ref.capacity | commaNumber
                                    }})
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.created_at') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.created_at | formatDate('long') }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.last_updated') }}
                                </span>
                                <span class="extra" v-if="worldDialog.lastUpdated">
                                    {{ worldDialog.lastUpdated | formatDate('long') }}
                                </span>
                                <span class="extra" v-else>
                                    {{ worldDialog.ref.updated_at | formatDate('long') }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.labsPublicationDate !== 'none'"
                            class="x-friend-item"
                            style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.labs_publication_date') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.labsPublicationDate | formatDate('long') }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.publicationDate !== 'none'"
                            class="x-friend-item"
                            style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.publication_date') }}
                                </span>
                                <el-tooltip
                                    v-if="
                                        worldDialog.ref.publicationDate &&
                                        worldDialog.ref.publicationDate !== 'none' &&
                                        worldDialog.ref.labsPublicationDate &&
                                        worldDialog.ref.labsPublicationDate !== 'none'
                                    "
                                    placement="top"
                                    style="margin-left: 5px">
                                    <template slot="content">
                                        <span>
                                            {{ $t('dialog.world.info.time_in_labs') }}
                                            {{
                                                timeToText(
                                                    new Date(worldDialog.ref.publicationDate) -
                                                        new Date(worldDialog.ref.labsPublicationDate)
                                                )
                                            }}
                                        </span>
                                    </template>
                                    <i class="el-icon-arrow-down" />
                                </el-tooltip>
                                <span class="extra">
                                    {{ worldDialog.ref.publicationDate | formatDate('long') }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.version') }}
                                </span>
                                <span class="extra" v-text="worldDialog.ref.version" />
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.heat') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.heat | commaNumber }} {{ '🔥'.repeat(worldDialog.ref.heat) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.popularity') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.popularity | commaNumber }}
                                    {{ '💖'.repeat(worldDialog.ref.popularity) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.platform') }}
                                </span>
                                <span class="extra" v-text="worldDialogPlatform" />
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.last_visited') }}
                                </span>
                                <el-tooltip v-if="!hideTooltips" placement="top" style="margin-left: 5px" />
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </el-dialog>
</template>

<script>
    export default {
        name: 'WorldDialog',
        props: {
            worldDialog: {
                type: Object,
                required: true
            }
        }
    };
</script>

<style scoped></style>
