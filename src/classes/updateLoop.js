import * as workerTimers from 'worker-timers';
import { groupRequest } from '../api/index.js';
import { $app, API } from '../app.js';

export default function init(app) {
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

    const _methods = {
        async updateLoop() {
            try {
                if (API.isLoggedIn === true) {
                    if (--this.nextCurrentUserRefresh <= 0) {
                        this.nextCurrentUserRefresh = 300; // 5min
                        API.getCurrentUser();
                    }
                    if (--this.nextFriendsRefresh <= 0) {
                        this.nextFriendsRefresh = 3600; // 1hour
                        this.refreshFriendsList();
                        this.updateStoredUser(API.currentUser);
                        if (this.isGameRunning) {
                            API.refreshPlayerModerations();
                        }
                    }
                    if (--this.nextGroupInstanceRefresh <= 0) {
                        if (this.friendLogInitStatus) {
                            this.nextGroupInstanceRefresh = 300; // 5min
                            groupRequest.getUsersGroupInstances();
                        }
                        AppApi.CheckGameRunning();
                    }
                    if (--this.nextAppUpdateCheck <= 0) {
                        this.nextAppUpdateCheck = 3600; // 1hour
                        if (this.store.vrcxUpdater.autoUpdateVRCX !== 'Off') {
                            this.store.vrcxUpdater.checkForVRCXUpdate(
                                this.notifyMenu
                            );
                        }
                    }
                    if (--this.ipcTimeout <= 0) {
                        this.ipcEnabled = false;
                    }
                    if (
                        --this.nextClearVRCXCacheCheck <= 0 &&
                        this.clearVRCXCacheFrequency > 0
                    ) {
                        this.nextClearVRCXCacheCheck =
                            this.clearVRCXCacheFrequency / 2;
                        this.clearVRCXCache();
                    }
                    if (--this.nextDiscordUpdate <= 0) {
                        this.nextDiscordUpdate = 3;
                        if (this.store.discordPresenceSettings.discordActive) {
                            this.updateDiscord();
                        }
                    }
                    if (--this.nextAutoStateChange <= 0) {
                        this.nextAutoStateChange = 3;
                        this.updateAutoStateChange();
                    }
                    if (
                        (this.isRunningUnderWine || LINUX) &&
                        --this.nextGetLogCheck <= 0
                    ) {
                        this.nextGetLogCheck = 0.5;
                        const logLines = await LogWatcher.GetLogLines();
                        if (logLines) {
                            logLines.forEach((logLine) => {
                                $app.addGameLogEvent(logLine);
                            });
                        }
                    }
                    if (
                        (this.isRunningUnderWine || LINUX) &&
                        --this.nextGameRunningCheck <= 0
                    ) {
                        if (LINUX) {
                            this.nextGameRunningCheck = 1;
                            $app.updateIsGameRunning(
                                await AppApi.IsGameRunning(),
                                await AppApi.IsSteamVRRunning(),
                                false
                            );
                        } else {
                            this.nextGameRunningCheck = 3;
                            AppApi.CheckGameRunning();
                        }
                    }
                    if (--this.nextDatabaseOptimize <= 0) {
                        this.nextDatabaseOptimize = 86400; // 1 day
                        database.optimize();
                    }
                }
            } catch (err) {
                API.isRefreshFriendsLoading = false;
                console.error(err);
            }
            workerTimers.setTimeout(() => this.updateLoop(), 1000);
        }
    };

    app.data = { ...app.data, ..._data };
    app.methods = { ...app.methods, ..._methods };
}
