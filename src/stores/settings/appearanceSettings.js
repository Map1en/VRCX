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
            isDarkMode: false
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
        }

        const appLanguage = computed(() => state.appLanguage);
        const themeMode = computed(() => state.themeMode);
        const isDarkMode = computed(() => state.isDarkMode);

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
            console.log('Dark mode changed:', isDark);
            state.isDarkMode = isDark;
            configRepository.setString('VRCX_isDarkMode', isDark);
        }

        return {
            initSettings,

            appLanguage,
            themeMode,
            isDarkMode,

            setAppLanguage,
            setThemeMode,
            setIsDarkMode
        };
    }
);
