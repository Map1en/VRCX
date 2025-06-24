import dayjs from 'dayjs';
import * as workerTimers from 'worker-timers';
import { userRequest } from '../api';
import { $app, API } from '../app.js';
import configRepository from '../service/config.js';
import database from '../service/database.js';
import gameLogService from '../service/gamelog.js';
import {
    convertYoutubeTime,
    getGroupName,
    isRpcWorld,
    parseLocation,
    replaceBioSymbols
} from '../shared/utils';

export default function init() {
    const _data = {
        gameLogTable: {
            data: [],
            loading: false,
            search: '',
            filter: [],
            tableProps: {
                stripe: true,
                size: 'mini',
                defaultSort: {
                    prop: 'created_at',
                    order: 'descending'
                }
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 20, 25, 50, 100]
            }
        },
        gameLogSessionTable: [],
        lastVideoUrl: '',
        lastResourceloadUrl: ''
    };

    const _methods = {
        addGameLogEntry(gameLog, location) {
            if (this.store.advancedSettings.gameLogDisabled) {
                return;
            }
            var userId = String(gameLog.userId || '');
            if (!userId && gameLog.displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === gameLog.displayName) {
                        userId = ref.id;
                        break;
                    }
                }
            }
            switch (gameLog.type) {
                case 'location-destination':
                    if (this.store.game.isGameRunning) {
                        // needs to be added before OnPlayerLeft entries from LocationReset
                        this.addGameLog({
                            created_at: gameLog.dt,
                            type: 'LocationDestination',
                            location: gameLog.location
                        });
                        this.store.location.lastLocationReset(gameLog.dt);
                        this.store.location.lastLocation.location = 'traveling';
                        this.store.location.lastLocationDestination =
                            gameLog.location;
                        this.store.location.lastLocationDestinationTime =
                            Date.parse(gameLog.dt);
                        this.store.instance.removeQueuedInstance(
                            gameLog.location
                        );
                        this.store.location.updateCurrentUserLocation();
                        this.store.gameLog.clearNowPlaying();
                        this.store.instance.updateCurrentInstanceWorld();
                        this.store.user.applyUserDialogLocation();
                        this.store.instance.applyWorldDialogInstances();
                        this.store.instance.applyGroupDialogInstances();
                    }
                    break;
                case 'location':
                    this.store.instance.addInstanceJoinHistory(
                        this.store.location.lastLocation.location,
                        gameLog.dt
                    );
                    var worldName = replaceBioSymbols(gameLog.worldName);
                    if (this.store.game.isGameRunning) {
                        this.store.location.lastLocationReset(gameLog.dt);
                        this.store.gameLog.clearNowPlaying();
                        this.store.location.lastLocation = {
                            date: Date.parse(gameLog.dt),
                            location: gameLog.location,
                            name: worldName,
                            playerList: new Map(),
                            friendList: new Map()
                        };
                        this.store.instance.removeQueuedInstance(
                            gameLog.location
                        );
                        this.store.location.updateCurrentUserLocation();
                        this.store.vr.updateVRLastLocation();
                        this.store.instance.updateCurrentInstanceWorld();
                        this.store.user.applyUserDialogLocation();
                        this.store.instance.applyWorldDialogInstances();
                        this.store.instance.applyGroupDialogInstances();
                    }
                    this.store.instance.addInstanceJoinHistory(
                        gameLog.location,
                        gameLog.dt
                    );
                    var L = parseLocation(gameLog.location);
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'Location',
                        location: gameLog.location,
                        worldId: L.worldId,
                        worldName,
                        groupName: '',
                        time: 0
                    };
                    getGroupName(gameLog.location).then((groupName) => {
                        entry.groupName = groupName;
                    });
                    this.addGamelogLocationToDatabase(entry);
                    break;
                case 'player-joined':
                    var joinTime = Date.parse(gameLog.dt);
                    var userMap = {
                        displayName: gameLog.displayName,
                        userId,
                        joinTime,
                        lastAvatar: ''
                    };
                    this.store.location.lastLocation.playerList.set(
                        userId,
                        userMap
                    );
                    var ref = API.cachedUsers.get(userId);
                    if (!userId) {
                        console.error('Missing userId:', gameLog.displayName);
                    } else if (userId === API.currentUser.id) {
                        // skip
                    } else if (this.store.friend.friends.has(userId)) {
                        this.store.location.lastLocation.friendList.set(
                            userId,
                            userMap
                        );
                        if (
                            ref.location !==
                                this.store.location.lastLocation.location &&
                            ref.travelingToLocation !==
                                this.store.location.lastLocation.location
                        ) {
                            // fix $location_at with private
                            ref.$location_at = joinTime;
                        }
                    } else if (typeof ref !== 'undefined') {
                        // set $location_at to join time if user isn't a friend
                        ref.$location_at = joinTime;
                    } else {
                        if (
                            this.debugGameLog ||
                            this.store.debug.debugWebRequests
                        ) {
                            console.log('Fetching user from gameLog:', userId);
                        }
                        userRequest.getUser({ userId });
                    }
                    this.store.vr.updateVRLastLocation();
                    this.getCurrentInstanceUserList();
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'OnPlayerJoined',
                        displayName: gameLog.displayName,
                        location,
                        userId,
                        time: 0
                    };
                    database.addGamelogJoinLeaveToDatabase(entry);
                    break;
                case 'player-left':
                    var ref =
                        this.store.location.lastLocation.playerList.get(userId);
                    if (typeof ref === 'undefined') {
                        break;
                    }
                    var friendRef = this.store.friend.friends.get(userId);
                    if (typeof friendRef?.ref !== 'undefined') {
                        friendRef.ref.$joinCount++;
                        friendRef.ref.$lastSeen = new Date().toJSON();
                        friendRef.ref.$timeSpent +=
                            dayjs(gameLog.dt) - ref.joinTime;
                        if (
                            this.store.appearanceSettings.sidebarSortMethods.includes(
                                'Sort by Last Seen'
                            )
                        ) {
                            this.store.friend.sortVIPFriends = true;
                            this.store.friend.sortOnlineFriends = true;
                        }
                    }
                    var time = dayjs(gameLog.dt) - ref.joinTime;
                    this.store.location.lastLocation.playerList.delete(userId);
                    this.store.location.lastLocation.friendList.delete(userId);
                    this.photonLobbyAvatars.delete(userId);
                    this.store.vr.updateVRLastLocation();
                    this.getCurrentInstanceUserList();
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'OnPlayerLeft',
                        displayName: gameLog.displayName,
                        location,
                        userId,
                        time
                    };
                    database.addGamelogJoinLeaveToDatabase(entry);
                    break;
                case 'portal-spawn':
                    if (this.ipcEnabled && this.store.game.isGameRunning) {
                        break;
                    }
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'PortalSpawn',
                        location,
                        displayName: '',
                        userId: '',
                        instanceId: '',
                        worldName: ''
                    };
                    database.addGamelogPortalSpawnToDatabase(entry);
                    break;
                case 'video-play':
                    gameLog.videoUrl = decodeURI(gameLog.videoUrl);
                    if (this.lastVideoUrl === gameLog.videoUrl) {
                        break;
                    }
                    this.lastVideoUrl = gameLog.videoUrl;
                    this.addGameLogVideo(gameLog, location, userId);
                    break;
                case 'video-sync':
                    var timestamp = gameLog.timestamp.replace(/,/g, '');
                    if (this.nowPlaying.playing) {
                        this.nowPlaying.offset = parseInt(timestamp, 10);
                    }
                    break;
                case 'resource-load-string':
                case 'resource-load-image':
                    if (
                        !this.store.generalSettings.logResourceLoad ||
                        this.lastResourceloadUrl === gameLog.resourceUrl
                    ) {
                        break;
                    }
                    this.lastResourceloadUrl = gameLog.resourceUrl;
                    var entry = {
                        created_at: gameLog.dt,
                        type:
                            gameLog.type === 'resource-load-string'
                                ? 'StringLoad'
                                : 'ImageLoad',
                        resourceUrl: gameLog.resourceUrl,
                        location
                    };
                    database.addGamelogResourceLoadToDatabase(entry);
                    break;
                case 'screenshot':
                    // var entry = {
                    //     created_at: gameLog.dt,
                    //     type: 'Event',
                    //     data: `Screenshot Processed: ${gameLog.screenshotPath.replace(
                    //         /^.*[\\/]/,
                    //         ''
                    //     )}`
                    // };
                    // database.addGamelogEventToDatabase(entry);

                    this.processScreenshot(gameLog.screenshotPath);
                    break;
                case 'api-request':
                    // var userId = '';
                    // try {
                    //     var url = new URL(gameLog.url);
                    //     var urlParams = new URLSearchParams(gameLog.url);
                    //     if (url.pathname.substring(0, 13) === '/api/1/users/') {
                    //         var pathArray = url.pathname.split('/');
                    //         userId = pathArray[4];
                    //     } else if (urlParams.has('userId')) {
                    //         userId = urlParams.get('userId');
                    //     }
                    // } catch (err) {
                    //     console.error(err);
                    // }
                    // if (!userId) {
                    //     break;
                    // }

                    if (!$app.store.advancedSettings.saveInstancePrints) {
                        break;
                    }
                    try {
                        var printId = '';
                        var url = new URL(gameLog.url);
                        if (
                            url.pathname.substring(0, 14) === '/api/1/prints/'
                        ) {
                            var pathArray = url.pathname.split('/');
                            printId = pathArray[4];
                        }
                        if (printId && printId.length === 41) {
                            $app.store.gallery.queueSavePrintToFile(printId);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                    break;
                case 'avatar-change':
                    var ref =
                        this.store.location.lastLocation.playerList.get(userId);
                    if (
                        this.store.photon.photonLoggingEnabled ||
                        typeof ref === 'undefined' ||
                        ref.lastAvatar === gameLog.avatarName
                    ) {
                        break;
                    }
                    if (!ref.lastAvatar) {
                        ref.lastAvatar = gameLog.avatarName;
                        this.store.location.lastLocation.playerList.set(
                            userId,
                            ref
                        );
                        break;
                    }
                    ref.lastAvatar = gameLog.avatarName;
                    this.store.location.lastLocation.playerList.set(
                        userId,
                        ref
                    );
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'AvatarChange',
                        userId,
                        name: gameLog.avatarName,
                        displayName: gameLog.displayName
                    };
                    break;
                case 'vrcx':
                    // VideoPlay(PyPyDance) "https://jd.pypy.moe/api/v1/videos/jr1NX4Jo8GE.mp4",0.1001,239.606,"0905 : [J-POP] 【まなこ】金曜日のおはよう 踊ってみた (vernities)"
                    var type = gameLog.data.substr(
                        0,
                        gameLog.data.indexOf(' ')
                    );
                    if (type === 'VideoPlay(PyPyDance)') {
                        this.addGameLogPyPyDance(gameLog, location);
                    } else if (type === 'VideoPlay(VRDancing)') {
                        this.addGameLogVRDancing(gameLog, location);
                    } else if (type === 'VideoPlay(ZuwaZuwaDance)') {
                        this.addGameLogZuwaZuwaDance(gameLog, location);
                    } else if (type === 'LSMedia') {
                        this.addGameLogLSMedia(gameLog, location);
                    } else if (type === 'Movie&Chill') {
                        this.addGameLogMovieAndChill(gameLog, location);
                    }
                    break;
                case 'photon-id':
                    if (
                        !this.isGameRunning ||
                        !this.store.friend.friendLogInitStatus
                    ) {
                        break;
                    }
                    var photonId = parseInt(gameLog.photonId, 10);
                    var ref = this.photonLobby.get(photonId);
                    if (typeof ref === 'undefined') {
                        for (var ctx of API.cachedUsers.values()) {
                            if (ctx.displayName === gameLog.displayName) {
                                this.photonLobby.set(photonId, ctx);
                                this.photonLobbyCurrent.set(photonId, ctx);
                                break;
                            }
                        }
                        var ctx = {
                            displayName: gameLog.displayName
                        };
                        this.photonLobby.set(photonId, ctx);
                        this.photonLobbyCurrent.set(photonId, ctx);
                        this.getCurrentInstanceUserList();
                    }
                    break;
                case 'notification':
                    // var entry = {
                    //     created_at: gameLog.dt,
                    //     type: 'Notification',
                    //     data: gameLog.json
                    // };
                    break;
                case 'event':
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'Event',
                        data: gameLog.event
                    };
                    database.addGamelogEventToDatabase(entry);
                    break;
                case 'vrc-quit':
                    if (!this.store.game.isGameRunning) {
                        break;
                    }
                    if (this.store.advancedSettings.vrcQuitFix) {
                        var bias = Date.parse(gameLog.dt) + 3000;
                        if (bias < Date.now()) {
                            console.log(
                                'QuitFix: Bias too low, not killing VRC'
                            );
                            break;
                        }
                        AppApi.QuitGame().then((processCount) => {
                            if (processCount > 1) {
                                console.log(
                                    'QuitFix: More than 1 process running, not killing VRC'
                                );
                            } else if (processCount === 1) {
                                console.log('QuitFix: Killed VRC');
                            } else {
                                console.log(
                                    'QuitFix: Nothing to kill, no VRC process running'
                                );
                            }
                        });
                    }
                    break;
                case 'openvr-init':
                    this.store.game.isGameNoVR = false;
                    configRepository.setBool(
                        'isGameNoVR',
                        this.store.game.isGameNoVR
                    );
                    this.store.vr.updateOpenVR();
                    break;
                case 'desktop-mode':
                    this.store.game.isGameNoVR = true;
                    configRepository.setBool(
                        'isGameNoVR',
                        this.store.game.isGameNoVR
                    );
                    this.store.vr.updateOpenVR();
                    break;
                case 'udon-exception':
                    if (this.store.generalSettings.udonExceptionLogging) {
                        console.log('UdonException', gameLog.data);
                    }
                    // var entry = {
                    //     created_at: gameLog.dt,
                    //     type: 'Event',
                    //     data: gameLog.data
                    // };
                    // database.addGamelogEventToDatabase(entry);
                    break;
                case 'sticker-spawn':
                    if (!$app.store.advancedSettings.saveInstanceStickers) {
                        break;
                    }

                    $app.store.gallery.trySaveStickerToFile(
                        gameLog.displayName,
                        gameLog.fileId
                    );
                    break;
            }
            if (entry) {
                // add tag colour
                if (entry.userId) {
                    var tagRef = this.customUserTags.get(entry.userId);
                    if (typeof tagRef !== 'undefined') {
                        entry.tagColour = tagRef.colour;
                    }
                }
                this.store.notification.queueGameLogNoty(entry);
                this.addGameLog(entry);
            }
        },

        addGameLog(entry) {
            this.gameLogSessionTable.push(entry);
            this.updateSharedFeed(false);
            if (entry.type === 'VideoPlay') {
                // event time can be before last gameLog entry
                this.updateSharedFeed(true);
            }

            // If the VIP friend filter is enabled, logs from other friends will be ignored.
            if (
                this.gameLogTable.vip &&
                !this.store.friend.localFavoriteFriends.has(entry.userId) &&
                (entry.type === 'OnPlayerJoined' ||
                    entry.type === 'OnPlayerLeft' ||
                    entry.type === 'VideoPlay' ||
                    entry.type === 'PortalSpawn' ||
                    entry.type === 'External')
            ) {
                return;
            }
            if (
                entry.type === 'LocationDestination' ||
                entry.type === 'AvatarChange' ||
                entry.type === 'ChatBoxMessage' ||
                (entry.userId === API.currentUser.id &&
                    (entry.type === 'OnPlayerJoined' ||
                        entry.type === 'OnPlayerLeft'))
            ) {
                return;
            }
            if (
                this.gameLogTable.filter.length > 0 &&
                !this.gameLogTable.filter.includes(entry.type)
            ) {
                return;
            }
            if (!this.gameLogSearch(entry)) {
                return;
            }
            this.gameLogTable.data.push(entry);
            this.sweepGameLog();
            this.store.ui.notifyMenu('gameLog');
        },

        async addGamelogLocationToDatabase(input) {
            var groupName = await getGroupName(input.location);
            var entry = {
                ...input,
                groupName
            };
            database.addGamelogLocationToDatabase(entry);
        },

        async addGameLogVideo(gameLog, location, userId) {
            var videoUrl = gameLog.videoUrl;
            var youtubeVideoId = '';
            var videoId = '';
            var videoName = '';
            var videoLength = '';
            var displayName = '';
            var videoPos = 8; // video loading delay
            if (typeof gameLog.displayName !== 'undefined') {
                displayName = gameLog.displayName;
            }
            if (typeof gameLog.videoPos !== 'undefined') {
                videoPos = gameLog.videoPos;
            }
            if (!isRpcWorld(location) || gameLog.videoId === 'YouTube') {
                // skip PyPyDance and VRDancing videos
                try {
                    var url = new URL(videoUrl);
                    if (
                        url.origin === 'https://t-ne.x0.to' ||
                        url.origin === 'https://nextnex.com' ||
                        url.origin === 'https://r.0cm.org'
                    ) {
                        url = new URL(url.searchParams.get('url'));
                    }
                    if (videoUrl.startsWith('https://u2b.cx/')) {
                        url = new URL(videoUrl.substring(15));
                    }
                    var id1 = url.pathname;
                    var id2 = url.searchParams.get('v');
                    if (id1 && id1.length === 12) {
                        // https://youtu.be/
                        youtubeVideoId = id1.substring(1, 12);
                    }
                    if (id1 && id1.length === 19) {
                        // https://www.youtube.com/shorts/
                        youtubeVideoId = id1.substring(8, 19);
                    }
                    if (id2 && id2.length === 11) {
                        // https://www.youtube.com/watch?v=
                        // https://music.youtube.com/watch?v=
                        youtubeVideoId = id2;
                    }
                    if (
                        this.store.advancedSettings.youTubeApi &&
                        youtubeVideoId
                    ) {
                        var data =
                            await this.store.advancedSettings.lookupYouTubeVideo(
                                youtubeVideoId
                            );
                        if (data || data.pageInfo.totalResults !== 0) {
                            videoId = 'YouTube';
                            videoName = data.items[0].snippet.title;
                            videoLength = convertYoutubeTime(
                                data.items[0].contentDetails.duration
                            );
                        }
                    }
                } catch {
                    console.error(`Invalid URL: ${url}`);
                }
                var entry = {
                    created_at: gameLog.dt,
                    type: 'VideoPlay',
                    videoUrl,
                    videoId,
                    videoName,
                    videoLength,
                    location,
                    displayName,
                    userId,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
            }
        },

        addGameLogPyPyDance(gameLog, location) {
            var data =
                /VideoPlay\(PyPyDance\) "(.+?)",([\d.]+),([\d.]+),"(.*)"/g.exec(
                    gameLog.data
                );
            if (!data) {
                console.error('failed to parse', gameLog.data);
                return;
            }
            var videoUrl = data[1];
            var videoPos = Number(data[2]);
            var videoLength = Number(data[3]);
            var title = data[4];
            var bracketArray = title.split('(');
            var text1 = bracketArray.pop();
            var displayName = text1.slice(0, -1);
            var text2 = bracketArray.join('(');
            if (text2 === 'Custom URL') {
                var videoId = 'YouTube';
            } else {
                var videoId = text2.substr(0, text2.indexOf(':') - 1);
                text2 = text2.substr(text2.indexOf(':') + 2);
            }
            var videoName = text2.slice(0, -1);
            if (displayName === 'Random') {
                displayName = '';
            }
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === displayName) {
                        userId = ref.id;
                        break;
                    }
                }
            }
            if (videoId === 'YouTube') {
                var entry = {
                    dt: gameLog.dt,
                    videoUrl,
                    displayName,
                    videoPos,
                    videoId
                };
                this.addGameLogVideo(entry, location, userId);
            } else {
                var entry = {
                    created_at: gameLog.dt,
                    type: 'VideoPlay',
                    videoUrl,
                    videoId,
                    videoName,
                    videoLength,
                    location,
                    displayName,
                    userId,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
            }
        },

        addGameLogVRDancing(gameLog, location) {
            var data =
                /VideoPlay\(VRDancing\) "(.+?)",([\d.]+),([\d.]+),(-?[\d.]+),"(.+?)","(.+?)"/g.exec(
                    gameLog.data
                );
            if (!data) {
                console.error('failed to parse', gameLog.data);
                return;
            }
            var videoUrl = data[1];
            var videoPos = Number(data[2]);
            var videoLength = Number(data[3]);
            var videoId = Number(data[4]);
            var displayName = data[5];
            var videoName = data[6];
            if (videoId === -1) {
                videoId = 'YouTube';
            }
            if (parseInt(videoPos, 10) === parseInt(videoLength, 10)) {
                // ummm okay
                videoPos = 0;
            }
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === displayName) {
                        userId = ref.id;
                        break;
                    }
                }
            }
            if (videoId === 'YouTube') {
                var entry = {
                    dt: gameLog.dt,
                    videoUrl,
                    displayName,
                    videoPos,
                    videoId
                };
                this.addGameLogVideo(entry, location, userId);
            } else {
                var entry = {
                    created_at: gameLog.dt,
                    type: 'VideoPlay',
                    videoUrl,
                    videoId,
                    videoName,
                    videoLength,
                    location,
                    displayName,
                    userId,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
            }
        },

        addGameLogZuwaZuwaDance(gameLog, location) {
            var data =
                /VideoPlay\(ZuwaZuwaDance\) "(.+?)",([\d.]+),([\d.]+),(-?[\d.]+),"(.+?)","(.+?)"/g.exec(
                    gameLog.data
                );
            if (!data) {
                console.error('failed to parse', gameLog.data);
                return;
            }
            var videoUrl = data[1];
            var videoPos = Number(data[2]);
            var videoLength = Number(data[3]);
            var videoId = Number(data[4]);
            var displayName = data[5];
            var videoName = data[6];
            if (displayName === 'Random') {
                displayName = '';
            }
            if (videoId === 9999) {
                videoId = 'YouTube';
            }
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === displayName) {
                        userId = ref.id;
                        break;
                    }
                }
            }
            if (videoId === 'YouTube') {
                var entry = {
                    dt: gameLog.dt,
                    videoUrl,
                    displayName,
                    videoPos,
                    videoId
                };
                this.addGameLogVideo(entry, location, userId);
            } else {
                var entry = {
                    created_at: gameLog.dt,
                    type: 'VideoPlay',
                    videoUrl,
                    videoId,
                    videoName,
                    videoLength,
                    location,
                    displayName,
                    userId,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
            }
        },

        addGameLogLSMedia(gameLog, location) {
            // [VRCX] LSMedia 0,4268.981,Natsumi-sama,,
            // [VRCX] LSMedia 0,6298.292,Natsumi-sama,The Outfit (2022), 1080p
            var data = /LSMedia ([\d.]+),([\d.]+),(.+?),(.+?),(?=[^,]*$)/g.exec(
                gameLog.data
            );
            if (!data) {
                return;
            }
            var videoPos = Number(data[1]);
            var videoLength = Number(data[2]);
            var displayName = data[3];
            var videoName = replaceBioSymbols(data[4]);
            var videoUrl = videoName;
            var videoId = 'LSMedia';
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === displayName) {
                        userId = ref.id;
                        break;
                    }
                }
            }
            var entry = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            this.store.gameLog.setNowPlaying(entry);
        },

        addGameLogMovieAndChill(gameLog, location) {
            // [VRCX] Movie&Chill CurrentTime,Length,PlayerName,MovieName
            var data = /Movie&Chill ([\d.]+),([\d.]+),(.+?),(.*)/g.exec(
                gameLog.data
            );
            if (!data) {
                return;
            }
            var videoPos = Number(data[1]);
            var videoLength = Number(data[2]);
            var displayName = data[3];
            var videoName = data[4];
            var videoUrl = videoName;
            var videoId = 'Movie&Chill';
            if (!videoName) {
                return;
            }
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.store.gameLog.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === displayName) {
                        userId = ref.id;
                        break;
                    }
                }
            }
            var entry = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            this.store.gameLog.setNowPlaying(entry);
        },

        async gameLogTableLookup() {
            await configRepository.setString(
                'VRCX_gameLogTableFilters',
                JSON.stringify(this.gameLogTable.filter)
            );
            await configRepository.setBool(
                'VRCX_gameLogTableVIPFilter',
                this.gameLogTable.vip
            );
            this.gameLogTable.loading = true;
            let vipList = [];
            if (this.gameLogTable.vip) {
                vipList = Array.from(
                    this.store.friend.localFavoriteFriends.values()
                );
            }
            this.gameLogTable.data = await database.lookupGameLogDatabase(
                this.gameLogTable.search,
                this.gameLogTable.filter,
                vipList
            );
            this.gameLogTable.loading = false;
        },

        sweepGameLog() {
            var { data } = this.gameLogTable;
            var j = data.length;
            if (j > this.maxTableSize) {
                data.splice(0, j - this.maxTableSize);
            }

            var date = new Date();
            date.setDate(date.getDate() - 1); // 24 hour limit
            var limit = date.toJSON();
            var i = 0;
            var k = this.gameLogSessionTable.length;
            while (i < k && this.gameLogSessionTable[i].created_at < limit) {
                ++i;
            }
            if (i === k) {
                this.gameLogSessionTable = [];
            } else if (i) {
                this.gameLogSessionTable.splice(0, i);
            }
        },

        // async resetGameLog() {
        //     await gameLogService.reset();
        //     this.gameLogTable.data = [];
        //     this.lastLocationReset();
        // },

        // async refreshEntireGameLog() {
        //     await gameLogService.setDateTill('1970-01-01');
        //     await database.initTables();
        //     await this.resetGameLog();
        //     var location = '';
        //     for (var gameLog of await gameLogService.getAll()) {
        //         if (gameLog.type === 'location') {
        //             location = gameLog.location;
        //         }
        //         this.addGameLogEntry(gameLog, location);
        //     }
        //     this.getGameLogTable();
        // },

        async getGameLogTable() {
            await database.initTables();
            this.gameLogSessionTable = await database.getGamelogDatabase();
            var dateTill = await database.getLastDateGameLogDatabase();
            this.updateGameLog(dateTill);
        },

        async updateGameLog(dateTill) {
            await gameLogService.setDateTill(dateTill);
            await gameLogService.reset();
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 10000);
            });
            var location = '';
            for (var gameLog of await gameLogService.getAll()) {
                if (gameLog.type === 'location') {
                    location = gameLog.location;
                }
                this.addGameLogEntry(gameLog, location);
            }
        },

        addGameLogEvent(json) {
            var rawLogs = JSON.parse(json);
            var gameLog = gameLogService.parseRawGameLog(
                rawLogs[1],
                rawLogs[2],
                rawLogs.slice(3)
            );
            if (
                this.debugGameLog &&
                gameLog.type !== 'photon-id' &&
                gameLog.type !== 'api-request' &&
                gameLog.type !== 'udon-exception'
            ) {
                console.log('gameLog:', gameLog);
            }
            this.addGameLogEntry(
                gameLog,
                this.store.location.lastLocation.location
            );
        },

        gameLogSearch(row) {
            var value = this.gameLogTable.search.toUpperCase();
            if (!value) {
                return true;
            }
            if (
                (value.startsWith('wrld_') || value.startsWith('grp_')) &&
                String(row.location).toUpperCase().includes(value)
            ) {
                return true;
            }
            switch (row.type) {
                case 'Location':
                    if (String(row.worldName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'OnPlayerJoined':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'OnPlayerLeft':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'PortalSpawn':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.worldName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'Event':
                    if (String(row.data).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'External':
                    if (String(row.message).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'VideoPlay':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.videoName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.videoUrl).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'StringLoad':
                case 'ImageLoad':
                    if (String(row.resourceUrl).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
            }
            return true;
        },

        gameLogIsFriend(row) {
            if (typeof row.isFriend !== 'undefined') {
                return row.isFriend;
            }
            if (!row.userId) {
                return false;
            }
            row.isFriend = this.store.friend.friends.has(row.userId);
            return row.isFriend;
        },

        gameLogIsFavorite(row) {
            if (typeof row.isFavorite !== 'undefined') {
                return row.isFavorite;
            }
            if (!row.userId) {
                return false;
            }
            row.isFavorite = this.store.friend.localFavoriteFriends.has(
                row.userId
            );
            return row.isFavorite;
        },

        async disableGameLogDialog() {
            if (this.store.game.isGameRunning) {
                this.$message({
                    message:
                        'VRChat needs to be closed before this option can be changed',
                    type: 'error'
                });
                return;
            }
            if (!this.store.advancedSettings.gameLogDisabled) {
                this.$confirm('Continue? Disable GameLog', 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: async (action) => {
                        if (action === 'confirm') {
                            this.store.advancedSettings.setGameLogDisabled();
                        }
                    }
                });
            } else {
                this.store.advancedSettings.setGameLogDisabled();
            }
        }
    };

    $app.data = { ...$app.data, ..._data };
    $app.methods = { ...$app.methods, ..._methods };
}
