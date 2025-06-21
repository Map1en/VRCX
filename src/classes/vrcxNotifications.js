import { userRequest } from '../api';
import { $app, API } from '../app.js';
import {
    displayLocation,
    extractFileId,
    extractFileVersion
} from '../shared/utils';

export default function init() {
    const _data = {
        notyMap: []
    };

    const _methods = {
        queueGameLogNoty(noty) {
            // remove join/leave notifications when switching worlds
            if (
                noty.type === 'OnPlayerJoined' ||
                noty.type === 'BlockedOnPlayerJoined' ||
                noty.type === 'MutedOnPlayerJoined'
            ) {
                var bias = this.store.location.lastLocation.date + 30 * 1000; // 30 secs
                if (Date.parse(noty.created_at) <= bias) {
                    return;
                }
            }
            if (
                noty.type === 'OnPlayerLeft' ||
                noty.type === 'BlockedOnPlayerLeft' ||
                noty.type === 'MutedOnPlayerLeft'
            ) {
                var bias = this.lastLocationDestinationTime + 5 * 1000; // 5 secs
                if (Date.parse(noty.created_at) <= bias) {
                    return;
                }
            }
            if (
                noty.type === 'Notification' ||
                noty.type === 'LocationDestination'
                // skip unused entries
            ) {
                return;
            }
            if (noty.type === 'VideoPlay') {
                if (!noty.videoName) {
                    // skip video without name
                    return;
                }
                noty.notyName = noty.videoName;
                if (noty.displayName) {
                    // add requester's name to noty
                    noty.notyName = `${noty.videoName} (${noty.displayName})`;
                }
            }
            if (
                noty.type !== 'VideoPlay' &&
                noty.displayName === API.currentUser.displayName
            ) {
                // remove current user
                return;
            }
            noty.isFriend = false;
            noty.isFavorite = false;
            if (noty.userId) {
                noty.isFriend = this.store.friend.friends.has(noty.userId);
                noty.isFavorite = this.store.friend.localFavoriteFriends.has(
                    noty.userId
                );
            } else if (noty.displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === noty.displayName) {
                        noty.isFriend = this.store.friend.friends.has(ref.id);
                        noty.isFavorite =
                            this.store.friend.localFavoriteFriends.has(ref.id);
                        break;
                    }
                }
            }
            var notyFilter =
                this.store.notificationsSettings.sharedFeedFilters.noty;
            if (
                notyFilter[noty.type] &&
                (notyFilter[noty.type] === 'On' ||
                    notyFilter[noty.type] === 'Everyone' ||
                    (notyFilter[noty.type] === 'Friends' && noty.isFriend) ||
                    (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
            ) {
                this.store.notification.playNoty(noty);
            }
        },

        queueFeedNoty(noty) {
            if (noty.type === 'Avatar') {
                return;
            }
            // hide private worlds from feed
            if (
                this.store.wristOverlaySettings.hidePrivateFromFeed &&
                noty.type === 'GPS' &&
                noty.location === 'private'
            ) {
                return;
            }
            noty.isFriend = this.store.friend.friends.has(noty.userId);
            noty.isFavorite = this.store.friend.localFavoriteFriends.has(
                noty.userId
            );
            var notyFilter =
                this.store.notificationsSettings.sharedFeedFilters.noty;
            if (
                notyFilter[noty.type] &&
                (notyFilter[noty.type] === 'Everyone' ||
                    (notyFilter[noty.type] === 'Friends' && noty.isFriend) ||
                    (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
            ) {
                this.store.notification.playNoty(noty);
            }
        },

        queueFriendLogNoty(noty) {
            if (noty.type === 'FriendRequest') {
                return;
            }
            noty.isFriend = this.store.friend.friends.has(noty.userId);
            noty.isFavorite = this.store.friend.localFavoriteFriends.has(
                noty.userId
            );
            var notyFilter =
                this.store.notificationsSettings.sharedFeedFilters.noty;
            if (
                notyFilter[noty.type] &&
                (notyFilter[noty.type] === 'On' ||
                    notyFilter[noty.type] === 'Friends' ||
                    (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
            ) {
                this.store.notification.playNoty(noty);
            }
        },

        queueModerationNoty(noty) {
            noty.isFriend = false;
            noty.isFavorite = false;
            if (noty.userId) {
                noty.isFriend = this.store.friend.friends.has(noty.userId);
                noty.isFavorite = this.store.friend.localFavoriteFriends.has(
                    noty.userId
                );
            }
            var notyFilter =
                this.store.notificationsSettings.sharedFeedFilters.noty;
            if (notyFilter[noty.type] && notyFilter[noty.type] === 'On') {
                this.store.notification.playNoty(noty);
            }
        }
    };

    $app.data = { ...$app.data, ..._data };
    $app.methods = { ...$app.methods, ..._methods };
}
