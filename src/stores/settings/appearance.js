import { defineStore } from 'pinia';
import Vue, { computed, reactive } from 'vue';
import configRepository from '../../service/config';
import {
    changeCJKFontsOrder,
    formatDateFilter,
    systemIsDarkMode
} from '../../shared/utils';
import { updateTrustColorClasses } from '../../shared/utils/base/ui';

export const useAppearanceSettingsStore = defineStore(
    'AppearanceSettings',
    () => {
        const state = reactive({
            appLanguage: 'en',
            themeMode: '',
            isDarkMode: false,
            displayVRCPlusIconsAsAvatar: false,
            hideNicknames: false,
            hideTooltips: false,
            isAgeGatedInstancesVisible: false,
            sortFavorites: true,
            instanceUsersSortAlphabetical: false,
            tablePageSize: 15,
            dtHour12: false,
            dtIsoFormat: false,
            sidebarSortMethod1: 'Sort Private to Bottom',
            sidebarSortMethod2: 'Sort by Time in Instance',
            sidebarSortMethod3: 'Sort by Last Active',
            sidebarSortMethods: [
                'Sort Private to Bottom',
                'Sort by Time in Instance',
                'Sort by Last Active'
            ],
            asideWidth: 300,
            isSidebarGroupByInstance: true,
            isHideFriendsInSameInstance: false,
            isSidebarDivideByFriendGroup: false,
            hideUserNotes: false,
            hideUserMemos: false,
            hideUnfriends: false,
            randomUserColours: false,
            trustColor: {
                untrusted: '#CCCCCC',
                basic: '#1778FF',
                known: '#2BCF5C',
                trusted: '#FF7B42',
                veteran: '#B18FFF',
                vip: '#FF2626',
                troll: '#782F2F'
            }
        });

        async function initAppearanceSettings() {
            const [
                appLanguage,
                displayVRCPlusIconsAsAvatar,
                hideNicknames,
                hideTooltips,
                isAgeGatedInstancesVisible,
                sortFavorites,
                instanceUsersSortAlphabetical,
                tablePageSize,
                dtHour12,
                dtIsoFormat,
                sidebarSortMethods,
                asideWidth,
                isSidebarGroupByInstance,
                isHideFriendsInSameInstance,
                isSidebarDivideByFriendGroup,
                hideUserNotes,
                hideUserMemos,
                hideUnfriends,
                randomUserColours,
                trustColor
            ] = await Promise.all([
                configRepository.getString('VRCX_appLanguage', 'en'),
                configRepository.getBool('displayVRCPlusIconsAsAvatar', true),
                configRepository.getBool('VRCX_hideNicknames', false),
                configRepository.getBool('VRCX_hideTooltips', false),
                configRepository.getBool(
                    'VRCX_isAgeGatedInstancesVisible',
                    true
                ),
                configRepository.getBool('VRCX_sortFavorites', true),
                configRepository.getBool(
                    'VRCX_instanceUsersSortAlphabetical',
                    false
                ),
                configRepository.getInt('VRCX_tablePageSize', 15),
                configRepository.getBool('VRCX_dtHour12', false),
                configRepository.getBool('VRCX_dtIsoFormat', false),
                configRepository.getString(
                    'VRCX_sidebarSortMethods',
                    JSON.stringify([
                        'Sort Private to Bottom',
                        'Sort by Time in Instance',
                        'Sort by Last Active'
                    ])
                ),
                configRepository.getInt('VRCX_sidePanelWidth', 300),
                configRepository.getBool('VRCX_sidebarGroupByInstance', true),
                configRepository.getBool(
                    'VRCX_hideFriendsInSameInstance',
                    false
                ),
                configRepository.getBool(
                    'VRCX_sidebarDivideByFriendGroup',
                    true
                ),
                configRepository.getBool('VRCX_hideUserNotes', false),
                configRepository.getBool('VRCX_hideUserMemos', false),
                configRepository.getBool('VRCX_hideUnfriends', false),
                configRepository.getBool('VRCX_randomUserColours', false),
                configRepository.getString(
                    'VRCX_trustColor',
                    JSON.stringify({
                        untrusted: '#CCCCCC',
                        basic: '#1778FF',
                        known: '#2BCF5C',
                        trusted: '#FF7B42',
                        veteran: '#B18FFF',
                        vip: '#FF2626',
                        troll: '#782F2F'
                    })
                )
            ]);

            state.appLanguage = appLanguage;
            changeCJKFontsOrder(state.appLanguage);
            this.i18n.locale = state.appLanguage;

            state.displayVRCPlusIconsAsAvatar = displayVRCPlusIconsAsAvatar;
            state.hideNicknames = hideNicknames;
            state.hideTooltips = hideTooltips;
            state.isAgeGatedInstancesVisible = isAgeGatedInstancesVisible;
            state.sortFavorites = sortFavorites;
            state.instanceUsersSortAlphabetical = instanceUsersSortAlphabetical;
            state.tablePageSize = tablePageSize;
            state.dtHour12 = dtHour12;
            state.dtIsoFormat = dtIsoFormat;
            await handleSetDatetimeFormat();

            state.sidebarSortMethods = JSON.parse(sidebarSortMethods);
            if (state.sidebarSortMethods?.length === 3) {
                state.sidebarSortMethod1 = state.sidebarSortMethods[0];
                state.sidebarSortMethod2 = state.sidebarSortMethods[1];
                state.sidebarSortMethod3 = state.sidebarSortMethods[2];
            }

            state.trustColor = JSON.parse(trustColor);
            state.asideWidth = asideWidth;
            state.isSidebarGroupByInstance = isSidebarGroupByInstance;
            state.isHideFriendsInSameInstance = isHideFriendsInSameInstance;
            state.isSidebarDivideByFriendGroup = isSidebarDivideByFriendGroup;
            state.hideUserNotes = hideUserNotes;
            state.hideUserMemos = hideUserMemos;
            state.hideUnfriends = hideUnfriends;
            state.randomUserColours = randomUserColours;

            // Migrate old settings
            // Assume all exist if one does
            await mergeOldSortMethodsSettings();

            updateTrustColorClasses(state.trustColor);

            // init in app.js
            // const themeMode = await configRepository.getString(
            //    'VRCX_ThemeMode',
            //    'system'
            // );
            // setThemeMode(themeMode);
        }

        const appLanguage = computed(() => state.appLanguage);
        const themeMode = computed(() => state.themeMode);
        const isDarkMode = computed(() => state.isDarkMode);
        const displayVRCPlusIconsAsAvatar = computed(
            () => state.displayVRCPlusIconsAsAvatar
        );
        const hideNicknames = computed(() => state.hideNicknames);
        const hideTooltips = computed(() => state.hideTooltips);
        const isAgeGatedInstancesVisible = computed(
            () => state.isAgeGatedInstancesVisible
        );
        const sortFavorites = computed(() => state.sortFavorites);
        const instanceUsersSortAlphabetical = computed(
            () => state.instanceUsersSortAlphabetical
        );
        const tablePageSize = computed(() => state.tablePageSize);
        const dtHour12 = computed(() => state.dtHour12);
        const dtIsoFormat = computed(() => state.dtIsoFormat);
        const sidebarSortMethod1 = computed(() => state.sidebarSortMethod1);
        const sidebarSortMethod2 = computed(() => state.sidebarSortMethod2);
        const sidebarSortMethod3 = computed(() => state.sidebarSortMethod3);
        const sidebarSortMethods = computed(() => state.sidebarSortMethods);
        const asideWidth = computed(() => state.asideWidth);
        const isSidebarGroupByInstance = computed(
            () => state.isSidebarGroupByInstance
        );
        const isHideFriendsInSameInstance = computed(
            () => state.isHideFriendsInSameInstance
        );
        const isSidebarDivideByFriendGroup = computed(
            () => state.isSidebarDivideByFriendGroup
        );
        const hideUserNotes = computed(() => state.hideUserNotes);
        const hideUserMemos = computed(() => state.hideUserMemos);
        const hideUnfriends = computed(() => state.hideUnfriends);
        const randomUserColours = computed(() => state.randomUserColours);
        const trustColor = computed(() => state.trustColor);

        function setAppLanguage(language) {
            console.log('Language changed:', language);
            state.appLanguage = language;
            configRepository.setString('VRCX_appLanguage', language);
            changeCJKFontsOrder(state.appLanguage);
            this.i18n.locale = state.appLanguage;
        }
        function setThemeMode(mode) {
            state.themeMode = mode;
            configRepository.setString('VRCX_ThemeMode', mode);
            if (mode === 'light') {
                setIsDarkMode(false);
            } else if (mode === 'system') {
                setIsDarkMode(systemIsDarkMode());
            } else {
                setIsDarkMode(true);
            }
        }
        function setIsDarkMode(isDark) {
            state.isDarkMode = isDark;
            configRepository.setString('VRCX_isDarkMode', isDark);
        }
        function setDisplayVRCPlusIconsAsAvatar() {
            state.displayVRCPlusIconsAsAvatar =
                !state.displayVRCPlusIconsAsAvatar;
            configRepository.setBool(
                'displayVRCPlusIconsAsAvatar',
                state.displayVRCPlusIconsAsAvatar
            );
        }
        function setHideNicknames() {
            state.hideNicknames = !state.hideNicknames;
            configRepository.setBool('VRCX_hideNicknames', state.hideNicknames);
        }
        function setHideTooltips() {
            state.hideTooltips = !state.hideTooltips;
            configRepository.setBool('VRCX_hideTooltips', state.hideTooltips);
        }
        function setIsAgeGatedInstancesVisible() {
            state.isAgeGatedInstancesVisible =
                !state.isAgeGatedInstancesVisible;
            configRepository.setBool(
                'VRCX_isAgeGatedInstancesVisible',
                state.isAgeGatedInstancesVisible
            );
        }
        function setSortFavorites() {
            state.sortFavorites = !state.sortFavorites;
            configRepository.setBool('VRCX_sortFavorites', state.sortFavorites);
        }
        function setInstanceUsersSortAlphabetical() {
            state.instanceUsersSortAlphabetical =
                !state.instanceUsersSortAlphabetical;
            configRepository.setBool(
                'VRCX_instanceUsersSortAlphabetical',
                state.instanceUsersSortAlphabetical
            );
        }
        function setTablePageSize(size) {
            state.tablePageSize = size;
            configRepository.setInt('VRCX_tablePageSize', size);
        }
        function setDtHour12() {
            state.dtHour12 = !state.dtHour12;
            configRepository.setBool('VRCX_dtHour12', state.dtHour12);
            handleSetDatetimeFormat();
        }
        function setDtIsoFormat() {
            state.dtIsoFormat = !state.dtIsoFormat;
            configRepository.setBool('VRCX_dtIsoFormat', state.dtIsoFormat);
            handleSetDatetimeFormat();
        }
        function setSidebarSortMethod1(method) {
            state.sidebarSortMethod1 = method;
            handleSaveSidebarSortOrder();
        }
        function setSidebarSortMethod2(method) {
            state.sidebarSortMethod2 = method;
            handleSaveSidebarSortOrder();
        }
        function setSidebarSortMethod3(method) {
            state.sidebarSortMethod3 = method;
            handleSaveSidebarSortOrder();
        }
        function setSidebarSortMethods(methods) {
            state.sidebarSortMethods = methods;
            configRepository.setString(
                'VRCX_sidebarSortMethods',
                JSON.stringify(methods)
            );
        }
        function setAsideWidth(width) {
            requestAnimationFrame(() => {
                state.asideWidth = width;
                configRepository.setInt('VRCX_sidePanelWidth', width);
            });
        }
        function setIsSidebarGroupByInstance() {
            state.isSidebarGroupByInstance = !state.isSidebarGroupByInstance;
            configRepository.setBool(
                'VRCX_sidebarGroupByInstance',
                state.isSidebarGroupByInstance
            );
        }
        function setIsHideFriendsInSameInstance() {
            state.isHideFriendsInSameInstance =
                !state.isHideFriendsInSameInstance;
            configRepository.setBool(
                'VRCX_hideFriendsInSameInstance',
                state.isHideFriendsInSameInstance
            );
        }
        function setIsSidebarDivideByFriendGroup() {
            state.isSidebarDivideByFriendGroup =
                !state.isSidebarDivideByFriendGroup;
            configRepository.setBool(
                'VRCX_sidebarDivideByFriendGroup',
                state.isSidebarDivideByFriendGroup
            );
        }
        function setHideUserNotes() {
            state.hideUserNotes = !state.hideUserNotes;
            configRepository.setBool('VRCX_hideUserNotes', state.hideUserNotes);
        }
        function setHideUserMemos() {
            state.hideUserMemos = !state.hideUserMemos;
            configRepository.setBool('VRCX_hideUserMemos', state.hideUserMemos);
        }
        function setHideUnfriends() {
            state.hideUnfriends = !state.hideUnfriends;
            configRepository.setBool('VRCX_hideUnfriends', state.hideUnfriends);
        }
        function setRandomUserColours() {
            state.randomUserColours = !state.randomUserColours;
            configRepository.setBool(
                'VRCX_randomUserColours',
                state.randomUserColours
            );
        }
        function setTrustColor(color) {
            state.trustColor = color;
            configRepository.setString(
                'VRCX_trustColor',
                JSON.stringify(color)
            );
        }

        async function handleSetDatetimeFormat() {
            const formatDate = await formatDateFilter(
                state.dtIsoFormat,
                state.dtHour12
            );
            Vue.filter('formatDate', formatDate);
        }

        function handleSaveSidebarSortOrder() {
            if (state.sidebarSortMethod1 === state.sidebarSortMethod2) {
                state.sidebarSortMethod2 = '';
            }
            if (state.sidebarSortMethod1 === state.sidebarSortMethod3) {
                state.sidebarSortMethod3 = '';
            }
            if (state.sidebarSortMethod2 === state.sidebarSortMethod3) {
                state.sidebarSortMethod3 = '';
            }
            if (!state.sidebarSortMethod1) {
                state.sidebarSortMethod2 = '';
            }
            if (!state.sidebarSortMethod2) {
                state.sidebarSortMethod3 = '';
            }
            const sidebarSortMethods = [
                state.sidebarSortMethod1,
                state.sidebarSortMethod2,
                state.sidebarSortMethod3
            ];
            setSidebarSortMethods(sidebarSortMethods);
        }

        async function mergeOldSortMethodsSettings() {
            const orderFriendsGroupPrivate = await configRepository.getBool(
                'orderFriendGroupPrivate'
            );
            if (orderFriendsGroupPrivate !== null) {
                await configRepository.remove('orderFriendGroupPrivate');

                const orderFriendsGroupStatus = await configRepository.getBool(
                    'orderFriendsGroupStatus'
                );
                await configRepository.remove('orderFriendsGroupStatus');

                const orderFriendsGroupGPS = await configRepository.getBool(
                    'orderFriendGroupGPS'
                );
                await configRepository.remove('orderFriendGroupGPS');

                const orderOnlineFor =
                    await configRepository.getBool('orderFriendGroup0');
                await configRepository.remove('orderFriendGroup0');
                await configRepository.remove('orderFriendGroup1');
                await configRepository.remove('orderFriendGroup2');
                await configRepository.remove('orderFriendGroup3');

                const sortOrder = [];
                if (orderFriendsGroupPrivate) {
                    sortOrder.push('Sort Private to Bottom');
                }
                if (orderFriendsGroupStatus) {
                    sortOrder.push('Sort by Status');
                }
                if (orderOnlineFor && orderFriendsGroupGPS) {
                    sortOrder.push('Sort by Time in Instance');
                }
                if (!orderOnlineFor) {
                    sortOrder.push('Sort Alphabetically');
                }

                if (sortOrder.length > 0) {
                    while (sortOrder.length < 3) {
                        sortOrder.push('');
                    }
                    state.sidebarSortMethods = sortOrder;
                    state.sidebarSortMethod1 = sortOrder[0];
                    state.sidebarSortMethod2 = sortOrder[1];
                    state.sidebarSortMethod3 = sortOrder[2];
                }
                setSidebarSortMethods(sortOrder);
            }
        }

        return {
            state,
            initAppearanceSettings,

            appLanguage,
            themeMode,
            isDarkMode,
            displayVRCPlusIconsAsAvatar,
            hideNicknames,
            hideTooltips,
            isAgeGatedInstancesVisible,
            sortFavorites,
            instanceUsersSortAlphabetical,
            tablePageSize,
            dtHour12,
            dtIsoFormat,
            sidebarSortMethod1,
            sidebarSortMethod2,
            sidebarSortMethod3,
            sidebarSortMethods,
            asideWidth,
            isSidebarGroupByInstance,
            isHideFriendsInSameInstance,
            isSidebarDivideByFriendGroup,
            hideUserNotes,
            hideUserMemos,
            hideUnfriends,
            randomUserColours,
            trustColor,

            setAppLanguage,
            setThemeMode,
            setIsDarkMode,
            setDisplayVRCPlusIconsAsAvatar,
            setHideNicknames,
            setHideTooltips,
            setIsAgeGatedInstancesVisible,
            setSortFavorites,
            setInstanceUsersSortAlphabetical,
            setTablePageSize,
            setDtHour12,
            setDtIsoFormat,
            setSidebarSortMethod1,
            setSidebarSortMethod2,
            setSidebarSortMethod3,
            setSidebarSortMethods,
            setAsideWidth,
            setIsSidebarGroupByInstance,
            setIsHideFriendsInSameInstance,
            setIsSidebarDivideByFriendGroup,
            setHideUserNotes,
            setHideUserMemos,
            setHideUnfriends,
            setRandomUserColours,
            setTrustColor
        };
    }
);
