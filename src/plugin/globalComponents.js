import Vue from 'vue';
import CountdownTimer from '../components/CountdownTimer.vue';
import SafeDialog from '../components/dialogs/SafeDialog.vue';
import InstanceInfo from '../components/InstanceInfo.vue';
import LastJoin from '../components/LastJoin.vue';
import Location from '../components/Location.vue';
import SimpleSwitch from '../components/SimpleSwitch.vue';
import Timer from '../components/Timer.vue';

Vue.component('SafeDialog', SafeDialog);
Vue.component('SimpleSwitch', SimpleSwitch);
Vue.component('Location', Location);
Vue.component('Timer', Timer);
Vue.component('InstanceInfo', InstanceInfo);
Vue.component('LastJoin', LastJoin);
Vue.component('CountdownTimer', CountdownTimer);
