import { $app, API } from '../app.js';

export default function init() {
    API.$on('LOGIN', function () {
        $app.nextCurrentUserRefresh = 300;
        $app.nextFriendsRefresh = 3600;
        $app.nextGroupInstanceRefresh = 0;
    });

    const _data = {
        nextCurrentUserRefresh: 300,
        nextFriendsRefresh: 3600,
        nextGroupInstanceRefresh: 0,
        nextAppUpdateCheck: 3600,
        ipcTimeout: 0,
        nextClearVRCXCacheCheck: 0,
        nextDiscordUpdate: 0,
        nextAutoStateChange: 0,
        nextGetLogCheck: 0,
        nextGameRunningCheck: 0,
        nextDatabaseOptimize: 3600
    };

    const _methods = {};

    $app.data = { ...$app.data, ..._data };
    $app.methods = { ...$app.methods, ..._methods };
}
