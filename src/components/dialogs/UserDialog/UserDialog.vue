<template>
    <safe-dialog
        class="x-dialog x-user-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="userDialog"
        :visible.sync="userDialog.visible"
        :show-close="false"
        width="770px"
        top="10vh">
        <div v-loading="userDialog.loading">
            <div style="display: flex">
                <el-popover
                    v-if="userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride"
                    placement="right"
                    width="500px"
                    trigger="click">
                    <img
                        slot="reference"
                        class="x-link"
                        :src="userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride"
                        style="flex: none; height: 120px; width: 213.33px; border-radius: 12px; object-fit: cover" />
                    <img
                        class="x-link"
                        v-lazy="userDialog.ref.profilePicOverride"
                        style="height: 400px"
                        @click="showFullscreenImageDialog(userDialog.ref.profilePicOverride)" />
                </el-popover>
                <el-popover v-else placement="right" width="500px" trigger="click">
                    <img
                        slot="reference"
                        class="x-link"
                        :src="userDialog.ref.currentAvatarThumbnailImageUrl"
                        style="flex: none; height: 120px; width: 160px; border-radius: 12px; object-fit: cover" />
                    <img
                        class="x-link"
                        v-lazy="userDialog.ref.currentAvatarImageUrl"
                        style="height: 500px"
                        @click="showFullscreenImageDialog(userDialog.ref.currentAvatarImageUrl)" />
                </el-popover>

                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <el-tooltip v-if="userDialog.ref.status" placement="top">
                                <template #content>
                                    <span v-if="userDialog.ref.state === 'active'">{{
                                        $t('dialog.user.status.active')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.state === 'offline'">{{
                                        $t('dialog.user.status.offline')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.status === 'active'">{{
                                        $t('dialog.user.status.online')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.status === 'join me'">{{
                                        $t('dialog.user.status.join_me')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.status === 'ask me'">{{
                                        $t('dialog.user.status.ask_me')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.status === 'busy'">{{
                                        $t('dialog.user.status.busy')
                                    }}</span>
                                    <span v-else>{{ $t('dialog.user.status.offline') }}</span>
                                </template>
                                <i class="x-user-status" :class="userStatusClass(userDialog.ref)"></i>
                            </el-tooltip>
                            <template v-if="userDialog.previousDisplayNames.length > 0">
                                <el-tooltip placement="bottom">
                                    <template #content>
                                        <span>{{ $t('dialog.user.previous_display_names') }}</span>
                                        <div
                                            v-for="displayName in userDialog.previousDisplayNames"
                                            :key="displayName"
                                            placement="top">
                                            <span v-text="displayName"></span>
                                        </div>
                                    </template>
                                    <i class="el-icon-caret-bottom"></i>
                                </el-tooltip>
                            </template>
                            <el-popover placement="top" trigger="click">
                                <span
                                    slot="reference"
                                    class="dialog-title"
                                    v-text="userDialog.ref.displayName"
                                    style="margin-left: 5px; margin-right: 5px; cursor: pointer"></span>
                                <span style="display: block; text-align: center; font-family: monospace">{{
                                    userDialog.ref.displayName | textToHex
                                }}</span>
                            </el-popover>
                            <el-tooltip
                                v-if="userDialog.ref.pronouns"
                                placement="top"
                                :content="$t('dialog.user.pronouns')"
                                :disabled="hideTooltips">
                                <span
                                    class="x-grey"
                                    v-text="userDialog.ref.pronouns"
                                    style="margin-right: 5px; font-family: monospace; font-size: 12px"></span>
                            </el-tooltip>
                            <el-tooltip v-for="item in userDialog.ref.$languages" :key="item.key" placement="top">
                                <template #content>
                                    <span>{{ item.value }} ({{ item.key }})</span>
                                </template>
                                <span
                                    class="flags"
                                    :class="languageClass(item.key)"
                                    style="display: inline-block; margin-right: 5px"></span>
                            </el-tooltip>
                            <template v-if="userDialog.ref.id === API.currentUser.id">
                                <br />
                                <el-popover placement="top" trigger="click">
                                    <span
                                        slot="reference"
                                        class="x-grey"
                                        v-text="API.currentUser.username"
                                        style="
                                            margin-right: 10px;
                                            font-family: monospace;
                                            font-size: 12px;
                                            cursor: pointer;
                                        "></span>
                                    <span style="display: block; text-align: center; font-family: monospace">{{
                                        API.currentUser.username | textToHex
                                    }}</span>
                                </el-popover>
                            </template>
                        </div>
                        <div style="margin-top: 5px">
                            <el-tag
                                type="info"
                                effect="plain"
                                size="mini"
                                class="name"
                                :class="userDialog.ref.$trustClass"
                                v-text="userDialog.ref.$trustLevel"
                                style="margin-right: 5px; margin-top: 5px"></el-tag>
                            <el-tag
                                v-if="userDialog.isFriend && userDialog.friend"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-friend"
                                style="margin-right: 5px; margin-top: 5px">
                                {{
                                    $t('dialog.user.tags.friend_no', {
                                        number: userDialog.ref.$friendNumber ? userDialog.ref.$friendNumber : ''
                                    })
                                }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$isTroll"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-troll"
                                style="margin-right: 5px; margin-top: 5px">
                                Nuisance
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$isProbableTroll"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-troll"
                                style="margin-right: 5px; margin-top: 5px">
                                Almost Nuisance
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$isModerator"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-vip"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.user.tags.vrchat_team') }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.last_platform === 'standalonewindows'"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-platform-pc"
                                style="margin-right: 5px; margin-top: 5px">
                                PC
                            </el-tag>
                            <el-tag
                                v-else-if="userDialog.ref.last_platform === 'android'"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-platform-quest"
                                style="margin-right: 5px; margin-top: 5px">
                                Android
                            </el-tag>
                            <el-tag
                                v-else-if="userDialog.ref.last_platform === 'ios'"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-platform-ios"
                                style="margin-right: 5px; margin-top: 5px"
                                >iOS</el-tag
                            >
                            <el-tag
                                v-else-if="userDialog.ref.last_platform"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-platform-other"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ userDialog.ref.last_platform }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.ageVerified || userDialog.ref.ageVerificationStatus !== 'hidden'"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-age-verification"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ userDialog.ref.ageVerificationStatus }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$customTag"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="name"
                                v-text="userDialog.ref.$customTag"
                                :style="{
                                    color: userDialog.ref.$customTagColour,
                                    'border-color': userDialog.ref.$customTagColour
                                }"
                                style="margin-right: 5px; margin-top: 5px"></el-tag>
                            <br />
                            <template v-for="badge in userDialog.ref.badges">
                                <el-tooltip placement="top" :key="badge.badgeId">
                                    <template #content>
                                        <span>{{ badge.badgeName }}</span>
                                        <span v-if="badge.hidden">&nbsp;(Hidden)</span>
                                    </template>
                                    <el-popover placement="right" width="300px" trigger="click">
                                        <img
                                            slot="reference"
                                            class="x-link x-user-badge"
                                            :src="badge.badgeImageUrl"
                                            style="
                                                flex: none;
                                                height: 32px;
                                                width: 32px;
                                                border-radius: 3px;
                                                object-fit: cover;
                                                margin-top: 5px;
                                                margin-right: 5px;
                                            "
                                            :class="{ 'x-user-badge-hidden': badge.hidden }" />
                                        <img
                                            class="x-link"
                                            v-lazy="badge.badgeImageUrl"
                                            style="width: 300px"
                                            @click="showFullscreenImageDialog(badge.badgeImageUrl)" />
                                        <br />
                                        <div style="display: block; width: 300px; word-break: normal">
                                            <span>{{ badge.badgeName }}</span>
                                            <br />
                                            <span class="x-grey" style="font-size: 12px">{{
                                                badge.badgeDescription
                                            }}</span>
                                            <br />
                                            <span
                                                class="x-grey"
                                                v-if="badge.assignedAt"
                                                style="font-family: monospace; font-size: 12px">
                                                {{ $t('dialog.user.badges.assigned') }}:
                                                {{ badge.assignedAt | formatDate('long') }}
                                            </span>
                                            <template v-if="userDialog.id === API.currentUser.id">
                                                <br />
                                                <el-checkbox
                                                    @change="toggleBadgeVisibility(badge)"
                                                    v-model="badge.hidden"
                                                    style="margin-top: 5px">
                                                    {{ $t('dialog.user.badges.hidden') }}
                                                </el-checkbox>
                                                <br />
                                                <el-checkbox
                                                    @change="toggleBadgeShowcased(badge)"
                                                    v-model="badge.showcased"
                                                    style="margin-top: 5px">
                                                    {{ $t('dialog.user.badges.showcased') }}
                                                </el-checkbox>
                                            </template>
                                        </div>
                                    </el-popover>
                                </el-tooltip>
                            </template>
                        </div>
                        <div style="margin-top: 5px">
                            <span v-text="userDialog.ref.statusDescription" style="font-size: 12px"></span>
                        </div>
                    </div>

                    <div v-if="userDialog.ref.userIcon" style="flex: none; margin-right: 10px">
                        <el-popover placement="right" width="500px" trigger="click">
                            <img
                                slot="reference"
                                class="x-link"
                                :src="userImage(userDialog.ref, true, '256', true)"
                                style="
                                    flex: none;
                                    width: 120px;
                                    height: 120px;
                                    border-radius: 12px;
                                    object-fit: cover;
                                " />
                            <img
                                class="x-link"
                                v-lazy="userDialog.ref.userIcon"
                                style="height: 500px"
                                @click="showFullscreenImageDialog(userDialog.ref.userIcon)" />
                        </el-popover>
                    </div>

                    <div style="flex: none">
                        <template
                            v-if="
                                (API.currentUser.id !== userDialog.ref.id && userDialog.isFriend) ||
                                userDialog.isFavorite
                            ">
                            <el-tooltip
                                v-if="userDialog.isFavorite"
                                placement="top"
                                :content="$t('dialog.user.actions.unfavorite_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    @click="userDialogCommand('Add Favorite')"
                                    type="warning"
                                    icon="el-icon-star-on"
                                    circle></el-button>
                            </el-tooltip>
                            <el-tooltip
                                v-else
                                placement="top"
                                :content="$t('dialog.user.actions.favorite_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    type="default"
                                    @click="userDialogCommand('Add Favorite')"
                                    icon="el-icon-star-off"
                                    circle></el-button>
                            </el-tooltip>
                        </template>
                        <el-dropdown trigger="click" @command="userDialogCommand" size="small">
                            <el-button
                                :type="
                                    userDialog.incomingRequest || userDialog.outgoingRequest
                                        ? 'success'
                                        : userDialog.isBlock || userDialog.isMute
                                          ? 'danger'
                                          : 'default'
                                "
                                icon="el-icon-more"
                                circle
                                style="margin-left: 5px"></el-button>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item icon="el-icon-refresh" command="Refresh">{{
                                    $t('dialog.user.actions.refresh')
                                }}</el-dropdown-item>
                                <el-dropdown-item icon="el-icon-share" command="Share">{{
                                    $t('dialog.user.actions.share')
                                }}</el-dropdown-item>
                                <template v-if="userDialog.ref.id === API.currentUser.id">
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Manage Gallery" divided>{{
                                        $t('dialog.user.actions.manage_gallery_icon')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-s-custom" command="Show Avatar Author">{{
                                        $t('dialog.user.actions.show_avatar_author')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-s-custom" command="Show Fallback Avatar Details">{{
                                        $t('dialog.user.actions.show_fallback_avatar')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Edit Social Status" divided>{{
                                        $t('dialog.user.actions.edit_status')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Edit Language">{{
                                        $t('dialog.user.actions.edit_language')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Edit Bio">{{
                                        $t('dialog.user.actions.edit_bio')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Edit Pronouns">{{
                                        $t('dialog.user.actions.edit_pronouns')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-switch-button" command="Logout" divided>{{
                                        $t('dialog.user.actions.logout')
                                    }}</el-dropdown-item>
                                </template>
                                <template v-else>
                                    <template v-if="userDialog.isFriend">
                                        <el-dropdown-item icon="el-icon-postcard" command="Request Invite" divided>{{
                                            $t('dialog.user.actions.request_invite')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item icon="el-icon-postcard" command="Request Invite Message">{{
                                            $t('dialog.user.actions.request_invite_with_message')
                                        }}</el-dropdown-item>
                                        <template
                                            v-if="
                                                lastLocation.location &&
                                                isGameRunning &&
                                                checkCanInvite(lastLocation.location)
                                            ">
                                            <el-dropdown-item icon="el-icon-message" command="Invite">{{
                                                $t('dialog.user.actions.invite')
                                            }}</el-dropdown-item>
                                            <el-dropdown-item icon="el-icon-message" command="Invite Message">{{
                                                $t('dialog.user.actions.invite_with_message')
                                            }}</el-dropdown-item>
                                        </template>
                                    </template>
                                    <template v-else-if="userDialog.incomingRequest">
                                        <el-dropdown-item icon="el-icon-check" command="Accept Friend Request">{{
                                            $t('dialog.user.actions.accept_friend_request')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item icon="el-icon-close" command="Decline Friend Request">{{
                                            $t('dialog.user.actions.decline_friend_request')
                                        }}</el-dropdown-item>
                                    </template>
                                    <el-dropdown-item
                                        v-else-if="userDialog.outgoingRequest"
                                        icon="el-icon-close"
                                        command="Cancel Friend Request">
                                        {{ $t('dialog.user.actions.cancel_friend_request') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-else icon="el-icon-plus" command="Send Friend Request">{{
                                        $t('dialog.user.actions.send_friend_request')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-message" command="Invite To Group">{{
                                        $t('dialog.user.actions.invite_to_group')
                                    }}</el-dropdown-item>
                                    <!--//- el-dropdown-item(icon="el-icon-thumb" command="Send Boop" :disabled="!API.currentUser.isBoopingEnabled") {{ $t('dialog.user.actions.send_boop') }}-->
                                    <el-dropdown-item icon="el-icon-s-custom" command="Show Avatar Author" divided>{{
                                        $t('dialog.user.actions.show_avatar_author')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-s-custom" command="Show Fallback Avatar Details">{{
                                        $t('dialog.user.actions.show_fallback_avatar')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-tickets" command="Previous Instances">{{
                                        $t('dialog.user.actions.show_previous_instances')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.ref.currentAvatarImageUrl"
                                        icon="el-icon-picture-outline"
                                        command="Previous Images">
                                        {{ $t('dialog.user.actions.show_previous_images') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.isBlock"
                                        icon="el-icon-circle-check"
                                        command="Moderation Unblock"
                                        divided
                                        style="color: #f56c6c">
                                        {{ $t('dialog.user.actions.moderation_unblock') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-else
                                        icon="el-icon-circle-close"
                                        command="Moderation Block"
                                        divided
                                        :disabled="userDialog.ref.$isModerator">
                                        {{ $t('dialog.user.actions.moderation_block') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.isMute"
                                        icon="el-icon-microphone"
                                        command="Moderation Unmute"
                                        style="color: #f56c6c">
                                        {{ $t('dialog.user.actions.moderation_unmute') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-else
                                        icon="el-icon-turn-off-microphone"
                                        command="Moderation Mute"
                                        :disabled="userDialog.ref.$isModerator">
                                        {{ $t('dialog.user.actions.moderation_mute') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.isMuteChat"
                                        icon="el-icon-chat-line-round"
                                        command="Moderation Enable Chatbox"
                                        style="color: #f56c6c">
                                        {{ $t('dialog.user.actions.moderation_enable_chatbox') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-else
                                        icon="el-icon-chat-dot-round"
                                        command="Moderation Disable Chatbox">
                                        {{ $t('dialog.user.actions.moderation_disable_chatbox') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-user-solid" command="Show Avatar">
                                        <i class="el-icon-check el-icon--left" v-if="userDialog.isShowAvatar"></i>
                                        <span>{{ $t('dialog.user.actions.moderation_show_avatar') }}</span>
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-user" command="Hide Avatar">
                                        <i class="el-icon-check el-icon--left" v-if="userDialog.isHideAvatar"></i>
                                        <span>{{ $t('dialog.user.actions.moderation_hide_avatar') }}</span>
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.isInteractOff"
                                        icon="el-icon-thumb"
                                        command="Moderation Enable Avatar Interaction"
                                        style="color: #f56c6c">
                                        {{ $t('dialog.user.actions.moderation_enable_avatar_interaction') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-else
                                        icon="el-icon-circle-close"
                                        command="Moderation Disable Avatar Interaction">
                                        {{ $t('dialog.user.actions.moderation_disable_avatar_interaction') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        icon="el-icon-s-flag"
                                        command="Report Hacking"
                                        :disabled="userDialog.ref.$isModerator">
                                        {{ $t('dialog.user.actions.report_hacking') }}
                                    </el-dropdown-item>
                                    <template v-if="userDialog.isFriend">
                                        <el-dropdown-item
                                            icon="el-icon-delete"
                                            command="Unfriend"
                                            divided
                                            style="color: #f56c6c">
                                            {{ $t('dialog.user.actions.unfriend') }}
                                        </el-dropdown-item>
                                    </template>
                                </template>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>

            <el-tabs ref="userDialogTabs" @tab-click="userDialogTabClick">
                <el-tab-pane :label="$t('dialog.user.info.header')">
                    <template v-if="isFriendOnline(userDialog.friend) || API.currentUser.id === userDialog.id">
                        <div
                            v-if="userDialog.ref.location"
                            style="
                                display: flex;
                                flex-direction: column;
                                margin-bottom: 10px;
                                padding-bottom: 10px;
                                border-bottom: 1px solid #e4e7ed14;
                            ">
                            <div style="flex: none">
                                <template v-if="isRealInstance(userDialog.$location.tag)">
                                    <launch
                                        :location="userDialog.$location.tag"
                                        @show-launch-dialog="showLaunchDialog"></launch>
                                    <el-tooltip
                                        placement="top"
                                        :content="$t('dialog.user.info.self_invite_tooltip')"
                                        :disabled="hideTooltips">
                                        <invite-yourself
                                            :location="userDialog.$location.tag"
                                            :shortname="userDialog.$location.shortName"
                                            style="margin-left: 5px"></invite-yourself>
                                    </el-tooltip>
                                    <el-tooltip
                                        placement="top"
                                        :content="$t('dialog.user.info.refresh_instance_info')"
                                        :disabled="hideTooltips">
                                        <el-button
                                            @click="refreshInstancePlayerCount(userDialog.$location.tag)"
                                            size="mini"
                                            icon="el-icon-refresh"
                                            style="margin-left: 5px"
                                            circle></el-button>
                                    </el-tooltip>
                                    <last-join
                                        :location="userDialog.$location.tag"
                                        :currentlocation="lastLocation.location"></last-join>
                                    <instance-info
                                        :location="userDialog.$location.tag"
                                        :instance="userDialog.instance.ref"
                                        :friendcount="userDialog.instance.friendCount"
                                        :updateelement="updateInstanceInfo"></instance-info>
                                </template>
                                <location
                                    :location="userDialog.ref.location"
                                    :traveling="userDialog.ref.travelingToLocation"
                                    style="display: block; margin-top: 5px"></location>
                            </div>
                            <div class="x-friend-list" style="flex: 1; margin-top: 10px; max-height: 150px">
                                <div
                                    class="x-friend-item x-friend-item-border"
                                    v-if="userDialog.$location.userId"
                                    @click="showUserDialog(userDialog.$location.userId)">
                                    <template v-if="userDialog.$location.user">
                                        <div class="avatar" :class="userStatusClass(userDialog.$location.user)">
                                            <img :src="userImage(userDialog.$location.user, true)" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                v-text="userDialog.$location.user.displayName"
                                                :style="{ color: userDialog.$location.user.$userColour }"></span>
                                            <span class="extra">{{ $t('dialog.user.info.instance_creator') }}</span>
                                        </div>
                                    </template>
                                    <span v-else v-text="userDialog.$location.userId"></span>
                                </div>
                                <div
                                    class="x-friend-item x-friend-item-border"
                                    v-for="user in userDialog.users"
                                    :key="user.id"
                                    @click="showUserDialog(user.id)">
                                    <div class="avatar" :class="userStatusClass(user)">
                                        <img :src="userImage(user, true)" />
                                    </div>
                                    <div class="detail">
                                        <span
                                            class="name"
                                            v-text="user.displayName"
                                            :style="{ color: user.$userColour }"></span>
                                        <span class="extra" v-if="user.location === 'traveling'">
                                            <i class="el-icon-loading" style="margin-right: 5px"></i>
                                            <timer :epoch="user.$travelingToTime"></timer>
                                        </span>
                                        <span class="extra" v-else>
                                            <timer :epoch="user.$location_at"></timer>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <div class="x-friend-list" style="max-height: none">
                        <div v-if="!hideUserNotes" class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ $t('dialog.user.info.note') }}</span>
                                <el-input
                                    v-model="userDialog.note"
                                    type="textarea"
                                    maxlength="256"
                                    show-word-limit
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    @change="checkNote(userDialog.ref, userDialog.note)"
                                    @input="cleanNote(userDialog.note)"
                                    :placeholder="$t('dialog.user.info.note_placeholder')"
                                    size="mini"
                                    resize="none"></el-input>
                                <div style="float: right">
                                    <i
                                        class="el-icon-loading"
                                        v-if="userDialog.noteSaving"
                                        style="margin-left: 5px"></i>
                                    <i
                                        class="el-icon-more-outline"
                                        v-else-if="userDialog.note !== userDialog.ref.note"
                                        style="margin-left: 5px"></i>
                                    <el-button
                                        v-if="userDialog.note"
                                        type="text"
                                        icon="el-icon-delete"
                                        size="mini"
                                        @click="deleteNote(userDialog.id)"
                                        style="margin-left: 5px"></el-button>
                                </div>
                            </div>
                        </div>
                        <div v-if="!hideUserMemos" class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ $t('dialog.user.info.memo') }}</span>
                                <el-input
                                    class="extra"
                                    v-model="userDialog.memo"
                                    @change="onUserMemoChange"
                                    type="textarea"
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    :placeholder="$t('dialog.user.info.memo_placeholder')"
                                    size="mini"
                                    resize="none"></el-input>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span
                                    class="name"
                                    v-if="
                                        userDialog.id !== API.currentUser.id &&
                                        userDialog.ref.profilePicOverride &&
                                        userDialog.ref.currentAvatarImageUrl
                                    ">
                                    {{ $t('dialog.user.info.avatar_info_last_seen') }}
                                </span>
                                <span class="name" v-else>{{ $t('dialog.user.info.avatar_info') }}</span>
                                <div class="extra">
                                    <avatar-info
                                        :imageurl="userDialog.ref.currentAvatarImageUrl"
                                        :userid="userDialog.id"
                                        :avatartags="userDialog.ref.currentAvatarTags"
                                        style="display: inline-block"></avatar-info>
                                    <el-tooltip
                                        v-if="
                                            userDialog.ref.profilePicOverride &&
                                            !userDialog.ref.currentAvatarImageUrl &&
                                            !hideTooltips
                                        "
                                        placement="top"
                                        :content="$t('dialog.user.info.vrcplus_hides_avatar')">
                                        <i class="el-icon-warning"></i>
                                    </el-tooltip>
                                </div>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name" style="margin-bottom: 5px">{{
                                    $t('dialog.user.info.represented_group')
                                }}</span>
                                <div
                                    class="extra"
                                    v-if="
                                        userDialog.isRepresentedGroupLoading ||
                                        (userDialog.representedGroup && userDialog.representedGroup.isRepresenting)
                                    ">
                                    <div style="display: inline-block; flex: none; margin-right: 5px">
                                        <el-popover placement="right" width="500px" trigger="click">
                                            <el-image
                                                slot="reference"
                                                class="x-link"
                                                v-loading="userDialog.isRepresentedGroupLoading"
                                                :src="userDialog.representedGroup.$thumbnailUrl"
                                                style="
                                                    flex: none;
                                                    width: 60px;
                                                    height: 60px;
                                                    border-radius: 4px;
                                                    object-fit: cover;
                                                "
                                                :style="{
                                                    background: userDialog.isRepresentedGroupLoading ? '#f5f7fa' : ''
                                                }"
                                                @load="userDialog.isRepresentedGroupLoading = false">
                                                <div slot="error"></div>
                                            </el-image>
                                            <img
                                                class="x-link"
                                                v-lazy="userDialog.representedGroup.iconUrl"
                                                style="height: 500px"
                                                @click="
                                                    showFullscreenImageDialog(userDialog.representedGroup.iconUrl)
                                                " />
                                        </el-popover>
                                    </div>
                                    <span
                                        v-if="userDialog.representedGroup.isRepresenting"
                                        style="vertical-align: top; cursor: pointer"
                                        @click="showGroupDialog(userDialog.representedGroup.groupId)">
                                        <span
                                            v-if="userDialog.representedGroup.ownerId === userDialog.id"
                                            style="margin-right: 5px"
                                            >👑</span
                                        >
                                        <span
                                            v-text="userDialog.representedGroup.name"
                                            style="margin-right: 5px"></span>
                                        <span>({{ userDialog.representedGroup.memberCount }})</span>
                                    </span>
                                </div>
                                <div class="extra" v-else>-</div>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ $t('dialog.user.info.bio') }}</span>
                                <pre
                                    class="extra"
                                    style="
                                        font-family: inherit;
                                        font-size: 12px;
                                        white-space: pre-wrap;
                                        margin: 0 0.5em 0 0;
                                        max-height: 40vh;
                                        overflow-y: auto;
                                    "
                                    >{{ userDialog.ref.bio || '-' }}</pre
                                >
                                <div v-if="userDialog.id === API.currentUser.id" style="float: right">
                                    <el-button
                                        type="text"
                                        icon="el-icon-edit"
                                        size="mini"
                                        @click="showBioDialog"
                                        style="margin-left: 5px"></el-button>
                                </div>
                                <div style="margin-top: 5px">
                                    <el-tooltip v-for="(link, index) in userDialog.ref.bioLinks" :key="index">
                                        <template #content>
                                            <span v-text="link"></span>
                                        </template>
                                        <img
                                            :src="getFaviconUrl(link)"
                                            onerror="this.onerror=null;this.class='el-icon-error'"
                                            style="
                                                width: 16px;
                                                height: 16px;
                                                vertical-align: middle;
                                                margin-right: 5px;
                                                cursor: pointer;
                                            "
                                            @click.stop="openExternalLink(link)" />
                                    </el-tooltip>
                                </div>
                            </div>
                        </div>
                        <template v-if="API.currentUser.id !== userDialog.id">
                            <div class="x-friend-item" style="cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ $t('dialog.user.info.last_seen') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="$t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra">{{ userDialog.lastSeen | formatDate('long') }}</span>
                                </div>
                            </div>
                            <el-tooltip
                                :disabled="hideTooltips"
                                placement="top"
                                :content="$t('dialog.user.info.open_previouse_instance')">
                                <div class="x-friend-item" @click="showPreviousInstancesUserDialog(userDialog.ref)">
                                    <div class="detail">
                                        <span class="name">
                                            {{ $t('dialog.user.info.join_count') }}
                                            <el-tooltip
                                                v-if="!hideTooltips"
                                                placement="top"
                                                style="margin-left: 5px"
                                                :content="$t('dialog.user.info.accuracy_notice')">
                                                <i class="el-icon-warning"></i>
                                            </el-tooltip>
                                        </span>
                                        <span class="extra" v-if="userDialog.joinCount === 0">-</span>
                                        <span class="extra" v-else v-text="userDialog.joinCount"></span>
                                    </div>
                                </div>
                            </el-tooltip>
                            <div class="x-friend-item" style="cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ $t('dialog.user.info.time_together') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="$t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra" v-if="userDialog.timeSpent === 0">-</span>
                                    <span class="extra" v-else>{{ timeToText(userDialog.timeSpent) }}</span>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <el-tooltip
                                :disabled="hideTooltips || API.currentUser.id !== userDialog.id"
                                placement="top"
                                :content="$t('dialog.user.info.open_previouse_instance')">
                                <div class="x-friend-item" @click="showPreviousInstancesUserDialog(userDialog.ref)">
                                    <div class="detail">
                                        <span class="name">
                                            {{ $t('dialog.user.info.play_time') }}
                                            <el-tooltip
                                                v-if="!hideTooltips"
                                                placement="top"
                                                style="margin-left: 5px"
                                                :content="$t('dialog.user.info.accuracy_notice')">
                                                <i class="el-icon-warning"></i>
                                            </el-tooltip>
                                        </span>
                                        <span class="extra" v-if="userDialog.timeSpent === 0">-</span>
                                        <span class="extra" v-else>{{ timeToText(userDialog.timeSpent) }}</span>
                                    </div>
                                </div>
                            </el-tooltip>
                        </template>
                        <div class="x-friend-item" style="cursor: default">
                            <el-tooltip :placement="API.currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                                <template #content>
                                    <span>{{ userOnlineForTimestamp(userDialog) | formatDate('short') }}</span>
                                </template>
                                <div class="detail">
                                    <span
                                        class="name"
                                        v-if="userDialog.ref.state === 'online' && userDialog.ref.$online_for">
                                        {{ $t('dialog.user.info.online_for') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="$t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="name" v-else>
                                        {{ $t('dialog.user.info.offline_for') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="$t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra">{{ userOnlineFor(userDialog) }}</span>
                                </div>
                            </el-tooltip>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <el-tooltip :placement="API.currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                                <template #content>
                                    <span
                                        >{{ $t('dialog.user.info.last_login') }}
                                        {{ userDialog.ref.last_login | formatDate('short') }}</span
                                    >
                                </template>
                                <div class="detail">
                                    <span class="name">{{ $t('dialog.user.info.last_activity') }}</span>
                                    <span class="extra">{{ userDialog.ref.last_activity | formatDate('long') }}</span>
                                </div>
                            </el-tooltip>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ $t('dialog.user.info.date_joined') }}</span>
                                <span class="extra" v-text="userDialog.ref.date_joined"></span>
                            </div>
                        </div>
                        <div v-if="API.currentUser.id !== userDialog.id" class="x-friend-item" style="cursor: default">
                            <el-tooltip placement="top" :disabled="!userDialog.dateFriendedInfo.length">
                                <template #content v-if="userDialog.dateFriendedInfo.length">
                                    <template v-for="ref in userDialog.dateFriendedInfo">
                                        <span>{{ ref.type }}: {{ ref.created_at | formatDate('long') }}</span
                                        ><br />
                                    </template>
                                </template>
                                <div class="detail">
                                    <span class="name" v-if="userDialog.unFriended">
                                        {{ $t('dialog.user.info.unfriended') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="$t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="name" v-else>
                                        {{ $t('dialog.user.info.friended') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="$t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra">{{ userDialog.dateFriended | formatDate('long') }}</span>
                                </div>
                            </el-tooltip>
                        </div>
                        <template v-if="API.currentUser.id === userDialog.id">
                            <div class="x-friend-item" @click="toggleAvatarCopying">
                                <div class="detail">
                                    <span class="name">{{ $t('dialog.user.info.avatar_cloning') }}</span>
                                    <span
                                        class="extra"
                                        v-if="API.currentUser.allowAvatarCopying"
                                        style="color: #67c23a"
                                        >{{ $t('dialog.user.info.avatar_cloning_allow') }}</span
                                    >
                                    <span class="extra" v-else style="color: #f56c6c">{{
                                        $t('dialog.user.info.avatar_cloning_deny')
                                    }}</span>
                                </div>
                            </div>
                            <!--//- .x-friend-item(@click="toggleAllowBooping")-->
                            <!--//-     .detail-->
                            <!--//-         span.name {{ $t('dialog.user.info.booping') }}-->
                            <!--//-         span.extra(v-if="API.currentUser.isBoopingEnabled" style="color:#67C23A") {{ $t('dialog.user.info.avatar_cloning_allow') }}-->
                            <!--//-         span.extra(v-else style="color:#F56C6C") {{ $t('dialog.user.info.avatar_cloning_deny') }}-->
                        </template>
                        <template v-else>
                            <div class="x-friend-item" style="cursor: default">
                                <div class="detail">
                                    <span class="name">{{ $t('dialog.user.info.avatar_cloning') }}</span>
                                    <span
                                        class="extra"
                                        v-if="userDialog.ref.allowAvatarCopying"
                                        style="color: #67c23a"
                                        >{{ $t('dialog.user.info.avatar_cloning_allow') }}</span
                                    >
                                    <span class="extra" v-else style="color: #f56c6c">{{
                                        $t('dialog.user.info.avatar_cloning_deny')
                                    }}</span>
                                </div>
                            </div>
                        </template>
                        <div
                            v-if="userDialog.ref.id === API.currentUser.id && API.currentUser.homeLocation"
                            class="x-friend-item"
                            @click="showWorldDialog(API.currentUser.homeLocation)"
                            style="width: 100%">
                            <div class="detail">
                                <span class="name">{{ $t('dialog.user.info.home_location') }}</span>
                                <span class="extra">
                                    <span v-text="userDialog.$homeLocationName"></span>
                                    <el-button
                                        @click.stop="resetHome()"
                                        size="mini"
                                        icon="el-icon-delete"
                                        circle
                                        style="margin-left: 5px">
                                    </el-button>
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ $t('dialog.user.info.id') }}</span>
                                <span class="extra">
                                    {{ userDialog.id }}
                                    <el-tooltip
                                        placement="top"
                                        :content="$t('dialog.user.info.id_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-dropdown
                                            trigger="click"
                                            @click.native.stop
                                            size="mini"
                                            style="margin-left: 5px">
                                            <el-button
                                                type="default"
                                                icon="el-icon-s-order"
                                                size="mini"
                                                circle></el-button>
                                            <el-dropdown-menu slot="dropdown">
                                                <el-dropdown-item @click.native="copyUserId(userDialog.id)">{{
                                                    $t('dialog.user.info.copy_id')
                                                }}</el-dropdown-item>
                                                <el-dropdown-item @click.native="copyUserURL(userDialog.id)">{{
                                                    $t('dialog.user.info.copy_url')
                                                }}</el-dropdown-item>
                                                <el-dropdown-item
                                                    @click.native="copyUserDisplayName(userDialog.ref.displayName)"
                                                    >{{ $t('dialog.user.info.copy_display_name') }}</el-dropdown-item
                                                >
                                            </el-dropdown-menu>
                                        </el-dropdown>
                                    </el-tooltip>
                                </span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="$t('dialog.user.groups.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                type="default"
                                :loading="userDialog.isGroupsLoading"
                                @click="getUserGroups(userDialog.id)"
                                size="mini"
                                icon="el-icon-refresh"
                                circle>
                            </el-button>
                            <span style="margin-left: 5px">{{
                                $t('dialog.user.groups.total_count', { count: userGroups.groups.length })
                            }}</span>
                            <template v-if="userDialogGroupEditMode">
                                <span style="margin-left: 10px; color: #909399; font-size: 10px">{{
                                    $t('dialog.user.groups.hold_shift')
                                }}</span>
                            </template>
                        </div>
                        <div style="display: flex; align-items: center">
                            <template v-if="!userDialogGroupEditMode">
                                <span style="margin-right: 5px">{{ $t('dialog.user.groups.sort_by') }}</span>
                                <el-dropdown
                                    @click.native.stop
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="userDialog.isGroupsLoading">
                                    <el-button size="mini">
                                        <span
                                            >{{ userDialog.groupSorting.name }}
                                            <i class="el-icon-arrow-down el-icon--right"></i
                                        ></span>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <el-dropdown-item
                                            :disabled="
                                                item === userDialogGroupSortingOptions.inGame &&
                                                userDialog.id !== API.currentUser.id
                                            "
                                            v-for="(item, key) in userDialogGroupSortingOptions"
                                            :key="key"
                                            v-text="item.name"
                                            @click.native="setUserDialogGroupSorting(item)">
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </el-dropdown>
                            </template>
                            <el-button
                                v-if="userDialogGroupEditMode"
                                size="small"
                                @click="exitEditModeCurrentUserGroups"
                                icon="el-icon-edit"
                                style="margin-right: 5px; height: 29px; padding: 7px 15px">
                                {{ $t('dialog.user.groups.exit_edit_mode') }}
                            </el-button>
                            <el-button
                                v-else-if="API.currentUser.id === userDialog.id"
                                size="small"
                                @click="editModeCurrentUserGroups"
                                icon="el-icon-edit"
                                style="margin-right: 5px; height: 29px; padding: 7px 15px">
                                {{ $t('dialog.user.groups.edit_mode') }}
                            </el-button>
                        </div>
                    </div>
                    <div v-loading="userDialog.isGroupsLoading" style="margin-top: 10px">
                        <template v-if="userDialogGroupEditMode">
                            <div class="x-friend-list" style="margin-top: 10px; margin-bottom: 15px; max-height: unset">
                                <div
                                    class="x-friend-item x-friend-item-border"
                                    v-for="group in userDialogGroupEditGroups"
                                    :key="group.id"
                                    @click="showGroupDialog(group.id)"
                                    style="width: 100%">
                                    <div @click.stop style="margin-right: 3px; margin-left: 5px">
                                        <el-button
                                            @click="moveGroupUp(group.id)"
                                            size="mini"
                                            icon="el-icon-download"
                                            style="
                                                display: block;
                                                padding: 7px;
                                                font-size: 9px;
                                                margin-left: 0;
                                                rotate: 180deg;
                                            ">
                                        </el-button>
                                        <el-button
                                            @click="moveGroupDown(group.id)"
                                            size="mini"
                                            icon="el-icon-download"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0">
                                        </el-button>
                                    </div>
                                    <div @click.stop style="margin-right: 10px">
                                        <el-button
                                            @click="moveGroupTop(group.id)"
                                            size="mini"
                                            icon="el-icon-top"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0">
                                        </el-button>
                                        <el-button
                                            @click="moveGroupBottom(group.id)"
                                            size="mini"
                                            icon="el-icon-bottom"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0">
                                        </el-button>
                                    </div>
                                    <div class="avatar">
                                        <img v-lazy="group.iconUrl" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="group.name"></span>
                                        <span class="extra">
                                            <el-tooltip
                                                v-if="group.isRepresenting"
                                                placement="top"
                                                :content="$t('dialog.group.members.representing')">
                                                <i class="el-icon-collection-tag" style="margin-right: 5px"></i>
                                            </el-tooltip>
                                            <el-tooltip v-if="group.myMember.visibility !== 'visible'" placement="top">
                                                <template #content>
                                                    <span
                                                        >{{ $t('dialog.group.members.visibility') }}
                                                        {{ group.myMember.visibility }}</span
                                                    >
                                                </template>
                                                <i class="el-icon-view" style="margin-right: 5px"></i>
                                            </el-tooltip>
                                            <span>({{ group.memberCount }})</span>
                                        </span>
                                    </div>
                                    <el-dropdown
                                        @click.native.stop
                                        :disabled="group.privacy !== 'default'"
                                        trigger="click"
                                        size="small"
                                        style="margin-right: 5px">
                                        <el-button size="mini">
                                            <span v-if="group.myMember.visibility === 'visible'">{{
                                                $t('dialog.group.tags.visible')
                                            }}</span>
                                            <span v-else-if="group.myMember.visibility === 'friends'">{{
                                                $t('dialog.group.tags.friends')
                                            }}</span>
                                            <span v-else-if="group.myMember.visibility === 'hidden'">{{
                                                $t('dialog.group.tags.hidden')
                                            }}</span>
                                            <span v-else>{{ group.myMember.visibility }}</span>
                                            <i class="el-icon-arrow-down el-icon--right" style="margin-left: 5px"></i>
                                        </el-button>
                                        <el-dropdown-menu>
                                            <el-dropdown-item @click.native="setGroupVisibility(group.id, 'visible')"
                                                ><i
                                                    class="el-icon-check"
                                                    v-if="group.myMember.visibility === 'visible'"></i>
                                                {{ $t('dialog.group.actions.visibility_everyone') }}</el-dropdown-item
                                            >
                                            <el-dropdown-item @click.native="setGroupVisibility(group.id, 'friends')"
                                                ><i
                                                    class="el-icon-check"
                                                    v-if="group.myMember.visibility === 'friends'"></i>
                                                {{ $t('dialog.group.actions.visibility_friends') }}</el-dropdown-item
                                            >
                                            <el-dropdown-item @click.native="setGroupVisibility(group.id, 'hidden')"
                                                ><i
                                                    class="el-icon-check"
                                                    v-if="group.myMember.visibility === 'hidden'"></i>
                                                {{ $t('dialog.group.actions.visibility_hidden') }}</el-dropdown-item
                                            >
                                        </el-dropdown-menu>
                                    </el-dropdown>
                                    <!--//- JSON is missing isSubscribedToAnnouncements, can't be implemented-->
                                    <!--//- el-dropdown(@click.native.stop trigger="click" size="small" style="margin-right:5px")-->
                                    <!--//-     el-tooltip(placement="top" :disabled="hideTooltips")-->
                                    <!--//-         template(#content)-->
                                    <!--//-             span(v-if="group.myMember.isSubscribedToAnnouncements") {{ $t('dialog.group.actions.unsubscribe') }}-->
                                    <!--//-             span(v-else) {{ $t('dialog.group.actions.subscribe') }}-->
                                    <!--//-         el-button(v-if="group.myMember.isSubscribedToAnnouncements" @click.stop="setGroupSubscription(group.id, false)" circle size="mini")-->
                                    <!--//-             i.el-icon-chat-line-square-->
                                    <!--//-         el-button(v-else circle @click.stop="setGroupSubscription(group.id, true)" size="mini")-->
                                    <!--//-             i.el-icon-chat-square(style="color:#f56c6c")-->
                                    <el-tooltip
                                        placement="right"
                                        :content="$t('dialog.user.groups.leave_group_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-button
                                            v-if="shiftHeld"
                                            @click.stop="leaveGroupPrompt(group.id)"
                                            size="mini"
                                            icon="el-icon-close"
                                            circle
                                            style="color: #f56c6c; margin-left: 5px">
                                        </el-button>
                                        <el-button
                                            v-else
                                            @click.stop="leaveGroupPrompt(group.id)"
                                            size="mini"
                                            icon="el-icon-delete"
                                            circle
                                            style="margin-left: 5px">
                                        </el-button>
                                    </el-tooltip>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <template v-if="userGroups.ownGroups.length > 0">
                                <span style="font-weight: bold; font-size: 16px">{{
                                    $t('dialog.user.groups.own_groups')
                                }}</span>
                                <span style="color: #909399; font-size: 12px; margin-left: 5px"
                                    >{{ userGroups.ownGroups.length }}/{{
                                        API.cachedConfig?.constants?.GROUPS?.MAX_OWNED
                                    }}</span
                                >
                                <div
                                    class="x-friend-list"
                                    style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
                                    <div
                                        class="x-friend-item x-friend-item-border"
                                        v-for="group in userGroups.ownGroups"
                                        :key="group.id"
                                        @click="showGroupDialog(group.id)">
                                        <div class="avatar">
                                            <img v-lazy="group.iconUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="group.name"></span>
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="$t('dialog.group.members.representing')">
                                                    <i class="el-icon-collection-tag" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ $t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <i class="el-icon-view" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <span>({{ group.memberCount }})</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template v-if="userGroups.mutualGroups.length > 0">
                                <span style="font-weight: bold; font-size: 16px">{{
                                    $t('dialog.user.groups.mutual_groups')
                                }}</span>
                                <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                    userGroups.mutualGroups.length
                                }}</span>
                                <div
                                    class="x-friend-list"
                                    style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
                                    <div
                                        class="x-friend-item x-friend-item-border"
                                        v-for="group in userGroups.mutualGroups"
                                        :key="group.id"
                                        @click="showGroupDialog(group.id)">
                                        <div class="avatar">
                                            <img v-lazy="group.iconUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="group.name"></span>
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="$t('dialog.group.members.representing')">
                                                    <i class="el-icon-collection-tag" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ $t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <i class="el-icon-view" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <span>({{ group.memberCount }})</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template v-if="userGroups.remainingGroups.length > 0">
                                <span style="font-weight: bold; font-size: 16px">{{
                                    $t('dialog.user.groups.groups')
                                }}</span>
                                <span style="color: #909399; font-size: 12px; margin-left: 5px">
                                    {{ userGroups.remainingGroups.length }}
                                    <template v-if="API.currentUser.id === userDialog.id">
                                        /
                                        <template v-if="API.currentUser.$isVRCPlus">
                                            {{ API.cachedConfig?.constants?.GROUPS?.MAX_JOINED_PLUS }}
                                        </template>
                                        <template v-else>
                                            {{ API.cachedConfig?.constants?.GROUPS?.MAX_JOINED }}
                                        </template>
                                    </template>
                                </span>
                                <div
                                    class="x-friend-list"
                                    style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
                                    <div
                                        class="x-friend-item x-friend-item-border"
                                        v-for="group in userGroups.remainingGroups"
                                        :key="group.id"
                                        @click="showGroupDialog(group.id)">
                                        <div class="avatar">
                                            <img v-lazy="group.iconUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="group.name"></span>
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="$t('dialog.group.members.representing')">
                                                    <i class="el-icon-collection-tag" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ $t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <i class="el-icon-view" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <span>({{ group.memberCount }})</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </template>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="$t('dialog.user.worlds.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                type="default"
                                :loading="userDialog.isWorldsLoading"
                                @click="refreshUserDialogWorlds()"
                                size="mini"
                                icon="el-icon-refresh"
                                circle>
                            </el-button>
                            <span style="margin-left: 5px">{{
                                $t('dialog.user.worlds.total_count', { count: userDialog.worlds.length })
                            }}</span>
                        </div>
                        <div style="display: flex; align-items: center">
                            <span style="margin-right: 5px">{{ $t('dialog.user.worlds.sort_by') }}</span>
                            <el-dropdown
                                @click.native.stop
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="userDialog.isWorldsLoading">
                                <el-button size="mini">
                                    <span
                                        >{{ userDialog.worldSorting.name }}
                                        <i class="el-icon-arrow-down el-icon--right"></i
                                    ></span>
                                </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item
                                        v-for="(item, key) in userDialogWorldSortingOptions"
                                        :key="key"
                                        v-text="item.name"
                                        @click.native="setUserDialogWorldSorting(item)">
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </el-dropdown>
                            <span style="margin: 0 5px">{{ $t('dialog.user.worlds.order_by') }}</span>
                            <el-dropdown
                                @click.native.stop
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="userDialog.isWorldsLoading">
                                <el-button size="mini">
                                    <span
                                        >{{ userDialog.worldOrder.name }}
                                        <i class="el-icon-arrow-down el-icon--right"></i
                                    ></span>
                                </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item
                                        v-for="(item, key) in userDialogWorldOrderOptions"
                                        :key="key"
                                        v-text="item.name"
                                        @click.native="setUserDialogWorldOrder(item)">
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </el-dropdown>
                        </div>
                    </div>
                    <div
                        class="x-friend-list"
                        v-loading="userDialog.isWorldsLoading"
                        style="margin-top: 10px; min-height: 60px">
                        <div
                            class="x-friend-item x-friend-item-border"
                            v-for="world in userDialog.worlds"
                            :key="world.id"
                            @click="showWorldDialog(world.id)">
                            <div class="avatar">
                                <img v-lazy="world.thumbnailImageUrl" />
                            </div>
                            <div class="detail">
                                <span class="name" v-text="world.name"></span>
                                <span class="extra" v-if="world.occupants">({{ world.occupants }})</span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="$t('dialog.user.favorite_worlds.header')" lazy>
                    <el-button
                        v-if="userFavoriteWorlds && userFavoriteWorlds.length > 0"
                        type="default"
                        :loading="userDialog.isFavoriteWorldsLoading"
                        @click="getUserFavoriteWorlds(userDialog.id)"
                        size="small"
                        icon="el-icon-refresh"
                        circle
                        style="position: absolute; right: 15px; bottom: 15px; z-index: 99">
                    </el-button>
                    <el-tabs
                        class="zero-margin-tabs"
                        type="card"
                        stretch
                        ref="favoriteWorlds"
                        v-loading="userDialog.isFavoriteWorldsLoading"
                        style="margin-top: 10px; height: 50vh">
                        <template v-if="userFavoriteWorlds && userFavoriteWorlds.length > 0">
                            <el-tab-pane v-for="(list, index) in userFavoriteWorlds" :key="index" lazy>
                                <span slot="label">
                                    <i
                                        class="x-status-icon"
                                        style="margin-right: 6px"
                                        :class="userFavoriteWorldsStatus(list[1])">
                                    </i>
                                    <span v-text="list[0]" style="font-weight: bold; font-size: 14px"></span>
                                    <span style="color: #909399; font-size: 10px; margin-left: 5px"
                                        >{{ list[2].length }}/{{ API.favoriteLimits.maxFavoritesPerGroup.world }}</span
                                    >
                                </span>
                                <div
                                    class="x-friend-list"
                                    style="margin-top: 10px; margin-bottom: 15px; min-height: 60px; max-height: none">
                                    <div
                                        class="x-friend-item x-friend-item-border"
                                        v-for="world in list[2]"
                                        :key="world.favoriteId"
                                        @click="showWorldDialog(world.id)">
                                        <div class="avatar">
                                            <img v-lazy="world.thumbnailImageUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="world.name"></span>
                                            <span class="extra" v-if="world.occupants">({{ world.occupants }})</span>
                                        </div>
                                    </div>
                                </div>
                            </el-tab-pane>
                        </template>
                        <template v-else-if="!userDialog.isFavoriteWorldsLoading">
                            <div style="display: flex; justify-content: center; align-items: center; height: 100%">
                                <span style="font-size: 16px">No favorite worlds found.</span>
                            </div>
                        </template>
                    </el-tabs>
                </el-tab-pane>

                <el-tab-pane :label="$t('dialog.user.avatars.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                v-if="userDialog.ref.id === API.currentUser.id"
                                type="default"
                                :loading="userDialog.isAvatarsLoading"
                                @click="refreshUserDialogAvatars()"
                                size="mini"
                                icon="el-icon-refresh"
                                circle>
                            </el-button>
                            <el-button
                                v-else
                                type="default"
                                :loading="userDialog.isAvatarsLoading"
                                @click="setUserDialogAvatarsRemote(userDialog.id)"
                                size="mini"
                                icon="el-icon-refresh"
                                circle>
                            </el-button>
                            <span style="margin-left: 5px">{{
                                $t('dialog.user.avatars.total_count', { count: userDialogAvatars.length })
                            }}</span>
                        </div>
                        <div>
                            <template v-if="userDialog.ref.id === API.currentUser.id">
                                <span style="margin-right: 5px">{{ $t('dialog.user.avatars.sort_by') }}</span>
                                <el-dropdown
                                    @click.native.stop
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="userDialog.isWorldsLoading">
                                    <el-button size="mini">
                                        <span
                                            >{{ $t(`dialog.user.avatars.sort_by_${userDialog.avatarSorting}`) }}
                                            <i class="el-icon-arrow-down el-icon--right"></i
                                        ></span>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <el-dropdown-item
                                            v-text="$t('dialog.user.avatars.sort_by_name')"
                                            @click.native="changeUserDialogAvatarSorting('name')">
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-text="$t('dialog.user.avatars.sort_by_update')"
                                            @click.native="changeUserDialogAvatarSorting('update')">
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </el-dropdown>
                                <span style="margin-right: 5px; margin-left: 10px">{{
                                    $t('dialog.user.avatars.group_by')
                                }}</span>
                                <el-dropdown
                                    @click.native.stop
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="userDialog.isWorldsLoading">
                                    <el-button size="mini">
                                        <span
                                            >{{ $t(`dialog.user.avatars.${userDialog.avatarReleaseStatus}`) }}
                                            <i class="el-icon-arrow-down el-icon--right"></i
                                        ></span>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <el-dropdown-item
                                            v-text="$t('dialog.user.avatars.all')"
                                            @click.native="userDialog.avatarReleaseStatus = 'all'">
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-text="$t('dialog.user.avatars.public')"
                                            @click.native="userDialog.avatarReleaseStatus = 'public'">
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-text="$t('dialog.user.avatars.private')"
                                            @click.native="userDialog.avatarReleaseStatus = 'private'">
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </el-dropdown>
                            </template>
                        </div>
                    </div>
                    <div class="x-friend-list" style="margin-top: 10px; min-height: 60px; max-height: 50vh">
                        <div
                            class="x-friend-item x-friend-item-border"
                            v-for="avatar in userDialogAvatars"
                            :key="avatar.id"
                            @click="showAvatarDialog(avatar.id)">
                            <div class="avatar">
                                <img v-if="avatar.thumbnailImageUrl" v-lazy="avatar.thumbnailImageUrl" />
                            </div>
                            <div class="detail">
                                <span class="name" v-text="avatar.name"></span>
                                <span
                                    class="extra"
                                    v-text="avatar.releaseStatus"
                                    v-if="avatar.releaseStatus === 'public'"
                                    style="color: #67c23a">
                                </span>
                                <span
                                    class="extra"
                                    v-text="avatar.releaseStatus"
                                    v-else-if="avatar.releaseStatus === 'private'"
                                    style="color: #f56c6c">
                                </span>
                                <span class="extra" v-text="avatar.releaseStatus" v-else></span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="$t('dialog.user.json.header')" lazy style="height: 50vh">
                    <el-button
                        type="default"
                        @click="refreshUserDialogTreeData()"
                        size="mini"
                        icon="el-icon-refresh"
                        circle>
                    </el-button>
                    <el-button
                        type="default"
                        @click="downloadAndSaveJson(userDialog.id, userDialog.ref)"
                        size="mini"
                        icon="el-icon-download"
                        circle
                        style="margin-left: 5px">
                    </el-button>
                    <el-tree :data="userDialog.treeData" style="margin-top: 5px; font-size: 12px">
                        <template #default="scope">
                            <span>
                                <span v-text="scope.data.key" style="font-weight: bold; margin-right: 5px"></span>
                                <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                            </span>
                        </template>
                    </el-tree>
                </el-tab-pane>
            </el-tabs>
        </div>
    </safe-dialog>
</template>
