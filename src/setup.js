import '@fontsource/noto-sans-kr';
import '@fontsource/noto-sans-jp';
import '@fontsource/noto-sans-sc';
import '@fontsource/noto-sans-tc';
import '@infolektuell/noto-color-emoji';
import { PiniaVuePlugin } from 'pinia';

import Vue from 'vue';
// import { API } from './service/eventBus';
// import { $t, i18n } from './plugin/globalComponents';
// import '../plugin/globalComponents';
// import '../plugin/dayjs';
// import '../plugin/ipc';
// import '../plugin/noty';
import { $t, API, i18n } from './plugin';
import configRepository from './service/config';
import vrcxJsonStorage from './service/vrcxJsonStorage';
import { commaNumber, textToHex } from './shared/utils';

Vue.use(PiniaVuePlugin);

Vue.filter('commaNumber', commaNumber);
Vue.filter('textToHex', textToHex);

new vrcxJsonStorage(VRCXStorage);
await configRepository.init();

// some workaround for failing to get voice list first run
speechSynthesis.getVoices();

if (process.env.NODE_ENV !== 'production') {
    Vue.config.errorHandler = function (err, vm, info) {
        console.error('Vue Error：', err);
        console.error('Component：', vm);
        console.error('Error Info：', info);
    };
    Vue.config.warnHandler = function (msg, vm, trace) {
        console.warn('Vue Warning：', msg);
        console.warn('Component：', vm);
        console.warn('Trace：', trace);
    };
}

export { API, $t, i18n };
