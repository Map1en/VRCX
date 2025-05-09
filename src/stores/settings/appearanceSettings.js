import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';
import configRepository from '../../service/config';
import utils from '../../classes/utils';

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
            sortFavorites: true
        });

        async function initSettings() {
            state.appLanguage = await configRepository.getString(
                'VRCX_appLanguage',
                'en'
            );
            utils.changeCJKorder(state.appLanguage);
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

        function setAppLanguage(language) {
            console.log('Language changed:', language);
            state.appLanguage = language;
            configRepository.setString('VRCX_appLanguage', language);
            utils.changeCJKorder(state.appLanguage);
            this.i18n.locale = state.appLanguage;
        }
        function setThemeMode(mode) {
            console.log('Theme mode changed:', mode);
            state.themeMode = mode;
            configRepository.setString('VRCX_ThemeMode', mode);
            if (mode === 'light') {
                setIsDarkMode(false);
            } else if (mode === 'system') {
                setIsDarkMode(utils.systemIsDarkMode());
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

            setAppLanguage,
            setThemeMode,
            setIsDarkMode,
            setDisplayVRCPlusIconsAsAvatar,
            setHideNicknames,
            setHideTooltips,
            setIsAgeGatedInstancesVisible,
            setSortFavorites
        };
    }
);
