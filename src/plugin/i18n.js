import ElementUI from 'element-ui';
import Vue from 'vue';
import { DataTables } from 'vue-data-tables';
import VueI18n from 'vue-i18n';
import { createI18n } from 'vue-i18n-bridge';
import VueLazyload from 'vue-lazyload';
import * as localizedStrings from '../localization/localizedStrings';
import configRepository from '../service/config';

// i18n: execution order matters here
Vue.use(VueI18n, { bridge: true });
const i18n = createI18n(
    {
        locale: 'en',
        fallbackLocale: 'en',
        messages: localizedStrings,
        legacy: false,
        globalInjection: true,
        missingWarn: false,
        warnHtmlMessage: false,
        fallbackWarn: false
    },
    VueI18n
);
Vue.use(i18n);

Vue.use(DataTables);
Vue.use(ElementUI, {
    i18n: (key, value) => i18n.global.t(key, value)
});
Vue.use(VueLazyload, {
    preLoad: 1,
    observer: true,
    observerOptions: {
        rootMargin: '0px',
        threshold: 0
    },
    attempt: 3
});

const appLanguage = await configRepository.getString('VRCX_appLanguage', 'en');
i18n.locale = appLanguage;

const $t = i18n.global.t;

export { i18n, $t };
