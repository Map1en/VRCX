import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { userRequest } from '../api';
import { $app, $t } from '../app';
import API from '../classes/apiInit';
import { userNotes } from '../classes/userNotes';
import configRepository from '../service/config';
import removeConfusables, { removeWhitespace } from '../service/confusables';
import database from '../service/database';
import {
    compareByName,
    getAllUserMemos,
    getNameColour,
    localeIncludes,
    migrateMemos
} from '../shared/utils';
import { useUserStore } from './user';
import { useUiStore } from './ui';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useFriendStore } from './friend';

export const useSearchStore = defineStore('Search', () => {
    const userStore = useUserStore();
    const uiStore = useUiStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const state = reactive({
        searchText: '',
        searchUserResults: [],
        quickSearchItems: []
    });

    const searchText = computed({
        get: () => state.searchText,
        set: (value) => {
            state.searchText = value;
        }
    });

    const searchUserResults = computed({
        get: () => state.searchUserResults,
        set: (value) => {
            state.searchUserResults = value;
        }
    });

    const quickSearchItems = computed({
        get: () => state.quickSearchItems,
        set: (value) => {
            state.quickSearchItems = value;
        }
    });

    const stringComparer = computed(() =>
        Intl.Collator(appearanceSettingsStore.appLanguage.replace('_', '-'), {
            usage: 'search',
            sensitivity: 'base'
        })
    );

    API.$on('LOGIN', function () {
        state.searchText = '';
        state.searchUserResults = [];
    });

    function clearSearch() {
        state.searchText = '';
        state.searchUserResults = [];
    }

    async function searchUserByDisplayName(displayName) {
        const params = {
            n: 10,
            offset: 0,
            fuzzy: false,
            search: displayName
        };
        await moreSearchUser(null, params);
    }

    async function moreSearchUser(go, params) {
        // var params = this.searchUserParams;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        await userRequest.getUsers(params).then((args) => {
            // API.$on('USER:LIST')
            for (const json of args.json) {
                if (!json.displayName) {
                    console.error('getUsers gave us garbage', json);
                    continue;
                }
                API.$emit('USER', {
                    json,
                    params: {
                        userId: json.id
                    }
                });
            }

            const map = new Map();
            for (const json of args.json) {
                const ref = API.cachedUsers.get(json.id);
                if (typeof ref !== 'undefined') {
                    map.set(ref.id, ref);
                }
            }
            state.searchUserResults = Array.from(map.values());
            return args;
        });
    }

    function quickSearchRemoteMethod(query) {
        if (!query) {
            state.quickSearchItems = quickSearchUserHistory();
            return;
        }

        const results = [];
        const cleanQuery = removeWhitespace(query);

        for (const ctx of friendStore.friends.values()) {
            if (typeof ctx.ref === 'undefined') {
                continue;
            }

            const cleanName = removeConfusables(ctx.name);
            let match = localeIncludes(
                cleanName,
                cleanQuery,
                stringComparer.value
            );
            if (!match) {
                // Also check regular name in case search is with special characters
                match = localeIncludes(
                    ctx.name,
                    cleanQuery,
                    stringComparer.value
                );
            }
            // Use query with whitespace for notes and memos as people are more
            // likely to include spaces in memos and notes
            if (!match && ctx.memo) {
                match = localeIncludes(ctx.memo, query, stringComparer.value);
            }
            if (!match && ctx.ref.note) {
                match = localeIncludes(
                    ctx.ref.note,
                    query,
                    stringComparer.value
                );
            }

            if (match) {
                results.push({
                    value: ctx.id,
                    label: ctx.name,
                    ref: ctx.ref,
                    name: ctx.name
                });
            }
        }

        results.sort(function (a, b) {
            const A =
                stringComparer.value.compare(
                    a.name.substring(0, cleanQuery.length),
                    cleanQuery
                ) === 0;
            const B =
                stringComparer.value.compare(
                    b.name.substring(0, cleanQuery.length),
                    cleanQuery
                ) === 0;
            if (A && !B) {
                return -1;
            } else if (B && !A) {
                return 1;
            }
            return compareByName(a, b);
        });
        if (results.length > 4) {
            results.length = 4;
        }
        results.push({
            value: `search:${query}`,
            label: query
        });

        state.quickSearchItems = results;
    }

    function quickSearchChange(value) {
        if (value) {
            if (value.startsWith('search:')) {
                const searchText = value.substr(7);
                if (state.quickSearchItems.length > 1 && searchText.length) {
                    $app.friendsListSearch = searchText;
                    uiStore.menuActiveIndex = 'friendList';
                } else {
                    uiStore.menuActiveIndex = 'search';
                    state.searchText = searchText;
                    userStore.lookupUser({ displayName: searchText });
                }
            } else {
                userStore.showUserDialog(value);
            }
        }
    }

    function quickSearchUserHistory() {
        const userHistory = Array.from(userStore.showUserDialogHistory.values())
            .reverse()
            .slice(0, 5);
        const results = [];
        userHistory.forEach((userId) => {
            const ref = API.cachedUsers.get(userId);
            if (typeof ref !== 'undefined') {
                results.push({
                    value: ref.id,
                    label: ref.name,
                    ref
                });
            }
        });
        return results;
    }

    return {
        state,
        searchText,
        searchUserResults,
        stringComparer,
        quickSearchItems,
        clearSearch,
        searchUserByDisplayName,
        moreSearchUser,
        quickSearchUserHistory,
        quickSearchRemoteMethod,
        quickSearchChange
    };
});
