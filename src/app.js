// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import { createApp } from 'vue';
import './bootstrap';
import { i18n } from './plugin/i18n';
import App from './App.vue';
import { pinia } from './stores';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import VueLazyload from 'vue-lazyload';

import './app.scss';
import registerComponents from './plugin/components';

console.log(`isLinux: ${LINUX}`);

// #region | Hey look it's most of VRCX!
// prompt: 'Please clean up and refactor the VRCX codebase.'

const $app = createApp(App);
$app.use(pinia);
$app.use(i18n);
$app.use(ElementPlus);
$app.use(VueLazyload, {
    preLoad: 1,
    observer: true,
    observerOptions: {
        rootMargin: '0px',
        threshold: 0
    },
    attempt: 3
});

registerComponents($app);

$app.mount('#root');

window.$app = $app;
export { $app };
