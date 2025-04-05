<template>
    <el-dialog
        ref="groupMemberModeration"
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible.sync="groupMemberModeration.visible"
        :title="$t('dialog.group_member_moderation.header')"
        fullscreen
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <div v-if="groupMemberModeration.visible">
            <h3>{{ groupMemberModeration.groupRef.name }}</h3>
            <el-tabs type="card" style="height: 100%">
                <el-tab-pane :label="$t('dialog.group_member_moderation.members')">
                    <div style="margin-top: 10px">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-refresh"
                            :loading="isGroupMembersLoading"
                            circle
                            @click="loadAllGroupMembers"></el-button>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">
                            {{ groupMemberModerationTable.data.length }}/{{
                                groupMemberModeration.groupRef.memberCount
                            }}
                        </span>
                        <div style="float: right; margin-top: 5px">
                            <span style="margin-right: 5px">{{ $t('dialog.group.members.sort_by') }}</span>
                            <el-dropdown
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="
                                    isGroupMembersLoading ||
                                    groupDialog.memberSearch.length ||
                                    !hasGroupPermission(groupDialog.ref, 'group-bans-manage')
                                "
                                @click.native.stop>
                                <el-button size="mini">
                                    <span
                                        >{{ groupDialog.memberSortOrder.name }}
                                        <i class="el-icon-arrow-down el-icon--right"></i
                                    ></span>
                                </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item
                                        v-for="item in groupDialogSortingOptions"
                                        :key="item.name"
                                        @click.native="setGroupMemberSortOrder(item)">
                                        {{ item.name }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </el-dropdown>
                            <span style="margin-right: 5px">{{ $t('dialog.group.members.filter') }}</span>
                            <el-dropdown
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="
                                    isGroupMembersLoading ||
                                    groupDialog.memberSearch.length ||
                                    !hasGroupPermission(groupDialog.ref, 'group-bans-manage')
                                "
                                @click.native.stop>
                                <el-button size="mini">
                                    <span
                                        >{{ groupDialog.memberFilter.name }}
                                        <i class="el-icon-arrow-down el-icon--right"></i
                                    ></span>
                                </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item
                                        v-for="item in groupDialogFilterOptions"
                                        :key="item.name"
                                        @click.native="setGroupMemberFilter(item)"
                                        v-text="item.name"></el-dropdown-item>
                                    <el-dropdown-item
                                        v-for="item in groupDialog.ref.roles"
                                        v-if="!item.defaultRole"
                                        :key="item.name"
                                        @click.native="setGroupMemberFilter(item)"
                                        v-text="item.name"></el-dropdown-item>
                                </el-dropdown-menu>
                            </el-dropdown>
                        </div>
                        <el-input
                            v-model="groupDialog.memberSearch"
                            :disabled="!hasGroupPermission(groupDialog.ref, 'group-bans-manage')"
                            clearable
                            size="mini"
                            :placeholder="$t('dialog.group.members.search')"
                            style="margin-top: 10px; margin-bottom: 10px"
                            @input="groupMembersSearch"></el-input>
                        <br />
                        <el-button size="small" @click="selectAllGroupMembers">{{
                            $t('dialog.group_member_moderation.select_all')
                        }}</el-button>
                        <data-tables v-bind="groupMemberModerationTable" style="margin-top: 10px">
                            <el-table-column :key="groupMemberModerationTableForceUpdate" width="55" prop="$selected">
                                <template slot-scope="scope">
                                    <el-button type="text" size="mini" @click.stop>
                                        <el-checkbox
                                            v-model="scope.row.$selected"
                                            @change="
                                                groupMemberModerationTableSelectionChange(scope.row)
                                            "></el-checkbox>
                                    </el-button>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.avatar')"
                                width="70"
                                prop="photo">
                                <template slot-scope="scope">
                                    <el-popover placement="right" height="500px" trigger="hover">
                                        <img
                                            slot="reference"
                                            v-lazy="userImage(scope.row.user)"
                                            class="friends-list-avatar" />
                                        <img
                                            v-lazy="userImageFull(scope.row.user)"
                                            class="friends-list-avatar"
                                            style="height: 500px; cursor: pointer"
                                            @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                    </el-popover>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.display_name')"
                                width="160"
                                prop="$displayName"
                                sortable>
                                <template slot-scope="scope">
                                    <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                        <span
                                            v-if="randomUserColours"
                                            :style="{ color: scope.row.user.$userColour }"
                                            v-text="scope.row.user.displayName"></span>
                                        <span v-else v-text="scope.row.user.displayName"></span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.roles')"
                                prop="roleIds"
                                sortable>
                                <template slot-scope="scope">
                                    <template v-for="(roleId, index) in scope.row.roleIds">
                                        <span
                                            v-for="(role, rIndex) in groupMemberModeration.groupRef.roles"
                                            v-if="role.id === roleId"
                                            :key="rIndex"
                                            >{{ role.name }}</span
                                        >
                                        <span v-if="index < scope.row.roleIds.length - 1">, </span>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.notes')"
                                prop="managerNotes"
                                sortable>
                                <template slot-scope="scope">
                                    <span @click.stop v-text="scope.row.managerNotes"></span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.joined_at')"
                                width="170"
                                prop="joinedAt"
                                sortable>
                                <template slot-scope="scope">
                                    <span>{{ scope.row.joinedAt | formatDate('long') }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.visibility')"
                                width="120"
                                prop="visibility"
                                sortable>
                                <template slot-scope="scope">
                                    <span v-text="scope.row.visibility"></span>
                                </template>
                            </el-table-column>
                        </data-tables>
                    </div>
                </el-tab-pane>

                <el-tab-pane
                    :label="$t('dialog.group_member_moderation.bans')"
                    :disabled="!hasGroupPermission(groupDialog.ref, 'group-bans-manage')">
                    <div style="margin-top: 10px">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-refresh"
                            :loading="isGroupMembersLoading"
                            circle
                            @click="getAllGroupBans(groupMemberModeration.id)"></el-button>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">{{
                            groupBansModerationTable.data.length
                        }}</span>
                        <br />
                        <el-input
                            v-model="groupBansModerationTable.filters[0].value"
                            clearable
                            size="mini"
                            :placeholder="$t('dialog.group.members.search')"
                            style="margin-top: 10px; margin-bottom: 10px"></el-input>
                        <br />
                        <el-button size="small" @click="selectAllGroupBans">{{
                            $t('dialog.group_member_moderation.select_all')
                        }}</el-button>
                        <data-tables v-bind="groupBansModerationTable" style="margin-top: 10px">
                            <el-table-column :key="groupMemberModerationTableForceUpdate" width="55" prop="$selected">
                                <template slot-scope="scope">
                                    <el-button type="text" size="mini" @click.stop>
                                        <el-checkbox
                                            v-model="scope.row.$selected"
                                            @change="
                                                groupMemberModerationTableSelectionChange(scope.row)
                                            "></el-checkbox>
                                    </el-button>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.avatar')"
                                width="70"
                                prop="photo">
                                <template slot-scope="scope">
                                    <el-popover placement="right" height="500px" trigger="hover">
                                        <img
                                            slot="reference"
                                            v-lazy="userImage(scope.row.user)"
                                            class="friends-list-avatar" />
                                        <img
                                            v-lazy="userImageFull(scope.row.user)"
                                            class="friends-list-avatar"
                                            style="height: 500px; cursor: pointer"
                                            @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                    </el-popover>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.display_name')"
                                width="160"
                                prop="$displayName"
                                sortable>
                                <template slot-scope="scope">
                                    <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                        <span
                                            v-if="randomUserColours"
                                            :style="{ color: scope.row.user.$userColour }"
                                            v-text="scope.row.user.displayName"></span>
                                        <span v-else v-text="scope.row.user.displayName"></span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.roles')"
                                prop="roleIds"
                                sortable>
                                <template slot-scope="scope">
                                    <template v-for="(roleId, index) in scope.row.roleIds">
                                        <span
                                            v-for="(role, rIndex) in groupMemberModeration.groupRef.roles"
                                            v-if="role.id === roleId"
                                            :key="rIndex"
                                            >{{ role.name }}</span
                                        >
                                        <span v-if="index < scope.row.roleIds.length - 1">, </span>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.notes')"
                                prop="managerNotes"
                                sortable>
                                <template slot-scope="scope">
                                    <span @click.stop v-text="scope.row.managerNotes"></span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.joined_at')"
                                width="170"
                                prop="joinedAt"
                                sortable>
                                <template slot-scope="scope">
                                    <span>{{ scope.row.joinedAt | formatDate('long') }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.banned_at')"
                                width="170"
                                prop="bannedAt"
                                sortable>
                                <template slot-scope="scope">
                                    <span>{{ scope.row.bannedAt | formatDate('long') }}</span>
                                </template>
                            </el-table-column>
                        </data-tables>
                    </div>
                </el-tab-pane>

                <el-tab-pane
                    :label="$t('dialog.group_member_moderation.invites')"
                    :disabled="!hasGroupPermission(groupDialog.ref, 'group-invites-manage')">
                    <div style="margin-top: 10px">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-refresh"
                            :loading="isGroupMembersLoading"
                            circle
                            @click="getAllGroupInvitesAndJoinRequests(groupMemberModeration.id)"></el-button>
                        <br />
                        <el-tabs>
                            <el-tab-pane>
                                <span slot="label">
                                    <span style="font-weight: bold; font-size: 16px">{{
                                        $t('dialog.group_member_moderation.sent_invites')
                                    }}</span>
                                    <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                        groupInvitesModerationTable.data.length
                                    }}</span>
                                </span>
                                <el-button size="small" @click="selectAllGroupInvites">{{
                                    $t('dialog.group_member_moderation.select_all')
                                }}</el-button>
                                <data-tables v-bind="groupInvitesModerationTable" style="margin-top: 10px">
                                    <el-table-column
                                        :key="groupMemberModerationTableForceUpdate"
                                        width="55"
                                        prop="$selected">
                                        <template slot-scope="scope">
                                            <el-button type="text" size="mini" @click.stop>
                                                <el-checkbox
                                                    v-model="scope.row.$selected"
                                                    @change="
                                                        groupMemberModerationTableSelectionChange(scope.row)
                                                    "></el-checkbox>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.avatar')"
                                        width="70"
                                        prop="photo">
                                        <template slot-scope="scope">
                                            <el-popover placement="right" height="500px" trigger="hover">
                                                <img
                                                    slot="reference"
                                                    v-lazy="userImage(scope.row.user)"
                                                    class="friends-list-avatar" />
                                                <img
                                                    v-lazy="userImageFull(scope.row.user)"
                                                    class="friends-list-avatar"
                                                    style="height: 500px; cursor: pointer"
                                                    @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                            </el-popover>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.display_name')"
                                        width="160"
                                        prop="$displayName"
                                        sortable>
                                        <template slot-scope="scope">
                                            <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                                <span
                                                    v-if="randomUserColours"
                                                    :style="{ color: scope.row.user.$userColour }"
                                                    v-text="scope.row.user.displayName"></span>
                                                <span v-else v-text="scope.row.user.displayName"></span>
                                            </span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.notes')"
                                        prop="managerNotes"
                                        sortable>
                                        <template slot-scope="scope">
                                            <span @click.stop v-text="scope.row.managerNotes"></span>
                                        </template>
                                    </el-table-column>
                                </data-tables>
                                <br />
                                <el-button
                                    :disabled="
                                        groupMemberModeration.progressCurrent ||
                                        !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                    "
                                    @click="groupMembersDeleteSentInvite"
                                    >{{ $t('dialog.group_member_moderation.delete_sent_invite') }}</el-button
                                >
                            </el-tab-pane>

                            <el-tab-pane>
                                <span slot="label">
                                    <span style="font-weight: bold; font-size: 16px">{{
                                        $t('dialog.group_member_moderation.join_requests')
                                    }}</span>
                                    <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                        groupJoinRequestsModerationTable.data.length
                                    }}</span>
                                </span>
                                <el-button size="small" @click="selectAllGroupJoinRequests">{{
                                    $t('dialog.group_member_moderation.select_all')
                                }}</el-button>
                                <data-tables v-bind="groupJoinRequestsModerationTable" style="margin-top: 10px">
                                    <el-table-column
                                        :key="groupMemberModerationTableForceUpdate"
                                        width="55"
                                        prop="$selected">
                                        <template slot-scope="scope">
                                            <el-button type="text" size="mini" @click.stop>
                                                <el-checkbox
                                                    v-model="scope.row.$selected"
                                                    @change="
                                                        groupMemberModerationTableSelectionChange(scope.row)
                                                    "></el-checkbox>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.avatar')"
                                        width="70"
                                        prop="photo">
                                        <template slot-scope="scope">
                                            <el-popover placement="right" height="500px" trigger="hover">
                                                <img
                                                    slot="reference"
                                                    v-lazy="userImage(scope.row.user)"
                                                    class="friends-list-avatar" />
                                                <img
                                                    v-lazy="userImageFull(scope.row.user)"
                                                    class="friends-list-avatar"
                                                    style="height: 500px; cursor: pointer"
                                                    @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                            </el-popover>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.display_name')"
                                        width="160"
                                        prop="$displayName"
                                        sortable>
                                        <template slot-scope="scope">
                                            <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                                <span
                                                    v-if="randomUserColours"
                                                    :style="{ color: scope.row.user.$userColour }"
                                                    v-text="scope.row.user.displayName"></span>
                                                <span v-else v-text="scope.row.user.displayName"></span>
                                            </span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.notes')"
                                        prop="managerNotes"
                                        sortable>
                                        <template slot-scope="scope">
                                            <span @click.stop v-text="scope.row.managerNotes"></span>
                                        </template>
                                    </el-table-column>
                                </data-tables>
                                <br />
                                <el-button
                                    :disabled="
                                        groupMemberModeration.progressCurrent ||
                                        !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                    "
                                    @click="groupMembersAcceptInviteRequest"
                                    >{{ $t('dialog.group_member_moderation.accept_join_requests') }}</el-button
                                >
                                <el-button
                                    :disabled="
                                        groupMemberModeration.progressCurrent ||
                                        !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                    "
                                    @click="groupMembersRejectInviteRequest"
                                    >{{ $t('dialog.group_member_moderation.reject_join_requests') }}</el-button
                                >
                                <el-button
                                    :disabled="
                                        groupMemberModeration.progressCurrent ||
                                        !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                    "
                                    @click="groupMembersBlockJoinRequest"
                                    >{{ $t('dialog.group_member_moderation.block_join_requests') }}</el-button
                                >
                            </el-tab-pane>

                            <el-tab-pane>
                                <span slot="label">
                                    <span style="font-weight: bold; font-size: 16px">{{
                                        $t('dialog.group_member_moderation.blocked_requests')
                                    }}</span>
                                    <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                        groupBlockedModerationTable.data.length
                                    }}</span>
                                </span>
                                <el-button size="small" @click="selectAllGroupBlocked">{{
                                    $t('dialog.group_member_moderation.select_all')
                                }}</el-button>
                                <data-tables v-bind="groupBlockedModerationTable" style="margin-top: 10px">
                                    <el-table-column
                                        :key="groupMemberModerationTableForceUpdate"
                                        width="55"
                                        prop="$selected">
                                        <template slot-scope="scope">
                                            <el-button type="text" size="mini" @click.stop>
                                                <el-checkbox
                                                    v-model="scope.row.$selected"
                                                    @change="
                                                        groupMemberModerationTableSelectionChange(scope.row)
                                                    "></el-checkbox>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.avatar')"
                                        width="70"
                                        prop="photo">
                                        <template slot-scope="scope">
                                            <el-popover placement="right" height="500px" trigger="hover">
                                                <img
                                                    slot="reference"
                                                    v-lazy="userImage(scope.row.user)"
                                                    class="friends-list-avatar" />
                                                <img
                                                    v-lazy="userImageFull(scope.row.user)"
                                                    class="friends-list-avatar"
                                                    style="height: 500px; cursor: pointer"
                                                    @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                            </el-popover>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.display_name')"
                                        width="160"
                                        prop="$displayName"
                                        sortable>
                                        <template slot-scope="scope">
                                            <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                                <span
                                                    v-if="randomUserColours"
                                                    :style="{ color: scope.row.user.$userColour }"
                                                    v-text="scope.row.user.displayName"></span>
                                                <span v-else v-text="scope.row.user.displayName"></span>
                                            </span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="$t('dialog.group_member_moderation.notes')"
                                        prop="managerNotes"
                                        sortable>
                                        <template slot-scope="scope">
                                            <span @click.stop v-text="scope.row.managerNotes"></span>
                                        </template>
                                    </el-table-column>
                                </data-tables>
                                <br />
                                <el-button
                                    :disabled="
                                        groupMemberModeration.progressCurrent ||
                                        !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                    "
                                    @click="groupMembersDeleteBlockedRequest"
                                    >{{ $t('dialog.group_member_moderation.delete_blocked_requests') }}</el-button
                                >
                            </el-tab-pane>
                        </el-tabs>
                    </div>
                </el-tab-pane>

                <el-tab-pane
                    :label="$t('dialog.group_member_moderation.logs')"
                    :disabled="!hasGroupPermission(groupDialog.ref, 'group-audit-view')">
                    <div style="margin-top: 10px">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-refresh"
                            :loading="isGroupMembersLoading"
                            circle
                            @click="getAllGroupLogs(groupMemberModeration.id)"></el-button>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">{{
                            groupLogsModerationTable.data.length
                        }}</span>
                        <br />
                        <div style="display: flex; justify-content: space-between; align-items: center">
                            <div>
                                <el-select
                                    v-model="groupMemberModeration.selectedAuditLogTypes"
                                    multiple
                                    collapse-tags
                                    :placeholder="$t('dialog.group_member_moderation.filter_type')"
                                    style="margin: 10px 0">
                                    <el-option-group :label="$t('dialog.group_member_moderation.select_type')">
                                        <el-option
                                            v-for="type in groupMemberModeration.auditLogTypes"
                                            :key="type"
                                            class="x-friend-item"
                                            :label="getAuditLogTypeName(type)"
                                            :value="type">
                                            <div class="detail">
                                                <span class="name" v-text="getAuditLogTypeName(type)"></span>
                                            </div>
                                        </el-option>
                                    </el-option-group>
                                </el-select>
                                <el-input
                                    v-model="groupLogsModerationTable.filters[0].value"
                                    :placeholder="$t('dialog.group_member_moderation.search_placeholder')"
                                    style="display: inline-block; width: 150px; margin: 10px"
                                    size="mini"
                                    clearable></el-input>
                            </div>
                            <div>
                                <el-button @click="showGroupLogsExportDialog">{{
                                    $t('dialog.group_member_moderation.export_logs')
                                }}</el-button>
                            </div>
                        </div>
                        <br />
                        <data-tables v-bind="groupLogsModerationTable" style="margin-top: 10px">
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.created_at')"
                                width="170"
                                prop="created_at"
                                sortable>
                                <template slot-scope="scope">
                                    <span>{{ scope.row.created_at | formatDate('long') }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.type')"
                                width="190"
                                prop="eventType"
                                sortable>
                                <template slot-scope="scope">
                                    <span v-text="scope.row.eventType"></span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.display_name')"
                                width="160"
                                prop="actorDisplayName"
                                sortable>
                                <template slot-scope="scope">
                                    <span style="cursor: pointer" @click="showUserDialog(scope.row.actorId)">
                                        <span v-text="scope.row.actorDisplayName"></span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="$t('dialog.group_member_moderation.description')"
                                prop="description">
                                <template slot-scope="scope">
                                    <span v-text="scope.row.description"></span>
                                </template>
                            </el-table-column>
                            <el-table-column :label="$t('dialog.group_member_moderation.data')" prop="data">
                                <template slot-scope="scope">
                                    <span
                                        v-if="Object.keys(scope.row.data).length"
                                        v-text="JSON.stringify(scope.row.data)"></span>
                                </template>
                            </el-table-column>
                        </data-tables>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <br />
            <br />
            <span class="name">{{ $t('dialog.group_member_moderation.user_id') }}</span>
            <br />
            <el-input
                v-model="groupMemberModeration.selectUserId"
                size="mini"
                style="margin-top: 5px; width: 340px"
                :placeholder="$t('dialog.group_member_moderation.user_id_placeholder')"
                clearable></el-input>
            <el-button size="small" :disabled="!groupMemberModeration.selectUserId" @click="selectGroupMemberUserId">{{
                $t('dialog.group_member_moderation.select_user')
            }}</el-button>
            <br />
            <br />
            <span class="name">{{ $t('dialog.group_member_moderation.selected_users') }}</span>
            <el-button
                type="default"
                size="mini"
                icon="el-icon-delete"
                circle
                style="margin-left: 5px"
                @click="clearSelectedGroupMembers"></el-button>
            <br />
            <el-tag
                v-for="user in groupMemberModeration.selectedUsersArray"
                :key="user.id"
                type="info"
                :disable-transitions="true"
                style="margin-right: 5px; margin-top: 5px"
                closable
                @close="deleteSelectedGroupMember(user)">
                <span
                    >{{ user.user?.displayName }}
                    <i v-if="user.membershipStatus !== 'member'" class="el-icon-warning" style="margin-left: 5px"></i
                ></span>
            </el-tag>
            <br />
            <br />
            <span class="name">{{ $t('dialog.group_member_moderation.notes') }}</span>
            <el-input
                v-model="groupMemberModeration.note"
                class="extra"
                type="textarea"
                :rows="2"
                :autosize="{ minRows: 1, maxRows: 20 }"
                :placeholder="$t('dialog.group_member_moderation.note_placeholder')"
                size="mini"
                resize="none"
                style="margin-top: 5px"></el-input>
            <br />
            <br />
            <span class="name">{{ $t('dialog.group_member_moderation.selected_roles') }}</span>
            <br />
            <el-select
                v-model="groupMemberModeration.selectedRoles"
                clearable
                multiple
                :placeholder="$t('dialog.group_member_moderation.choose_roles_placeholder')"
                filterable
                style="margin-top: 5px">
                <el-option-group :label="$t('dialog.group_member_moderation.roles')">
                    <el-option
                        v-for="role in groupMemberModeration.groupRef.roles"
                        :key="role.id"
                        class="x-friend-item"
                        :label="role.name"
                        :value="role.id"
                        style="height: auto">
                        <div class="detail">
                            <span class="name" v-text="role.name"></span>
                        </div>
                    </el-option>
                </el-option-group>
            </el-select>
            <br />
            <br />
            <span class="name">{{ $t('dialog.group_member_moderation.actions') }}</span>
            <br />
            <el-button
                :disabled="
                    !groupMemberModeration.selectedRoles.length ||
                    groupMemberModeration.progressCurrent ||
                    !hasGroupPermission(groupDialog.ref, 'group-roles-assign')
                "
                @click="groupMembersAddRoles"
                >{{ $t('dialog.group_member_moderation.add_roles') }}</el-button
            >
            <el-button
                :disabled="
                    !groupMemberModeration.selectedRoles.length ||
                    groupMemberModeration.progressCurrent ||
                    !hasGroupPermission(groupDialog.ref, 'group-roles-assign')
                "
                @click="groupMembersRemoveRoles"
                >{{ $t('dialog.group_member_moderation.remove_roles') }}</el-button
            >
            <el-button
                :disabled="
                    groupMemberModeration.progressCurrent ||
                    !hasGroupPermission(groupDialog.ref, 'group-members-manage')
                "
                @click="groupMembersSaveNote"
                >{{ $t('dialog.group_member_moderation.save_note') }}</el-button
            >
            <el-button
                :disabled="
                    groupMemberModeration.progressCurrent ||
                    !hasGroupPermission(groupDialog.ref, 'group-members-remove')
                "
                @click="groupMembersKick"
                >{{ $t('dialog.group_member_moderation.kick') }}</el-button
            >
            <el-button
                :disabled="
                    groupMemberModeration.progressCurrent || !hasGroupPermission(groupDialog.ref, 'group-bans-manage')
                "
                @click="groupMembersBan"
                >{{ $t('dialog.group_member_moderation.ban') }}</el-button
            >
            <el-button
                :disabled="
                    groupMemberModeration.progressCurrent || !hasGroupPermission(groupDialog.ref, 'group-bans-manage')
                "
                @click="groupMembersUnban"
                >{{ $t('dialog.group_member_moderation.unban') }}</el-button
            >
            <span v-if="groupMemberModeration.progressCurrent" style="margin-top: 10px">
                <i class="el-icon-loading" style="margin-left: 5px; margin-right: 5px"></i>
                {{ $t('dialog.group_member_moderation.progress') }} {{ groupMemberModeration.progressCurrent }}/{{
                    groupMemberModeration.progressTotal
                }}
            </span>
            <el-button
                v-if="groupMemberModeration.progressCurrent"
                style="margin-left: 5px"
                @click="groupMemberModeration.progressTotal = 0"
                >{{ $t('dialog.group_member_moderation.cancel') }}</el-button
            >
        </div>
    </el-dialog>
</template>

<script>
    import utils from '../../../classes/utils';

    export default {
        name: 'GroupMemberModerationDialog',
        inject: [
            'beforeDialogClose',
            'groupMemberModeration',
            'dialogMouseDown',
            'dialogMouseUp',
            'showUserDialog',
            'userImage',
            'userImageFull',
            'showFullscreenImageDialog'
        ],
        props: {
            isGroupMembersLoading: {
                type: Boolean,
                default: false
            },
            loadAllGroupMembers: {
                type: Function,
                required: true
            },
            groupMemberModerationTable: {
                type: Object,
                required: true
            },
            groupDialog: {
                type: Object,
                required: true
            },
            groupDialogSortingOptions: {
                type: Array,
                required: true
            },
            groupDialogFilterOptions: {
                type: Array,
                required: true
            },

            // TODO: remove this
            groupMemberModerationTableForceUpdate: {
                type: Number,
                default: 0
            },
            groupMemberModerationTableSelectionChange: {
                type: Function,
                required: true
            },
            randomUserColours: {
                type: Boolean,
                default: false
            },
            groupBansModerationTable: {
                type: Object,
                required: true
            },
            groupInvitesModerationTable: {
                type: Object,
                required: true
            },
            groupJoinRequestsModerationTable: {
                type: Object,
                required: true
            },
            groupBlockedModerationTable: {
                type: Object,
                required: true
            },
            groupLogsModerationTable: {
                type: Object,
                required: true
            }
        },
        methods: {
            hasGroupPermission(group) {
                return utils.hasGroupPermission(group);
            },
            setGroupMemberSortOrder(item) {},
            setGroupMemberFilter(item) {},
            groupMembersSearch() {},
            selectAllGroupMembers() {},
            getAllGroupBans(groupId) {},
            selectAllGroupBans() {},
            getAllGroupInvitesAndJoinRequests(groupId) {},
            groupMembersDeleteSentInvite() {},
            selectAllGroupJoinRequests() {},
            groupMembersAcceptInviteRequest() {},
            groupMembersRejectInviteRequest() {},
            groupMembersBlockJoinRequest() {},
            selectAllGroupBlocked() {},
            groupMembersDeleteBlockedRequest() {},
            getAllGroupLogs(groupId) {},
            getAuditLogTypeName() {},
            showGroupLogsExportDialog() {},
            selectGroupMemberUserId() {},
            clearSelectedGroupMembers() {},
            deleteSelectedGroupMember(user) {},
            groupMembersAddRoles() {},
            groupMembersRemoveRoles() {},
            groupMembersSaveNote() {},
            groupMembersKick() {},
            groupMembersBan() {},
            groupMembersUnban() {}
        }
    };
</script>
