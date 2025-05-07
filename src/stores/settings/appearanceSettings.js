import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';
import configRepository from '../../service/config';
import utils from '../../classes/utils';

export const useAppearanceSettingsStore = defineStore(
    'AppearanceSettings',
    () => {
        const state = reactive({
            appLanguage: 'en'
        });

        async function initSettings() {
            state.appLanguage = await configRepository.getString(
                'VRCX_appLanguage',
                'en'
            );
            utils.changeCJKorder(state.appLanguage);
            this.i18n.locale = state.appLanguage;
        }

        const appLanguage = computed(() => state.appLanguage);

        function setAppLanguage(language) {
            console.log('Language changed:', language);
            state.appLanguage = language;
            configRepository.setString('VRCX_appLanguage', language);
            utils.changeCJKorder(state.appLanguage);
            this.i18n.locale = state.appLanguage;
        }

        return {
            initSettings,

            appLanguage,

            setAppLanguage
        };
    }
);
