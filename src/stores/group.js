import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { userRequest } from '../api';
import { $t, API, $app } from '../app';

export const useGroupStore = defineStore('Group', () => {
    const state = reactive({
        groupDialog: {
            visible: false,
            loading: false,
            isGetGroupDialogGroupLoading: false,
            treeData: [],
            id: '',
            inGroup: false,
            ownerDisplayName: '',
            ref: {},
            announcement: {},
            posts: [],
            postsFiltered: [],
            members: [],
            memberSearch: '',
            memberSearchResults: [],
            instances: [],
            memberRoles: [],
            memberFilter: {
                name: $t('dialog.group.members.filters.everyone'),
                id: null
            },
            memberSortOrder: {
                name: $t('dialog.group.members.sorting.joined_at_desc'),
                value: 'joinedAt:desc'
            },
            postsSearch: '',
            galleries: {}
        }
    });

    const groupDialog = computed({
        get: () => state.groupDialog,
        set: (value) => {
            state.groupDialog = value;
        }
    });

    function showGroupDialog(groupId) {
        if (!groupId) {
            return;
        }
        const D = state.groupDialog;
        D.visible = true;
        D.loading = true;
        D.id = groupId;
        D.inGroup = false;
        D.ownerDisplayName = '';
        D.treeData = [];
        D.announcement = {};
        D.posts = [];
        D.postsFiltered = [];
        D.instances = [];
        D.memberRoles = [];
        D.memberSearch = '';
        D.memberSearchResults = [];
        D.galleries = {};
        D.members = [];
        D.memberFilter = $app.groupDialogFilterOptions.everyone;
        API.getCachedGroup({
            groupId
        })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                $app.$message({
                    message: 'Failed to load group',
                    type: 'error'
                });
                throw err;
            })
            .then((args) => {
                if (groupId === args.ref.id) {
                    D.loading = false;
                    D.ref = args.ref;
                    D.inGroup = args.ref.membershipStatus === 'member';
                    D.ownerDisplayName = args.ref.ownerId;
                    userRequest
                        .getCachedUser({
                            userId: args.ref.ownerId
                        })
                        .then((args1) => {
                            D.ownerDisplayName = args1.ref.displayName;
                            return args1;
                        });
                    $app.applyGroupDialogInstances();
                    $app.getGroupDialogGroup(groupId);
                }
            });
    }

    return { state, groupDialog, showGroupDialog };
});
