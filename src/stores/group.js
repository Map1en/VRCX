import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { $t } from '../app';

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

    return { state, groupDialog };
});
