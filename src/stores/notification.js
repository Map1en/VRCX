import Noty from 'noty';
import { defineStore } from 'pinia';
import Vue, { computed, reactive } from 'vue';
import { notificationRequest, worldRequest } from '../api';
import { $app } from '../app';
import API from '../classes/apiInit';
import configRepository from '../service/config';
import database from '../service/database';
import {
    checkCanInvite,
    escapeTag,
    parseLocation,
    removeFromArray
} from '../shared/utils';
import { useGeneralSettingsStore } from './settings/general';
import { useLocationStore } from './location';
import { useFavoriteStore } from './favorite';
import { useFriendStore } from './friend';
import { useNotificationsSettingsStore } from './settings/notifications';

export const useNotificationStore = defineStore('Notification', () => {
    const generalSettingsStore = useGeneralSettingsStore();
    const locationStore = useLocationStore();
    const favoriteStore = useFavoriteStore();
    const friendStore = useFriendStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const state = reactive({
        notificationInitStatus: false,
        notificationTable: {
            data: [],
            filters: [
                {
                    prop: 'type',
                    value: [],
                    filterFn: (row, filter) =>
                        filter.value.some((v) => v === row.type)
                },
                {
                    prop: ['senderUsername', 'message'],
                    value: ''
                }
            ],
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
        unseenNotifications: [],
        isNotificationsLoading: false
    });

    async function init() {
        state.notificationTable.filters[0].value = JSON.parse(
            await configRepository.getString(
                'VRCX_notificationTableFilters',
                '[]'
            )
        );
    }

    init();

    const notificationInitStatus = computed({
        get: () => state.notificationInitStatus,
        set: (value) => {
            state.notificationInitStatus = value;
        }
    });

    const notificationTable = computed({
        get: () => state.notificationTable,
        set: (value) => {
            state.notificationTable = value;
        }
    });

    const unseenNotifications = computed({
        get: () => state.unseenNotifications,
        set: (value) => {
            state.unseenNotifications = value;
        }
    });

    const isNotificationsLoading = computed({
        get: () => state.isNotificationsLoading,
        set: (value) => {
            state.isNotificationsLoading = value;
        }
    });

    API.$on('LOGIN', function () {
        state.isNotificationsLoading = false;
    });

    API.$on('NOTIFICATION', function (args) {
        args.ref = applyNotification(args.json);
    });

    API.$on('NOTIFICATION:LIST', function (args) {
        for (const json of args.json) {
            API.$emit('NOTIFICATION', {
                json,
                params: {
                    notificationId: json.id
                }
            });
        }
    });

    API.$on('NOTIFICATION:LIST:HIDDEN', function (args) {
        for (const json of args.json) {
            json.type = 'ignoredFriendRequest';
            API.$emit('NOTIFICATION', {
                json,
                params: {
                    notificationId: json.id
                }
            });
        }
    });

    API.$on('NOTIFICATION:ACCEPT', function (args) {
        let ref;
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === args.params.notificationId) {
                ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        ref.$isExpired = true;
        args.ref = ref;
        API.$emit('NOTIFICATION:EXPIRE', {
            ref,
            params: {
                notificationId: ref.id
            }
        });
        API.$emit('FRIEND:ADD', {
            params: {
                userId: ref.senderUserId
            }
        });
    });

    API.$on('NOTIFICATION:HIDE', function (args) {
        let ref;
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === args.params.notificationId) {
                ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        args.ref = ref;
        if (
            ref.type === 'friendRequest' ||
            ref.type === 'ignoredFriendRequest' ||
            ref.type.includes('.')
        ) {
            for (let i = array.length - 1; i >= 0; i--) {
                if (array[i].id === ref.id) {
                    array.splice(i, 1);
                    break;
                }
            }
        } else {
            ref.$isExpired = true;
            database.updateNotificationExpired(ref);
        }
        API.$emit('NOTIFICATION:EXPIRE', {
            ref,
            params: {
                notificationId: ref.id
            }
        });
    });

    API.$on('NOTIFICATION:V2:LIST', function (args) {
        for (const json of args.json) {
            API.$emit('NOTIFICATION:V2', { json });
        }
    });

    API.$on('NOTIFICATION:V2', function (args) {
        const json = args.json;
        json.created_at = json.createdAt;
        if (json.title && json.message) {
            json.message = `${json.title}, ${json.message}`;
        } else if (json.title) {
            json.message = json.title;
        }
        API.$emit('NOTIFICATION', {
            json,
            params: {
                notificationId: json.id
            }
        });
    });

    API.$on('NOTIFICATION:V2:UPDATE', function (args) {
        const notificationId = args.params.notificationId;
        const json = args.json;
        if (!json) {
            return;
        }
        json.id = notificationId;
        API.$emit('NOTIFICATION', {
            json,
            params: {
                notificationId
            }
        });
        if (json.seen) {
            API.$emit('NOTIFICATION:SEE', {
                params: {
                    notificationId
                }
            });
        }
    });

    API.$on('NOTIFICATION:RESPONSE', function (args) {
        API.$emit('NOTIFICATION:HIDE', args);
        new Noty({
            type: 'success',
            text: escapeTag(args.json)
        }).show();
        console.log('NOTIFICATION:RESPONSE', args);
    });

    API.$on('LOGIN', function () {
        state.notificationTable.data = [];
    });

    API.$on('PIPELINE:NOTIFICATION', function (args) {
        const ref = args.json;
        if (
            ref.type !== 'requestInvite' ||
            generalSettingsStore.autoAcceptInviteRequests === 'Off'
        ) {
            return;
        }

        let currentLocation = locationStore.lastLocation.location;
        if (locationStore.lastLocation.location === 'traveling') {
            currentLocation = $app.lastLocationDestination;
        }
        if (!currentLocation) {
            return;
        }
        if (
            generalSettingsStore.autoAcceptInviteRequests === 'All Favorites' &&
            !favoriteStore.favoriteFriends.some(
                (x) => x.id === ref.senderUserId
            )
        ) {
            return;
        }
        if (
            generalSettingsStore.autoAcceptInviteRequests ===
                'Selected Favorites' &&
            !friendStore.localFavoriteFriends.has(ref.senderUserId)
        ) {
            return;
        }
        if (!checkCanInvite(currentLocation)) {
            return;
        }

        const L = parseLocation(currentLocation);
        worldRequest
            .getCachedWorld({
                worldId: L.worldId
            })
            .then((args1) => {
                notificationRequest
                    .sendInvite(
                        {
                            instanceId: L.tag,
                            worldId: L.tag,
                            worldName: args1.ref.name,
                            rsvp: true
                        },
                        ref.senderUserId
                    )
                    .then((_args) => {
                        const text = `Auto invite sent to ${ref.senderUsername}`;
                        if ($app.errorNoty) {
                            $app.errorNoty.close();
                        }
                        $app.errorNoty = new Noty({
                            type: 'info',
                            text
                        });
                        $app.errorNoty.show();
                        console.log(text);
                        notificationRequest.hideNotification({
                            notificationId: ref.id
                        });
                        return _args;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            });
    });

    API.$on('NOTIFICATION', function (args) {
        const { ref } = args;
        const array = state.notificationTable.data;
        const { length } = array;
        for (let i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                Vue.set(array, i, ref);
                return;
            }
        }
        if (ref.senderUserId !== API.currentUser.id) {
            if (
                ref.type !== 'friendRequest' &&
                ref.type !== 'ignoredFriendRequest' &&
                !ref.type.includes('.')
            ) {
                database.addNotificationToDatabase(ref);
            }
            if (
                friendStore.friendLogInitStatus &&
                state.notificationInitStatus
            ) {
                if (
                    state.notificationTable.filters[0].value.length === 0 ||
                    state.notificationTable.filters[0].value.includes(ref.type)
                ) {
                    $app.notifyMenu('notification');
                }
                state.unseenNotifications.push(ref.id);
                queueNotificationNoty(ref);
            }
        }
        state.notificationTable.data.push(ref);
        $app.updateSharedFeed(true);
    });

    API.$on('NOTIFICATION:SEE', function (args) {
        const { notificationId } = args.params;
        removeFromArray(state.unseenNotifications, notificationId);
        if (state.unseenNotifications.length === 0) {
            const item = $app.$refs.menu.$children[0]?.items['notification'];
            if (item) {
                item.$el.classList.remove('notify');
            }
        }
    });

    /**
     * aka: `API.applyNotification`
     * @param {object} json
     * @returns {object}
     */
    function applyNotification(json) {
        let ref;
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === json.id) {
                ref = array[i];
                break;
            }
        }
        // delete any null in json
        for (const key in json) {
            if (json[key] === null) {
                delete json[key];
            }
        }
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                senderUserId: '',
                senderUsername: '',
                type: '',
                message: '',
                details: {},
                seen: false,
                created_at: '',
                // VRCX
                $isExpired: false,
                //
                ...json
            };
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        if (ref.details !== Object(ref.details)) {
            let details = {};
            if (ref.details !== '{}') {
                try {
                    const object = JSON.parse(ref.details);
                    if (object === Object(object)) {
                        details = object;
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            ref.details = details;
        }
        return ref;
    }

    /**
     * aka: `API.expireFriendRequestNotifications`
     */
    function expireFriendRequestNotifications() {
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (
                array[i].type === 'friendRequest' ||
                array[i].type === 'ignoredFriendRequest' ||
                array[i].type.includes('.')
            ) {
                array.splice(i, 1);
            }
        }
    }

    /**
     * aka: `API.expireNotification`
     * @param {string} notificationId
     */
    function expireNotification(notificationId) {
        let ref;
        const array = state.notificationTable.data;
        for (let i = array.length - 1; i >= 0; i--) {
            if (array[i].id === notificationId) {
                ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        ref.$isExpired = true;
        database.updateNotificationExpired(ref);
        API.$emit('NOTIFICATION:EXPIRE', {
            ref,
            params: {
                notificationId: ref.id
            }
        });
    }

    /**
     * aka: `API.refreshNotifications`
     * @returns {Promise<void>}
     */
    async function refreshNotifications() {
        state.isNotificationsLoading = true;
        let count;
        let params;
        try {
            expireFriendRequestNotifications();
            params = {
                n: 100,
                offset: 0
            };
            count = 50; // 5000 max
            for (let i = 0; i < count; i++) {
                const args = await notificationRequest.getNotifications(params);
                state.unseenNotifications = [];
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
            params = {
                n: 100,
                offset: 0
            };
            count = 50; // 5000 max
            for (let i = 0; i < count; i++) {
                const args =
                    await notificationRequest.getNotificationsV2(params);
                state.unseenNotifications = [];
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
            params = {
                n: 100,
                offset: 0
            };
            count = 50; // 5000 max
            for (let i = 0; i < count; i++) {
                const args =
                    await notificationRequest.getHiddenFriendRequests(params);
                state.unseenNotifications = [];
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            state.isNotificationsLoading = false;
            state.notificationInitStatus = true;
        }
    }

    /**
     *
     * @param {object} noty
     */
    function queueNotificationNoty(noty) {
        noty.isFriend = friendStore.friends.has(noty.senderUserId);
        noty.isFavorite = friendStore.localFavoriteFriends.has(
            noty.senderUserId
        );
        const notyFilter = notificationsSettingsStore.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'On' ||
                notyFilter[noty.type] === 'Friends' ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            $app.playNoty(noty);
        }
    }

    return {
        state,
        notificationInitStatus,
        notificationTable,
        unseenNotifications,
        isNotificationsLoading,
        expireNotification,
        refreshNotifications,
        queueNotificationNoty
    };
});
