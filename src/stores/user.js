import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { friendRequest, userRequest } from '../api';
import { $app } from '../app';
import API from '../classes/apiInit';
import database from '../service/database';
import {
    arraysMatch,
    getFriendsSortFunction,
    getGroupName,
    getNameColour,
    getWorldName,
    isRealInstance,
    parseLocation,
    removeEmojis,
    removeFromArray,
    replaceBioSymbols
} from '../shared/utils';
import { useDebugStore } from './debug';
import { useFriendStore } from './friend';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';

export const useUserStore = defineStore('User', () => {
    const debugStore = useDebugStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const generalSettingsStore = useGeneralSettingsStore();
    const friendStore = useFriendStore();

    const { friendLogInitStatus, friends } = storeToRefs(friendStore);
    const { debugUserDiff } = storeToRefs(debugStore);

    const { randomUserColours, trustColor: appearanceSettingsTrustColor } =
        storeToRefs(appearanceSettingsStore);

    const state = reactive({});

    /**
     * aka: `API.applyUserTrustLevel`
     * @param {object} ref
     */
    function applyUserTrustLevel(ref) {
        ref.$isModerator = ref.developerType && ref.developerType !== 'none';
        ref.$isTroll = false;
        ref.$isProbableTroll = false;
        let trustColor = '';
        let { tags } = ref;
        if (tags.includes('admin_moderator')) {
            ref.$isModerator = true;
        }
        if (tags.includes('system_troll')) {
            ref.$isTroll = true;
        }
        if (tags.includes('system_probable_troll') && !ref.$isTroll) {
            ref.$isProbableTroll = true;
        }
        if (tags.includes('system_trust_veteran')) {
            ref.$trustLevel = 'Trusted User';
            ref.$trustClass = 'x-tag-veteran';
            trustColor = 'veteran';
            ref.$trustSortNum = 5;
        } else if (tags.includes('system_trust_trusted')) {
            ref.$trustLevel = 'Known User';
            ref.$trustClass = 'x-tag-trusted';
            trustColor = 'trusted';
            ref.$trustSortNum = 4;
        } else if (tags.includes('system_trust_known')) {
            ref.$trustLevel = 'User';
            ref.$trustClass = 'x-tag-known';
            trustColor = 'known';
            ref.$trustSortNum = 3;
        } else if (tags.includes('system_trust_basic')) {
            ref.$trustLevel = 'New User';
            ref.$trustClass = 'x-tag-basic';
            trustColor = 'basic';
            ref.$trustSortNum = 2;
        } else {
            ref.$trustLevel = 'Visitor';
            ref.$trustClass = 'x-tag-untrusted';
            trustColor = 'untrusted';
            ref.$trustSortNum = 1;
        }
        if (ref.$isTroll || ref.$isProbableTroll) {
            trustColor = 'troll';
            ref.$trustSortNum += 0.1;
        }
        if (ref.$isModerator) {
            trustColor = 'vip';
            ref.$trustSortNum += 0.3;
        }
        if (randomUserColours.value && friendLogInitStatus.value) {
            if (!ref.$userColour) {
                getNameColour(ref.id).then((colour) => {
                    ref.$userColour = colour;
                });
            }
        } else {
            ref.$userColour = appearanceSettingsTrustColor.value[trustColor];
        }
    }

    /**
     * aka: `API.applyUserLanguage`
     * @param {object} ref
     */
    function applyUserLanguage(ref) {
        if (!ref || !ref.tags || !$app.subsetOfLanguages) {
            return;
        }

        ref.$languages = [];
        const languagePrefix = 'language_';
        const prefixLength = languagePrefix.length;

        for (const tag of ref.tags) {
            if (tag.startsWith(languagePrefix)) {
                const key = tag.substring(prefixLength);
                const value = $app.subsetOfLanguages[key];

                if (value !== undefined) {
                    ref.$languages.push({ key, value });
                }
            }
        }
    }

    const robotUrl = `${API.endpointDomain}/file/file_0e8c4e32-7444-44ea-ade4-313c010d4bae/1/file`;
    /**
     * aka: `API.applyUser`
     * the biggest user data handler
     * @param json
     * @returns {any}
     */
    function applyUser(json) {
        let ref = API.cachedUsers.get(json.id);
        if (typeof json.statusDescription !== 'undefined') {
            json.statusDescription = replaceBioSymbols(json.statusDescription);
            json.statusDescription = removeEmojis(json.statusDescription);
        }
        if (typeof json.bio !== 'undefined') {
            json.bio = replaceBioSymbols(json.bio);
        }
        if (typeof json.note !== 'undefined') {
            json.note = replaceBioSymbols(json.note);
        }
        if (json.currentAvatarImageUrl === robotUrl) {
            delete json.currentAvatarImageUrl;
            delete json.currentAvatarThumbnailImageUrl;
        }
        if (typeof ref === 'undefined') {
            ref = {
                ageVerificationStatus: '',
                ageVerified: false,
                allowAvatarCopying: false,
                badges: [],
                bio: '',
                bioLinks: [],
                currentAvatarImageUrl: '',
                currentAvatarTags: [],
                currentAvatarThumbnailImageUrl: '',
                date_joined: '',
                developerType: '',
                displayName: '',
                friendKey: '',
                friendRequestStatus: '',
                id: '',
                instanceId: '',
                isFriend: false,
                last_activity: '',
                last_login: '',
                last_mobile: null,
                last_platform: '',
                location: '',
                platform: '',
                note: '',
                profilePicOverride: '',
                profilePicOverrideThumbnail: '',
                pronouns: '',
                state: '',
                status: '',
                statusDescription: '',
                tags: [],
                travelingToInstance: '',
                travelingToLocation: '',
                travelingToWorld: '',
                userIcon: '',
                worldId: '',
                // only in bulk request
                fallbackAvatar: '',
                // VRCX
                $location: {},
                $location_at: Date.now(),
                $online_for: Date.now(),
                $travelingToTime: Date.now(),
                $offline_for: '',
                $active_for: Date.now(),
                $isVRCPlus: false,
                $isModerator: false,
                $isTroll: false,
                $isProbableTroll: false,
                $trustLevel: 'Visitor',
                $trustClass: 'x-tag-untrusted',
                $userColour: '',
                $trustSortNum: 1,
                $languages: [],
                $joinCount: 0,
                $timeSpent: 0,
                $lastSeen: '',
                $nickName: '',
                $previousLocation: '',
                $customTag: '',
                $customTagColour: '',
                $friendNumber: 0,
                //
                ...json
            };
            if ($app.lastLocation.playerList.has(json.id)) {
                // update $location_at from instance join time
                const player = $app.lastLocation.playerList.get(json.id);
                ref.$location_at = player.joinTime;
                ref.$online_for = player.joinTime;
            }
            if (ref.location === 'traveling') {
                ref.$location = parseLocation(ref.travelingToLocation);
                if (
                    !API.currentTravelers.has(ref.id) &&
                    ref.travelingToLocation
                ) {
                    const travelRef = {
                        created_at: new Date().toJSON(),
                        ...ref
                    };
                    API.currentTravelers.set(ref.id, travelRef);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                    $app.onPlayerTraveling(travelRef);
                }
            } else {
                ref.$location = parseLocation(ref.location);
                if (API.currentTravelers.has(ref.id)) {
                    API.currentTravelers.delete(ref.id);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                }
            }
            if (ref.isFriend || ref.id === API.currentUser.id) {
                // update instancePlayerCount
                let newCount = $app.instancePlayerCount.get(ref.location);
                if (typeof newCount === 'undefined') {
                    newCount = 0;
                }
                newCount++;
                $app.instancePlayerCount.set(ref.location, newCount);
            }
            if ($app.customUserTags.has(json.id)) {
                const tag = $app.customUserTags.get(json.id);
                ref.$customTag = tag.tag;
                ref.$customTagColour = tag.colour;
            } else if (ref.$customTag) {
                ref.$customTag = '';
                ref.$customTagColour = '';
            }
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            applyUserTrustLevel(ref);
            applyUserLanguage(ref);
            API.cachedUsers.set(ref.id, ref);
        } else {
            const props = {};
            for (const prop in ref) {
                if (ref[prop] !== Object(ref[prop])) {
                    props[prop] = true;
                }
            }
            const $ref = { ...ref };
            Object.assign(ref, json);
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            applyUserTrustLevel(ref);
            applyUserLanguage(ref);
            // traveling
            if (ref.location === 'traveling') {
                ref.$location = parseLocation(ref.travelingToLocation);
                if (!API.currentTravelers.has(ref.id)) {
                    const travelRef = {
                        created_at: new Date().toJSON(),
                        ...ref
                    };
                    API.currentTravelers.set(ref.id, travelRef);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                    $app.onPlayerTraveling(travelRef);
                }
            } else {
                ref.$location = parseLocation(ref.location);
                if (API.currentTravelers.has(ref.id)) {
                    API.currentTravelers.delete(ref.id);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                }
            }
            for (const prop in ref) {
                if (Array.isArray(ref[prop]) && Array.isArray($ref[prop])) {
                    if (!arraysMatch(ref[prop], $ref[prop])) {
                        props[prop] = true;
                    }
                } else if (ref[prop] !== Object(ref[prop])) {
                    props[prop] = true;
                }
            }
            let has = false;
            for (const prop in props) {
                const asis = $ref[prop];
                const tobe = ref[prop];
                if (asis === tobe) {
                    delete props[prop];
                } else {
                    has = true;
                    props[prop] = [tobe, asis];
                }
            }
            // FIXME
            // if the status is offline, just ignore status and statusDescription only.
            if (has && ref.status !== 'offline' && $ref.status !== 'offline') {
                if (props.location && props.location[0] !== 'traveling') {
                    const ts = Date.now();
                    props.location.push(ts - ref.$location_at);
                    ref.$location_at = ts;
                }
                API.$emit('USER:UPDATE', {
                    ref,
                    props
                });
                if (debugUserDiff.value) {
                    delete props.last_login;
                    delete props.last_activity;
                    if (Object.keys(props).length !== 0) {
                        console.log('>', ref.displayName, props);
                    }
                }
            }
        }
        if (
            ref.$isVRCPlus &&
            ref.badges &&
            ref.badges.every(
                (x) => x.badgeId !== 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa'
            )
        ) {
            // I doubt this will last long
            ref.badges.unshift({
                badgeId: 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa',
                badgeName: 'Supporter',
                badgeDescription: 'Supports VRChat through VRC+',
                badgeImageUrl:
                    'https://assets.vrchat.com/badges/fa/bdgai_8c9cf371-ffd2-4177-9894-1093e2e34bf7.png',
                hidden: true,
                showcased: false
            });
        }
        const friendCtx = friends.value.get(ref.id);
        if (friendCtx) {
            friendCtx.ref = ref;
            friendCtx.name = ref.displayName;
        }
        if (ref.id === API.currentUser.id) {
            if (ref.status) {
                API.currentUser.status = ref.status;
            }
            $app.updateCurrentUserLocation();
        }
        API.$emit('USER:APPLY', ref);
        return ref;
    }

    return { applyUserTrustLevel, applyUserLanguage, applyUser };
});
