<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        ref="inviteDialog"
        :visible.sync="inviteDialog.visible"
        :title="t('dialog.invite.header')"
        width="500px">
        <div v-if="inviteDialog.visible" v-loading="inviteDialog.loading">
            <location :location="inviteDialog.worldId" :link="false"></location>
            <br />
            <el-button size="mini" @click="addSelfToInvite" style="margin-top: 10px">{{
                t('dialog.invite.add_self')
            }}</el-button>
            <el-button
                size="mini"
                @click="addFriendsInInstanceToInvite"
                :disabled="inviteDialog.friendsInInstance.length === 0"
                style="margin-top: 10px"
                >{{ t('dialog.invite.add_friends_in_instance') }}</el-button
            >
            <el-button
                size="mini"
                @click="addFavoriteFriendsToInvite"
                :disabled="vipFriends.length === 0"
                style="margin-top: 10px"
                >{{ t('dialog.invite.add_favorite_friends') }}</el-button
            >

            <el-select
                v-model="inviteDialog.userIds"
                multiple
                clearable
                :placeholder="t('dialog.invite.select_placeholder')"
                filterable
                :disabled="inviteDialog.loading"
                style="width: 100%; margin-top: 15px">
                <el-option-group v-if="API.currentUser" :label="t('side_panel.me')">
                    <el-option
                        class="x-friend-item"
                        :label="API.currentUser.displayName"
                        :value="API.currentUser.id"
                        style="height: auto">
                        <div :class="['avatar', userStatusClass(API.currentUser)]">
                            <img v-lazy="userImage(API.currentUser)" />
                        </div>
                        <div class="detail">
                            <span class="name">{{ API.currentUser.displayName }}</span>
                        </div>
                    </el-option>
                </el-option-group>

                <el-option-group
                    v-if="inviteDialog.friendsInInstance.length"
                    :label="t('dialog.invite.friends_in_instance')">
                    <el-option
                        class="x-friend-item"
                        v-for="friend in inviteDialog.friendsInInstance"
                        :key="friend.id"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto">
                        <template v-if="friend.ref">
                            <div :class="['avatar', userStatusClass(friend.ref)]">
                                <img v-lazy="userImage(friend.ref)" />
                            </div>
                            <div class="detail">
                                <span class="name" :style="{ color: friend.ref.$userColour }">{{
                                    friend.ref.displayName
                                }}</span>
                            </div>
                        </template>
                        <span v-else>{{ friend.id }}</span>
                    </el-option>
                </el-option-group>

                <el-option-group v-if="vipFriends.length" :label="t('side_panel.favorite')">
                    <el-option
                        class="x-friend-item"
                        v-for="friend in vipFriends"
                        :key="friend.id"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto">
                        <template v-if="friend.ref">
                            <div :class="['avatar', userStatusClass(friend.ref)]">
                                <img v-lazy="userImage(friend.ref)" />
                            </div>
                            <div class="detail">
                                <span class="name" :style="{ color: friend.ref.$userColour }">{{
                                    friend.ref.displayName
                                }}</span>
                            </div>
                        </template>
                        <span v-else>{{ friend.id }}</span>
                    </el-option>
                </el-option-group>

                <el-option-group v-if="onlineFriends.length" :label="t('side_panel.online')">
                    <el-option
                        class="x-friend-item"
                        v-for="friend in onlineFriends"
                        :key="friend.id"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto">
                        <template v-if="friend.ref">
                            <div :class="['avatar', userStatusClass(friend.ref)]">
                                <img v-lazy="userImage(friend.ref)" />
                            </div>
                            <div class="detail">
                                <span class="name" :style="{ color: friend.ref.$userColour }">{{
                                    friend.ref.displayName
                                }}</span>
                            </div>
                        </template>
                        <span v-else>{{ friend.id }}</span>
                    </el-option>
                </el-option-group>

                <el-option-group v-if="activeFriends.length" :label="t('side_panel.active')">
                    <el-option
                        class="x-friend-item"
                        v-for="friend in activeFriends"
                        :key="friend.id"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto">
                        <template v-if="friend.ref">
                            <div class="avatar"><img v-lazy="userImage(friend.ref)" /></div>
                            <div class="detail">
                                <span class="name" :style="{ color: friend.ref.$userColour }">{{
                                    friend.ref.displayName
                                }}</span>
                            </div>
                        </template>
                        <span v-else>{{ friend.id }}</span>
                    </el-option>
                </el-option-group>
            </el-select>
        </div>

        <template #footer>
            <el-button
                size="small"
                :disabled="inviteDialog.loading || !inviteDialog.userIds.length"
                @click="showSendInviteDialog()"
                >{{ t('dialog.invite.invite_with_message') }}</el-button
            >
            <el-button
                type="primary"
                size="small"
                :disabled="inviteDialog.loading || !inviteDialog.userIds.length"
                @click="sendInvite()"
                >{{ t('dialog.invite.invite') }}</el-button
            >
        </template>
    </el-dialog>
</template>

<script setup>
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';

    const { t } = useI18n();

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');
    const userStatusClass = inject('userStatusClass');
    const userImage = inject('userImage');
    const API = inject('API');

    const props = defineProps({
        inviteDialog: {
            type: Object,
            required: true
        },
        vipFriends: {
            type: Array,
            required: true
        },
        onlineFriends: {
            type: Array,
            required: true
        },
        activeFriends: {
            type: Array,
            required: true
        }
    });

    function addSelfToInvite() {
        if (API.currentUser) {
            props.inviteDialog.userIds.push(API.currentUser.id);
        }
    }

    function addFriendsInInstanceToInvite() {
        props.inviteDialog.friendsInInstance.forEach((friend) => {
            if (friend.ref) {
                props.inviteDialog.userIds.push(friend.ref.id);
            }
        });
    }

    function addFavoriteFriendsToInvite() {
        props.inviteDialog.vipFriends.forEach((friend) => {
            if (friend.ref) {
                props.inviteDialog.userIds.push(friend.ref.id);
            }
        });
    }

    function showSendInviteDialog() {
        props.inviteDialog.showSendInviteDialog = true;
        props.inviteDialog.visible = false;
    }

    function sendInvite() {
        props.inviteDialog.loading = true;
        props.inviteDialog
            .sendInvite()
            .then(() => {
                props.inviteDialog.loading = false;
                props.inviteDialog.visible = false;
            })
            .catch((error) => {
                console.error(error);
                props.inviteDialog.loading = false;
            });
    }
</script>
