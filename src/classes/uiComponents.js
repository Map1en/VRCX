import Vue from 'vue';
import { instanceRequest, userRequest } from '../api';
import { $app } from '../app.js';
import {
    checkCanInviteSelf,
    getGroupName,
    parseLocation
} from '../shared/utils';

export default function init() {
    Vue.component('Launch', {
        props: {
            location: String,
            hideTooltips: Boolean
        },
        watch: {
            location() {
                this.parse();
            }
        },
        mounted() {
            this.parse();
        },
        methods: {
            parse() {
                this.$el.style.display = checkCanInviteSelf(this.location)
                    ? ''
                    : 'none';
            },
            confirm() {
                $app.store.launch.showLaunchDialog(this.location);
            }
        },
        template:
            '<el-tooltip placement="top" :content="$t(`dialog.user.info.launch_invite_tooltip`)" :disabled="hideTooltips"><el-button @click="confirm" size="mini" icon="el-icon-switch-button" circle></el-button></el-tooltip>'
    });

    Vue.component('InviteYourself', {
        props: {
            location: String,
            shortname: String
        },
        watch: {
            location() {
                this.parse();
            }
        },
        mounted() {
            this.parse();
        },
        methods: {
            parse() {
                this.$el.style.display = checkCanInviteSelf(this.location)
                    ? ''
                    : 'none';
            },
            confirm() {
                this.selfInvite(this.location, this.shortname);
            },
            selfInvite(location, shortName) {
                const L = parseLocation(location);
                if (!L.isRealInstance) {
                    return;
                }
                instanceRequest
                    .selfInvite({
                        instanceId: L.instanceId,
                        worldId: L.worldId,
                        shortName
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Self invite sent',
                            type: 'success'
                        });
                        return args;
                    });
            }
        },
        template:
            '<el-button @click="confirm" size="mini" icon="el-icon-message" circle></el-button>'
    });

    Vue.component('LocationWorld', {
        props: {
            locationobject: Object,
            currentuserid: String,
            worlddialogshortname: String,
            grouphint: {
                type: String,
                default: ''
            }
        },
        data() {
            return {
                location: this.location,
                instanceName: this.instanceName,
                accessTypeName: this.accessTypeName,
                region: this.region,
                shortName: this.shortName,
                isUnlocked: this.isUnlocked,
                strict: this.strict,
                groupName: this.groupName
            };
        },
        watch: {
            locationobject() {
                this.parse();
            }
        },
        created() {
            this.parse();
        },
        methods: {
            parse() {
                this.location = this.locationobject.tag;
                this.instanceName = this.locationobject.instanceName;
                this.accessTypeName = this.locationobject.accessTypeName;
                this.strict = this.locationobject.strict;
                this.shortName = this.locationobject.shortName;

                this.isUnlocked = false;
                if (
                    (this.worlddialogshortname &&
                        this.locationobject.shortName &&
                        this.worlddialogshortname ===
                            this.locationobject.shortName) ||
                    this.currentuserid === this.locationobject.userId
                ) {
                    this.isUnlocked = true;
                }

                this.region = this.locationobject.region;
                if (!this.region) {
                    this.region = 'us';
                }

                this.groupName = '';
                if (this.grouphint) {
                    this.groupName = this.grouphint;
                } else if (this.locationobject.groupId) {
                    this.groupName = this.locationobject.groupId;
                    getGroupName(this.locationobject.groupId).then(
                        (groupName) => {
                            this.groupName = groupName;
                        }
                    );
                }
            },
            showLaunchDialog() {
                $app.store.launch.showLaunchDialog(
                    this.location,
                    this.shortName
                );
            },
            showGroupDialog() {
                if (!this.location) {
                    return;
                }
                const L = parseLocation(this.location);
                if (!L.groupId) {
                    return;
                }
                $app.store.group.showGroupDialog(L.groupId);
            }
        },
        template:
            '<span><span @click="showLaunchDialog" class="x-link">' +
            '<i v-if="isUnlocked" class="el-icon el-icon-unlock" style="display:inline-block;margin-right:5px"></i>' +
            '<span>#{{ instanceName }} {{ accessTypeName }}</span></span>' +
            '<span v-if="groupName" @click="showGroupDialog" class="x-link">({{ groupName }})</span>' +
            '<span class="flags" :class="region" style="display:inline-block;margin-left:5px"></span>' +
            '<i v-if="strict" class="el-icon el-icon-lock" style="display:inline-block;margin-left:5px"></i></span>'
    });

    Vue.component('LastJoin', {
        props: {
            location: String,
            currentlocation: String
        },
        data() {
            return {
                lastJoin: this.lastJoin
            };
        },
        watch: {
            location() {
                this.parse();
            },
            currentlocation() {
                this.parse();
            }
        },
        created() {
            this.parse();
        },
        methods: {
            parse() {
                this.lastJoin = $app.store.instance.instanceJoinHistory.get(
                    this.location
                );
            }
        },
        template:
            '<span v-if="lastJoin">' +
            '<el-tooltip placement="top" style="margin-left:5px" >' +
            '<div slot="content">' +
            '<span>{{ $t("dialog.user.info.last_join") }} <timer :epoch="lastJoin"></timer></span>' +
            '</div>' +
            '<i class="el-icon el-icon-location-outline" style="display:inline-block"></i>' +
            '</el-tooltip>' +
            '</span>'
    });

    Vue.component('AvatarInfo', {
        props: {
            imageurl: String,
            userid: String,
            hintownerid: String,
            hintavatarname: String,
            avatartags: Array
        },
        data() {
            return {
                avatarName: this.avatarName,
                avatarType: this.avatarType,
                avatarTags: this.avatarTags,
                color: this.color
            };
        },
        watch: {
            imageurl() {
                this.parse();
            },
            userid() {
                this.parse();
            },
            avatartags() {
                this.parse();
            }
        },
        mounted() {
            this.parse();
        },
        methods: {
            async parse() {
                this.ownerId = '';
                this.avatarName = '';
                this.avatarType = '';
                this.color = '';
                this.avatarTags = '';
                if (!this.imageurl) {
                    this.avatarName = '-';
                } else if (this.hintownerid) {
                    this.avatarName = this.hintavatarname;
                    this.ownerId = this.hintownerid;
                } else {
                    try {
                        const avatarInfo =
                            await $app.store.avatar.getAvatarName(
                                this.imageurl
                            );
                        this.avatarName = avatarInfo.avatarName;
                        this.ownerId = avatarInfo.ownerId;
                    } catch (err) {}
                }
                if (typeof this.userid === 'undefined' || !this.ownerId) {
                    this.color = '';
                    this.avatarType = '';
                } else if (this.ownerId === this.userid) {
                    this.color = 'avatar-info-own';
                    this.avatarType = '(own)';
                } else {
                    this.color = 'avatar-info-public';
                    this.avatarType = '(public)';
                }
                if (typeof this.avatartags === 'object') {
                    let tagString = '';
                    for (let i = 0; i < this.avatartags.length; i++) {
                        const tagName = this.avatartags[i].replace(
                            'content_',
                            ''
                        );
                        tagString += tagName;
                        if (i < this.avatartags.length - 1) {
                            tagString += ', ';
                        }
                    }
                    this.avatarTags = tagString;
                }
            },
            confirm() {
                if (!this.imageurl) {
                    return;
                }
                $app.store.avatar.showAvatarAuthorDialog(
                    this.userid,
                    this.ownerId,
                    this.imageurl
                );
            }
        },
        template:
            '<div @click="confirm" class="avatar-info">' +
            '<span style="margin-right:5px">{{ avatarName }}</span>' +
            '<span v-if="avatarType" style="margin-right:5px" :class="color">{{ avatarType }}</span>' +
            '<span v-if="avatarTags" style="color:#909399;font-family:monospace;font-size:12px;">{{ avatarTags }}</span>' +
            '</div>'
    });

    Vue.component('DisplayName', {
        props: {
            userid: String,
            location: String,
            forceUpdateKey: Number,
            hint: {
                type: String,
                default: ''
            }
        },
        data() {
            return {
                username: this.username
            };
        },
        watch: {
            location() {
                this.parse();
            },
            forceUpdateKey() {
                this.parse();
            },
            userid() {
                this.parse();
            }
        },
        mounted() {
            this.parse();
        },
        methods: {
            async parse() {
                this.username = this.userid;
                if (this.hint) {
                    this.username = this.hint;
                } else if (this.userid) {
                    var args = await userRequest.getCachedUser({
                        userId: this.userid
                    });
                }
                if (
                    typeof args !== 'undefined' &&
                    typeof args.json !== 'undefined' &&
                    typeof args.json.displayName !== 'undefined'
                ) {
                    this.username = args.json.displayName;
                }
            },
            showUserDialog() {
                $app.store.user.showUserDialog(this.userid);
            }
        },
        template:
            '<span @click="showUserDialog" class="x-link">{{ username }}</span>'
    });
}
