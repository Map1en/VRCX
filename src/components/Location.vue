<template>
    <div>
        <span v-if="!text" style="color: transparent">-</span>
        <span v-show="text">
            <span
                :class="{ 'x-link': link && location !== 'private' && location !== 'offline' }"
                @click="handleShowWorldDialog">
                <i v-if="isTraveling" class="el-icon el-icon-loading" style="display: inline-block"></i>
                <span>{{ text }}</span>
            </span>
            <span v-if="groupName" :class="{ 'x-link': link }" @click="handleShowGroupDialog">({{ groupName }})</span>
            <span v-if="region" class="flags" :class="region" style="display: inline-block; margin-left: 5px"></span>
            <i v-if="strict" class="el-icon el-icon-lock" style="display: inline-block; margin-left: 5px"></i>
        </span>
    </div>
</template>

<script>
    import { parseLocation } from '../shared/utils';
    import { getWorldName, getGroupName } from '../shared/utils';

    export default {
        name: 'Location',
        inject: {
            API: { default: window.API },
            showWorldDialog: { default: window.$app?.showWorldDialog },
            showGroupDialog: { default: window.$app?.showGroupDialog }
        },
        props: {
            location: String,
            traveling: String,
            hint: {
                type: String,
                default: ''
            },
            grouphint: {
                type: String,
                default: ''
            },
            link: {
                type: Boolean,
                default: true
            },
            isOpenPreviousInstanceInfoDialog: Boolean
        },
        data() {
            return {
                text: '',
                region: this.region,
                strict: this.strict,
                isTraveling: this.isTraveling,
                groupName: this.groupName
            };
        },
        watch: {
            location() {
                this.parse();
            }
        },
        created() {
            this.parse();
        },
        methods: {
            parse() {
                if (!this.API) return;
                this.isTraveling = false;
                this.groupName = '';
                let instanceId = this.location;
                if (typeof this.traveling !== 'undefined' && this.location === 'traveling') {
                    instanceId = this.traveling;
                    this.isTraveling = true;
                }
                const L = parseLocation(instanceId);
                if (L.isOffline) {
                    this.text = 'Offline';
                } else if (L.isPrivate) {
                    this.text = 'Private';
                } else if (L.isTraveling) {
                    this.text = 'Traveling';
                } else if (typeof this.hint === 'string' && this.hint !== '') {
                    if (L.instanceId) {
                        this.text = `${this.hint} #${L.instanceName} ${L.accessTypeName}`;
                    } else {
                        this.text = this.hint;
                    }
                } else if (L.worldId) {
                    var ref = this.API.cachedWorlds.get(L.worldId);
                    if (typeof ref === 'undefined') {
                        getWorldName(L.worldId).then((worldName) => {
                            if (L.tag === instanceId) {
                                if (L.instanceId) {
                                    this.text = `${worldName} #${L.instanceName} ${L.accessTypeName}`;
                                } else {
                                    this.text = worldName;
                                }
                            }
                        });
                    } else if (L.instanceId) {
                        this.text = `${ref.name} #${L.instanceName} ${L.accessTypeName}`;
                    } else {
                        this.text = ref.name;
                    }
                }
                if (this.grouphint) {
                    this.groupName = this.grouphint;
                } else if (L.groupId) {
                    this.groupName = L.groupId;
                    getGroupName(instanceId).then((groupName) => {
                        if (L.tag === instanceId) {
                            this.groupName = groupName;
                        }
                    });
                }
                this.region = '';
                if (!L.isOffline && !L.isPrivate && !L.isTraveling) {
                    this.region = L.region;
                    if (!L.region && L.instanceId) {
                        this.region = 'us';
                    }
                }
                this.strict = L.strict;
            },
            handleShowWorldDialog() {
                if (this.link) {
                    let instanceId = this.location;
                    if (this.traveling && this.location === 'traveling') {
                        instanceId = this.traveling;
                    }
                    if (!instanceId && this.hint.length === 8) {
                        // shortName
                        this.API.$emit('SHOW_WORLD_DIALOG_SHORTNAME', this.hint);
                        return;
                    }
                    if (this.isOpenPreviousInstanceInfoDialog) {
                        this.$emit('open-previous-instance-info-dialog', instanceId);
                    } else {
                        this.showWorldDialog(instanceId);
                    }
                }
            },
            handleShowGroupDialog() {
                let location = this.location;
                if (this.isTraveling) {
                    location = this.traveling;
                }
                if (!location || !this.link) {
                    return;
                }
                const L = parseLocation(location);
                if (!L.groupId) {
                    return;
                }
                this.showGroupDialog(L.groupId);
            }
        }
    };
</script>
