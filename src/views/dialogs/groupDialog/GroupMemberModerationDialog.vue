<template>
    <el-dialog
        ref="groupMemberModeration"
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible.sync="groupMemberModeration.visible"
        :title="$t('dialog.group_member_moderation.header')"
        append-to-body
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
                                    Boolean(
                                        isGroupMembersLoading ||
                                            groupDialog.memberSearch.length ||
                                            !hasGroupPermission(groupDialog.ref, 'group-bans-manage')
                                    )
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
                                    Boolean(
                                        isGroupMembersLoading ||
                                            groupDialog.memberSearch.length ||
                                            !hasGroupPermission(groupDialog.ref, 'group-bans-manage')
                                    )
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
                            <el-table-column width="55" prop="$selected">
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
                            <el-table-column width="55" prop="$selected">
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
                                    <el-table-column width="55" prop="$selected">
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
                                        Boolean(
                                            groupMemberModeration.progressCurrent ||
                                                !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                        )
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
                                    <el-table-column width="55" prop="$selected">
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
                                        Boolean(
                                            groupMemberModeration.progressCurrent ||
                                                !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                        )
                                    "
                                    @click="groupMembersAcceptInviteRequest"
                                    >{{ $t('dialog.group_member_moderation.accept_join_requests') }}</el-button
                                >
                                <el-button
                                    :disabled="
                                        Boolean(
                                            groupMemberModeration.progressCurrent ||
                                                !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                        )
                                    "
                                    @click="groupMembersRejectInviteRequest"
                                    >{{ $t('dialog.group_member_moderation.reject_join_requests') }}</el-button
                                >
                                <el-button
                                    :disabled="
                                        Boolean(
                                            groupMemberModeration.progressCurrent ||
                                                !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                        )
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
                                    <el-table-column width="55" prop="$selected">
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
                                        Boolean(
                                            groupMemberModeration.progressCurrent ||
                                                !hasGroupPermission(groupDialog.ref, 'group-invites-manage')
                                        )
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
                    Boolean(
                        !groupMemberModeration.selectedRoles.length ||
                            groupMemberModeration.progressCurrent ||
                            !hasGroupPermission(groupDialog.ref, 'group-roles-assign')
                    )
                "
                @click="groupMembersAddRoles"
                >{{ $t('dialog.group_member_moderation.add_roles') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(
                        !groupMemberModeration.selectedRoles.length ||
                            groupMemberModeration.progressCurrent ||
                            !hasGroupPermission(groupDialog.ref, 'group-roles-assign')
                    )
                "
                @click="groupMembersRemoveRoles"
                >{{ $t('dialog.group_member_moderation.remove_roles') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(
                        groupMemberModeration.progressCurrent ||
                            !hasGroupPermission(groupDialog.ref, 'group-members-manage')
                    )
                "
                @click="groupMembersSaveNote"
                >{{ $t('dialog.group_member_moderation.save_note') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(
                        groupMemberModeration.progressCurrent ||
                            !hasGroupPermission(groupDialog.ref, 'group-members-remove')
                    )
                "
                @click="groupMembersKick"
                >{{ $t('dialog.group_member_moderation.kick') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(
                        groupMemberModeration.progressCurrent ||
                            !hasGroupPermission(groupDialog.ref, 'group-bans-manage')
                    )
                "
                @click="groupMembersBan"
                >{{ $t('dialog.group_member_moderation.ban') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(
                        groupMemberModeration.progressCurrent ||
                            !hasGroupPermission(groupDialog.ref, 'group-bans-manage')
                    )
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
    import configRepository from '../../../repository/config';
    import { groupRequest, userRequest } from '../../../classes/request';

    export default {
        name: 'GroupMemberModerationDialog',
        inject: [
            'API',
            'beforeDialogClose',
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
            // groupMemberModerationTable: {
            //     type: Object,
            //     required: true
            // },
            groupDialog: {
                type: Object,
                required: true
            },
            groupDialogSortingOptions: {
                type: Object,
                required: true
            },
            groupDialogFilterOptions: {
                type: Object,
                required: true
            },

            // TODO: remove this
            // groupMemberModerationTableForceUpdate: {
            //     type: Number,
            //     default: 0
            // },
            // groupMemberModerationTableSelectionChange: {
            //     type: Function,
            //     required: true
            // },
            randomUserColours: {
                type: Boolean,
                default: false
            },
            groupMemberModeration: {
                type: Object,
                required: true
            },
            groupMemberModerationTableData: {
                type: Array,
                default: () => []
            }
            // groupBansModerationTable: {
            //     type: Object,
            //     required: true
            // }
            // groupInvitesModerationTable: {
            //     type: Object,
            //     required: true
            // },
            // groupJoinRequestsModerationTable: {
            //     type: Object,
            //     required: true
            // },
            // groupBlockedModerationTable: {
            //     type: Object,
            //     required: true
            // },
            // groupLogsModerationTable: {
            //     type: Object,
            //     required: true
            // }
        },
        data() {
            return {
                // TODO: remove this
                // groupMemberModerationTableForceUpdate: 0,
                groupInvitesModerationTable: {
                    data: [],
                    tableProps: {
                        stripe: true,
                        size: 'mini'
                    },
                    pageSize: 15,
                    paginationProps: {
                        small: true,
                        layout: 'sizes,prev,pager,next,total',
                        pageSizes: [10, 15, 25, 50, 100]
                    }
                },
                groupJoinRequestsModerationTable: {
                    data: [],
                    tableProps: {
                        stripe: true,
                        size: 'mini'
                    },
                    pageSize: 15,
                    paginationProps: {
                        small: true,
                        layout: 'sizes,prev,pager,next,total',
                        pageSizes: [10, 15, 25, 50, 100]
                    }
                },
                groupBlockedModerationTable: {
                    data: [],
                    tableProps: {
                        stripe: true,
                        size: 'mini'
                    },
                    pageSize: 15,
                    paginationProps: {
                        small: true,
                        layout: 'sizes,prev,pager,next,total',
                        pageSizes: [10, 15, 25, 50, 100]
                    }
                },
                groupLogsModerationTable: {
                    data: [],
                    filters: [
                        {
                            prop: ['description'],
                            value: ''
                        }
                    ],
                    tableProps: {
                        stripe: true,
                        size: 'mini'
                    },
                    pageSize: 15,
                    paginationProps: {
                        small: true,
                        layout: 'sizes,prev,pager,next,total',
                        pageSizes: [10, 15, 25, 50, 100]
                    }
                },
                groupBansModerationTable: {
                    data: [],
                    filters: [
                        {
                            prop: ['$displayName'],
                            value: ''
                        }
                    ],
                    tableProps: {
                        stripe: true,
                        size: 'mini'
                    },
                    pageSize: 15,
                    paginationProps: {
                        small: true,
                        layout: 'sizes,prev,pager,next,total',
                        pageSizes: [10, 15, 25, 50, 100]
                    }
                },
                groupMemberModerationTable: {
                    data: [],
                    tableProps: {
                        stripe: true,
                        size: 'mini'
                    },
                    pageSize: 15,
                    paginationProps: {
                        small: true,
                        layout: 'sizes,prev,pager,next,total',
                        pageSizes: [10, 15, 25, 50, 100]
                    }
                },
                checkGroupsLogsExportLogsOptions: [
                    {
                        label: 'created_at',
                        text: 'dialog.group_member_moderation.created_at'
                    },
                    {
                        label: 'eventType',
                        text: 'dialog.group_member_moderation.type'
                    },
                    {
                        label: 'actorDisplayName',
                        text: 'dialog.group_member_moderation.display_name'
                    },
                    {
                        label: 'description',
                        text: 'dialog.group_member_moderation.description'
                    },
                    {
                        label: 'data',
                        text: 'dialog.group_member_moderation.data'
                    }
                ],
                checkedGroupLogsExportLogsOptions: [
                    'created_at',
                    'eventType',
                    'actorDisplayName',
                    'description',
                    'data'
                ],
                groupLogsExportContent: '',
                selectedUsers: {},
                selectedUsersArray: []
            };
        },
        watch: {
            'groupDialog.members': {
                handler(newVal) {
                    this.setGroupMemberModerationTable(newVal);
                },
                immediate: true,
                deep: true
            },
            'groupDialog.memberSearchResults': {
                handler(newVal) {
                    this.setGroupMemberModerationTable(newVal);
                },
                immediate: true,
                deep: true
            }
        },
        async created() {
            const tablePageSize = await configRepository.getInt('VRCX_tablePageSize', 15);
            this.groupMemberModerationTable.pageSize = tablePageSize;
            this.groupBansModerationTable.pageSize = tablePageSize;
            this.groupLogsModerationTable.pageSize = tablePageSize;
            this.groupInvitesModerationTable.pageSize = tablePageSize;
            this.groupJoinRequestsModerationTable.pageSize = tablePageSize;
            this.groupBlockedModerationTable.pageSize = tablePageSize;
        },
        methods: {
            updateIsGroupMembersLoading(value) {
                this.$emit('update:is-group-members-loading', value);
            },
            updateGroupMemberModeration(obj) {
                // Add reactive to obj here, but obj is a shallow copy, props(obj).xx has been directly modified internally
                // The current code works but maybe still not follow one-way-down mode
                this.$emit('update:group-member-moderation', {
                    ...this.groupMemberModeration,
                    ...obj
                });
            },

            setGroupMemberModerationTable(data) {
                console.log(data);
                for (let i = 0; i < data.length; i++) {
                    const member = data[i];
                    member.$selected = this.groupMemberModeration.selectedUsers.has(member.userId);
                }
                this.groupMemberModerationTable.data = data;
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },
            handleGroupMemberRoleChange(args) {
                // API.$on('GROUP:MEMBER:ROLE:CHANGE', function (args) {
                if (this.groupDialog.id === args.params.groupId) {
                    for (var i = 0; i < this.groupDialog.members.length; ++i) {
                        var member = this.groupDialog.members[i];
                        if (member.userId === args.params.userId) {
                            member.roleIds = args.json;
                            break;
                        }
                    }
                    for (var i = 0; i < this.groupDialog.memberSearchResults.length; ++i) {
                        var member = this.groupDialog.memberSearchResults[i];
                        if (member.userId === args.params.userId) {
                            member.roleIds = args.json;
                            break;
                        }
                    }
                }

                if (this.groupMemberModeration.visible && this.groupMemberModeration.id === args.params.groupId) {
                    // force redraw table
                    this.groupMembersSearch();
                }
                // });
            },
            groupMemberModerationTableSelectionChange(row) {
                const D = this.groupMemberModeration;
                if (row.$selected && !D.selectedUsers.has(row.userId)) {
                    D.selectedUsers.set(row.userId, row);
                } else if (!row.$selected && D.selectedUsers.has(row.userId)) {
                    D.selectedUsers.delete(row.userId);
                }
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                this.updateGroupMemberModeration(D);
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },
            async groupMembersDeleteSentInvite() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.userId === this.API.currentUser.id) {
                        continue;
                    }
                    console.log(`Deleting group invite ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.deleteSentGroupInvite({
                            groupId: D.id,
                            userId: user.userId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to delete group invites: ${err}`,
                            type: 'error'
                        });
                    }
                }
                this.$message({
                    message: `Deleted ${memberCount} group invites`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
                this.updateGroupMemberModeration(D);
            },
            selectAllGroupMembers() {
                const D = this.groupMemberModeration;
                for (let i = 0; i < this.groupMemberModerationTable.data.length; i++) {
                    const row = this.groupMemberModerationTable.data[i];
                    row.$selected = true;
                    D.selectedUsers.set(row.userId, row);
                }
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },

            async getAllGroupBans(groupId) {
                this.groupBansModerationTable.data = [];
                const params = {
                    groupId,
                    n: 100,
                    offset: 0
                };
                const count = 50; // 5000 max

                this.updateIsGroupMembersLoading(true);
                try {
                    for (let i = 0; i < count; i++) {
                        const args = await groupRequest.getGroupBans(params);
                        if (args) {
                            // API.$on('GROUP:BANS', function (args) {
                            if (this.groupMemberModeration.id !== args.params.groupId) {
                                return;
                            }

                            for (const json of args.json) {
                                const ref = this.applyGroupMember(json);
                                this.groupBansModerationTable.data.push(ref);
                            }
                            // });
                        }

                        params.offset += params.n;
                        if (args.json.length < params.n) {
                            break;
                        }
                        if (!this.groupMemberModeration.visible) {
                            break;
                        }
                    }
                } catch (err) {
                    this.$message({
                        message: 'Failed to get group bans',
                        type: 'error'
                    });
                } finally {
                    this.updateIsGroupMembersLoading(false);
                }
            },
            selectAllGroupBans() {
                const D = this.groupMemberModeration;
                for (let i = 0; i < this.groupBansModerationTable.data.length; i++) {
                    const row = this.groupBansModerationTable.data[i];
                    row.$selected = true;
                    D.selectedUsers.set(row.userId, row);
                }
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },
            async groupMembersBan() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.userId === this.API.currentUser.id) {
                        continue;
                    }
                    console.log(`Banning ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.banGroupMember({
                            groupId: D.id,
                            userId: user.userId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to ban group member: ${err}`,
                            type: 'error'
                        });
                    }
                }
                this.$message({
                    message: `Banned ${memberCount} group members`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
                this.updateGroupMemberModeration(D);
            },
            async groupMembersUnban() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;

                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.userId === this.API.currentUser.id) {
                        continue;
                    }
                    console.log(`Unbanning ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.unbanGroupMember({
                            groupId: D.id,
                            userId: user.userId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to unban group member: ${err}`,
                            type: 'error'
                        });
                    }
                }
                this.$message({
                    message: `Unbanned ${memberCount} group members`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
                this.updateGroupMemberModeration(D);
            },
            async groupMembersKick() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.userId === this.API.currentUser.id) {
                        continue;
                    }
                    console.log(`Kicking ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.kickGroupMember({
                            groupId: D.id,
                            userId: user.userId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to kick group member: ${err}`,
                            type: 'error'
                        });
                    }
                }
                this.$message({
                    message: `Kicked ${memberCount} group members`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
                this.updateGroupMemberModeration(D);
            },
            async groupMembersSaveNote() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.managerNotes === D.note) {
                        continue;
                    }
                    console.log(`Setting note ${D.note} ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.setGroupMemberProps(user.userId, D.id, {
                            managerNotes: D.note
                        });
                        // 'API.$on('GROUP:MEMBER:PROPS')
                        this.groupMembersSearch();
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to set group member note: ${err}`,
                            type: 'error'
                        });
                    }
                }
                this.$message({
                    message: `Saved notes for ${memberCount} group members`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
                this.updateGroupMemberModeration(D);
            },
            async groupMembersRemoveRoles() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    const rolesToRemove = [];
                    D.selectedRoles.forEach((roleId) => {
                        if (user.roleIds.includes(roleId)) {
                            rolesToRemove.push(roleId);
                        }
                    });
                    if (!rolesToRemove.length) {
                        continue;
                    }
                    for (let j = 0; j < rolesToRemove.length; j++) {
                        const roleId = rolesToRemove[j];
                        console.log(`Removing role ${roleId} ${user.userId} ${i + 1}/${memberCount}`);
                        try {
                            const args = await groupRequest.removeGroupMemberRole({
                                groupId: D.id,
                                userId: user.userId,
                                roleId
                            });
                            this.handleGroupMemberRoleChange(args);
                        } catch (err) {
                            console.error(err);
                            this.$message({
                                message: `Failed to remove group member roles: ${err}`,
                                type: 'error'
                            });
                        }
                    }
                }
                this.$message({
                    message: 'Roles removed',
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
                this.updateGroupMemberModeration(D);
            },
            async groupMembersAddRoles() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    const rolesToAdd = [];
                    D.selectedRoles.forEach((roleId) => {
                        if (!user.roleIds.includes(roleId)) {
                            rolesToAdd.push(roleId);
                        }
                    });

                    if (!rolesToAdd.length) {
                        continue;
                    }
                    for (let j = 0; j < rolesToAdd.length; j++) {
                        const roleId = rolesToAdd[j];
                        console.log(`Adding role: ${roleId} ${user.userId} ${i + 1}/${memberCount}`);
                        try {
                            const args = await groupRequest.addGroupMemberRole({
                                groupId: D.id,
                                userId: user.userId,
                                roleId
                            });
                            this.handleGroupMemberRoleChange(args);
                        } catch (err) {
                            console.error(err);
                            this.$message({
                                message: `Failed to add group member roles: ${err}`,
                                type: 'error'
                            });
                        }
                    }
                }
                this.$message({
                    message: 'Added group member roles',
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
                this.updateGroupMemberModeration(D);
            },
            deleteSelectedGroupMember(user) {
                const D = this.groupMemberModeration;
                D.selectedUsers.delete(user.userId);
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                for (let i = 0; i < this.groupMemberModerationTable.data.length; i++) {
                    let row = this.groupMemberModerationTable.data[i];
                    if (row.userId === user.userId) {
                        row.$selected = false;
                        break;
                    }
                }
                for (let i = 0; i < this.groupBansModerationTable.data.length; i++) {
                    let row = this.groupBansModerationTable.data[i];
                    if (row.userId === user.userId) {
                        row.$selected = false;
                        break;
                    }
                }
                for (let i = 0; i < this.groupInvitesModerationTable.data.length; i++) {
                    let row = this.groupInvitesModerationTable.data[i];
                    if (row.userId === user.userId) {
                        row.$selected = false;
                        break;
                    }
                }
                for (let i = 0; i < this.groupJoinRequestsModerationTable.data.length; i++) {
                    let row = this.groupJoinRequestsModerationTable.data[i];
                    if (row.userId === user.userId) {
                        row.$selected = false;
                        break;
                    }
                }
                for (let i = 0; i < this.groupBlockedModerationTable.data.length; i++) {
                    let row = this.groupBlockedModerationTable.data[i];
                    if (row.userId === user.userId) {
                        row.$selected = false;
                        break;
                    }
                }

                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },
            clearSelectedGroupMembers() {
                const D = this.groupMemberModeration;
                D.selectedUsers.clear();
                D.selectedUsersArray = [];
                for (let i = 0; i < this.groupMemberModerationTable.data.length; i++) {
                    let row = this.groupMemberModerationTable.data[i];
                    row.$selected = false;
                }
                for (let i = 0; i < this.groupBansModerationTable.data.length; i++) {
                    let row = this.groupBansModerationTable.data[i];
                    row.$selected = false;
                }
                for (let i = 0; i < this.groupInvitesModerationTable.data.length; i++) {
                    let row = this.groupInvitesModerationTable.data[i];
                    row.$selected = false;
                }
                for (let i = 0; i < this.groupJoinRequestsModerationTable.data.length; i++) {
                    let row = this.groupJoinRequestsModerationTable.data[i];
                    row.$selected = false;
                }
                for (let i = 0; i < this.groupBlockedModerationTable.data.length; i++) {
                    let row = this.groupBlockedModerationTable.data[i];
                    row.$selected = false;
                }
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },
            async selectGroupMemberUserId() {
                const D = this.groupMemberModeration;
                if (!D.selectUserId) {
                    return;
                }

                const regexUserId = /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
                let match = [];
                const userIdList = new Set();
                while ((match = regexUserId.exec(D.selectUserId)) !== null) {
                    userIdList.add(match[0]);
                }
                if (userIdList.size === 0) {
                    // for those users missing the usr_ prefix
                    userIdList.add(D.selectUserId);
                }
                for (const userId of userIdList) {
                    try {
                        await this.addGroupMemberToSelection(userId);
                    } catch {
                        console.error(`Failed to add user ${userId}`);
                    }
                }

                D.selectUserId = '';
                this.updateGroupMemberModeration(D);
            },
            async addGroupMemberToSelection(userId) {
                const D = this.groupMemberModeration;

                // fetch member if there is one
                // banned members don't have a user object

                let member = {};
                const memberArgs = await groupRequest.getGroupMember({
                    groupId: D.id,
                    userId
                });
                if (memberArgs.json) {
                    member = this.API.applyGroupMember(memberArgs.json);
                }
                if (member.user) {
                    D.selectedUsers.set(member.userId, member);
                    D.selectedUsersArray = Array.from(D.selectedUsers.values());
                    this.$forceUpdate();
                    // this.groupMemberModerationTableForceUpdate++;
                    return;
                }

                const userArgs = await userRequest.getCachedUser({
                    userId
                });
                member.userId = userArgs.json.id;
                member.user = userArgs.json;
                member.displayName = userArgs.json.displayName;

                D.selectedUsers.set(member.userId, member);
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                this.updateGroupMemberModeration(D);
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },
            async getAllGroupLogs(groupId) {
                this.groupLogsModerationTable.data = [];
                const params = {
                    groupId,
                    n: 100,
                    offset: 0
                };
                if (this.groupMemberModeration.selectedAuditLogTypes.length) {
                    params.eventTypes = this.groupMemberModeration.selectedAuditLogTypes;
                }
                const count = 50; // 5000 max
                this.$emit('update:is-group-members-loading', true);
                // this.isGroupMembersLoading = true;
                try {
                    for (var i = 0; i < count; i++) {
                        var args = await groupRequest.getGroupLogs(params);
                        if (args) {
                            // API.$on('GROUP:LOGS', function (args) {
                            if (this.groupMemberModeration.id !== args.params.groupId) {
                                return;
                            }

                            for (var json of args.json.results) {
                                const existsInData = this.groupLogsModerationTable.data.some(
                                    (dataItem) => dataItem.id === json.id
                                );
                                if (!existsInData) {
                                    this.groupLogsModerationTable.data.push(json);
                                }
                            }
                            // });
                        }
                        params.offset += params.n;
                        if (!args.json.hasNext) {
                            break;
                        }
                        if (!this.groupMemberModeration.visible) {
                            break;
                        }
                    }
                } catch (err) {
                    this.$message({
                        message: 'Failed to get group logs',
                        type: 'error'
                    });
                } finally {
                    this.$emit('update:is-group-members-loading', false);
                    // this.isGroupMembersLoading = false;
                }
            },
            async groupMembersDeleteBlockedRequest() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.userId === this.API.currentUser.id) {
                        continue;
                    }
                    console.log(`Deleting blocked group request ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.deleteBlockedGroupRequest({
                            groupId: D.id,
                            userId: user.userId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to delete blocked group requests: ${err}`,
                            type: 'error'
                        });
                    }
                }
                this.$message({
                    message: `Deleted ${memberCount} blocked group requests`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
            },
            async groupMembersBlockJoinRequest() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.userId === this.API.currentUser.id) {
                        continue;
                    }
                    console.log(`Blocking group join request ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.blockGroupInviteRequest({
                            groupId: D.id,
                            userId: user.userId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to block group join requests: ${err}`,
                            type: 'error'
                        });
                    }
                }
                this.$message({
                    message: `Blocked ${memberCount} group join requests`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
            },
            async groupMembersRejectInviteRequest() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.userId === this.API.currentUser.id) {
                        continue;
                    }
                    console.log(`Rejecting group join request ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.rejectGroupInviteRequest({
                            groupId: D.id,
                            userId: user.userId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to reject group join requests: ${err}`,
                            type: 'error'
                        });
                    }
                    this.$message({
                        message: `Rejected ${memberCount} group join requests`,
                        type: 'success'
                    });
                    D.progressCurrent = 0;
                    D.progressTotal = 0;
                }
                this.updateGroupMemberModeration(D);
            },
            async groupMembersAcceptInviteRequest() {
                const D = this.groupMemberModeration;
                const memberCount = D.selectedUsersArray.length;
                D.progressTotal = memberCount;
                for (let i = 0; i < memberCount; i++) {
                    if (!D.visible || !D.progressTotal) {
                        break;
                    }
                    const user = D.selectedUsersArray[i];
                    D.progressCurrent = i + 1;
                    if (user.userId === this.API.currentUser.id) {
                        continue;
                    }
                    console.log(`Accepting group join request ${user.userId} ${i + 1}/${memberCount}`);
                    try {
                        await groupRequest.acceptGroupInviteRequest({
                            groupId: D.id,
                            userId: user.userId
                        });
                    } catch (err) {
                        console.error(err);
                        this.$message({
                            message: `Failed to accept group join requests: ${err}`,
                            type: 'error'
                        });
                    }
                }
                this.$message({
                    message: `Accepted ${memberCount} group join requests`,
                    type: 'success'
                });
                D.progressCurrent = 0;
                D.progressTotal = 0;
                this.updateGroupMemberModeration(D);
            },
            selectAllGroupInvites() {
                const D = this.groupMemberModeration;
                for (let i = 0; i < this.groupInvitesModerationTable.data.length; i++) {
                    const row = this.groupInvitesModerationTable.data[i];
                    row.$selected = true;
                    D.selectedUsers.set(row.userId, row);
                }
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                this.updateGroupMemberModeration(D);
                // TODO: possible update can't be triggered because using a Map, remove this, and others
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },

            selectAllGroupJoinRequests() {
                const D = this.groupMemberModeration;
                for (let i = 0; i < this.groupJoinRequestsModerationTable.data.length; i++) {
                    const row = this.groupJoinRequestsModerationTable.data[i];
                    row.$selected = true;
                    D.selectedUsers.set(row.userId, row);
                }
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                this.updateGroupMemberModeration(D);
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },
            selectAllGroupBlocked() {
                const D = this.groupMemberModeration;
                for (let i = 0; i < this.groupBlockedModerationTable.data.length; i++) {
                    const row = this.groupBlockedModerationTable.data[i];
                    row.$selected = true;
                    D.selectedUsers.set(row.userId, row);
                }
                D.selectedUsersArray = Array.from(D.selectedUsers.values());
                this.updateGroupMemberModeration(D);
                this.$forceUpdate();
                // this.groupMemberModerationTableForceUpdate++;
            },
            async getAllGroupInvitesAndJoinRequests(groupId) {
                await this.getAllGroupInvites(groupId);
                await this.getAllGroupJoinRequests(groupId);
                await this.getAllGroupBlockedRequests(groupId);
            },
            async getAllGroupBlockedRequests(groupId) {
                this.groupBlockedModerationTable.data = [];
                const params = {
                    groupId,
                    n: 100,
                    offset: 0,
                    blocked: true
                };
                const count = 50; // 5000 max
                this.updateIsGroupMembersLoading(true);
                // this.isGroupMembersLoading = true;
                try {
                    for (let i = 0; i < count; i++) {
                        const args = await groupRequest.getGroupJoinRequests(params);
                        // API.$on('GROUP:JOINREQUESTS', function (args) {
                        if (this.groupMemberModeration.id !== args.params.groupId) {
                            return;
                        }

                        if (!args.params.blocked) {
                            for (let json of args.json) {
                                let ref = this.API.applyGroupMember(json);
                                this.groupJoinRequestsModerationTable.data.push(ref);
                            }
                        } else {
                            for (let json of args.json) {
                                let ref = this.API.applyGroupMember(json);
                                this.groupBlockedModerationTable.data.push(ref);
                            }
                        }
                        // });
                        params.offset += params.n;
                        if (args.json.length < params.n) {
                            break;
                        }
                        if (!this.groupMemberModeration.visible) {
                            break;
                        }
                    }
                } catch (err) {
                    this.$message({
                        message: 'Failed to get group join requests',
                        type: 'error'
                    });
                } finally {
                    this.updateIsGroupMembersLoading(false);
                    // this.isGroupMembersLoading = false;
                }
            },
            async getAllGroupInvites(groupId) {
                this.groupInvitesModerationTable.data = [];
                const params = {
                    groupId,
                    n: 100,
                    offset: 0
                };
                const count = 50; // 5000 max
                this.updateIsGroupMembersLoading(true);
                // this.isGroupMembersLoading = true;
                try {
                    for (let i = 0; i < count; i++) {
                        const args = await groupRequest.getGroupInvites(params);
                        if (args) {
                            // API.$on('GROUP:INVITES', function (args) {
                            if (this.groupMemberModeration.id !== args.params.groupId) {
                                return;
                            }

                            for (const json of args.json) {
                                const ref = this.applyGroupMember(json);
                                this.groupInvitesModerationTable.data.push(ref);
                            }
                            // });
                        }
                        params.offset += params.n;
                        if (args.json.length < params.n) {
                            break;
                        }
                        if (!this.groupMemberModeration.visible) {
                            break;
                        }
                    }
                } catch (err) {
                    this.$message({
                        message: 'Failed to get group invites',
                        type: 'error'
                    });
                } finally {
                    this.updateIsGroupMembersLoading(false);
                    // this.isGroupMembersLoading = false;
                }
            },
            async getAllGroupJoinRequests(groupId) {
                this.groupJoinRequestsModerationTable.data = [];
                const params = {
                    groupId,
                    n: 100,
                    offset: 0
                };
                const count = 50; // 5000 max
                this.updateIsGroupMembersLoading(true);
                // this.isGroupMembersLoading = true;
                try {
                    for (let i = 0; i < count; i++) {
                        const args = await groupRequest.getGroupJoinRequests(params);
                        // API.$on('GROUP:JOINREQUESTS', function (args) {
                        if (this.groupMemberModeration.id !== args.params.groupId) {
                            return;
                        }

                        if (!args.params.blocked) {
                            for (let json of args.json) {
                                let ref = this.API.applyGroupMember(json);
                                this.groupJoinRequestsModerationTable.data.push(ref);
                            }
                        } else {
                            for (let json of args.json) {
                                let ref = this.API.applyGroupMember(json);
                                this.groupBlockedModerationTable.data.push(ref);
                            }
                        }
                        // });
                        params.offset += params.n;
                        if (args.json.length < params.n) {
                            break;
                        }
                        if (!this.groupMemberModeration.visible) {
                            break;
                        }
                    }
                } catch (err) {
                    this.$message({
                        message: 'Failed to get group join requests',
                        type: 'error'
                    });
                } finally {
                    this.updateIsGroupMembersLoading(false);
                    // this.isGroupMembersLoading = false;
                }
            },
            getAuditLogTypeName(auditLogType) {
                if (!auditLogType) {
                    return '';
                }
                return auditLogType
                    .replace('group.', '')
                    .replace(/\./g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase());
            },
            showGroupLogsExportDialog() {
                // todo
                this.$nextTick(() => $app.adjustDialogZ(this.$refs.groupLogsExportDialogRef.$el));
                this.groupLogsExportContent = '';
                this.updateGroupLogsExportContent();
                this.isGroupLogsExportDialogVisible = true;
            },
            updateGroupLogsExportContent() {
                const formatter = (str) => (/[\x00-\x1f,"]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str);

                const sortedCheckedOptions = this.checkGroupsLogsExportLogsOptions
                    .filter((option) => this.checkedGroupLogsExportLogsOptions.includes(option.label))
                    .map((option) => option.label);

                const header = `${sortedCheckedOptions.join(',')}\n`;

                const content = this.groupLogsModerationTable.data
                    .map((item) =>
                        sortedCheckedOptions
                            .map((key) => formatter(key === 'data' ? JSON.stringify(item[key]) : item[key]))
                            .join(',')
                    )
                    .join('\n');

                this.groupLogsExportContent = header + content;
            },
            hasGroupPermission(group) {
                return utils.hasGroupPermission(group);
            },
            loadAllGroupMembers() {
                this.$emit('load-all-group-members');
            },
            setGroupMemberSortOrder(item) {
                this.$emit('set-group-member-sort-order', item);
            },
            setGroupMemberFilter(filter) {
                this.$emit('set-group-member-filter', filter);
            },
            groupMembersSearch() {
                this.$emit('group-members-search');
            }
        }
    };
</script>
