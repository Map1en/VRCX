import { defineStore } from 'pinia';
import Vue, { computed, reactive } from 'vue';
import configRepository from '../../service/config';
import {
    changeCJKFontsOrder,
    formatDateFilter,
    systemIsDarkMode
} from '../../shared/utils';

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
            dtIsoFormat: false
        });

        async function initSettings() {
            state.appLanguage = await configRepository.getString(
                'VRCX_appLanguage',
                'en'
            );
            changeCJKFontsOrder(state.appLanguage);
            this.i18n.locale = state.appLanguage;

            // init in app.js
            // const themeMode = await configRepository.getString(
            //     'VRCX_ThemeMode',
            //     'system'
            // );
            // setThemeMode(themeMode);

            state.displayVRCPlusIconsAsAvatar = await configRepository.getBool(
                'displayVRCPlusIconsAsAvatar',
                true
            );

            state.hideNicknames = await configRepository.getBool(
                'VRCX_hideNicknames',
                false
            );

            state.hideTooltips = await configRepository.getBool(
                'VRCX_hideTooltips',
                false
            );

            state.isAgeGatedInstancesVisible = await configRepository.getBool(
                'VRCX_isAgeGatedInstancesVisible',
                true
            );

            state.sortFavorites = await configRepository.getBool(
                'VRCX_sortFavorites',
                true
            );

            state.instanceUsersSortAlphabetical =
                await configRepository.getBool(
                    'VRCX_instanceUsersSortAlphabetical',
                    false
                );

            state.tablePageSize = await configRepository.getInt(
                'VRCX_tablePageSize',
                15
            );

            state.dtHour12 = await configRepository.getBool(
                'VRCX_dtHour12',
                false
            );
            state.dtIsoFormat = await configRepository.getBool(
                'VRCX_dtIsoFormat',
                false
            );
            handleSetDatetimeFormat();
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

        async function handleSetDatetimeFormat() {
            const formatDate = await formatDateFilter(
                state.dtIsoFormat,
                state.dtHour12
            );
            Vue.filter('formatDate', formatDate);
        }

        return {
            initSettings,

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
            setDtIsoFormat
        };
    }
);
