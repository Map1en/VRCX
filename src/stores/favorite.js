import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import * as workerTimers from 'worker-timers';
import { friendRequest, userRequest } from '../api';
import { $app } from '../app';
import API from '../classes/apiInit';
import database from '../service/database';
import {
    compareByName,
    getFriendsSortFunction,
    getGroupName,
    getWorldName,
    isRealInstance,
    removeFromArray
} from '../shared/utils';
import { useDebugStore } from './debug';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useGeneralSettingsStore } from './settings/general';

export const useFavoriteStore = defineStore('Favorite', () => {
    const favoriteFriends = computed(() => {
        if ($app.sortFavoriteFriends) {
            $app.sortFavoriteFriends = false;
            $app.favoriteFriendsSorted.sort(compareByName);
        }
        if ($app.store.appearanceSettings.sortFavorites) {
            return $app.favoriteFriends_;
        }
        return $app.favoriteFriendsSorted;
    });

    const favoriteWorlds = computed(() => {
        if ($app.sortFavoriteWorlds) {
            $app.sortFavoriteWorlds = false;
            $app.favoriteWorldsSorted.sort(compareByName);
        }
        if ($app.store.appearanceSettings.sortFavorites) {
            return $app.favoriteWorlds_;
        }
        return $app.favoriteWorldsSorted;
    });

    const favoriteAvatars = computed(() => {
        if ($app.sortFavoriteAvatars) {
            $app.sortFavoriteAvatars = false;
            $app.favoriteAvatarsSorted.sort(compareByName);
        }
        if ($app.store.appearanceSettings.sortFavorites) {
            return $app.favoriteAvatars_;
        }
        return $app.favoriteAvatarsSorted;
    });

    /**
     * aka: `$app.methods.applyFavorite`
     * @param {'friend' | 'world' | 'avatar'} type
     * @param {string} objectId
     * @param {boolean} sortTop
     * @returns {Promise<void>}
     */
    async function applyFavorite(type, objectId, sortTop) {
        let ref;
        const favorite = API.cachedFavoritesByObjectId.get(objectId);
        let ctx = $app.favoriteObjects.get(objectId);
        if (typeof favorite !== 'undefined') {
            let isTypeChanged = false;
            if (typeof ctx === 'undefined') {
                ctx = {
                    id: objectId,
                    type,
                    groupKey: favorite.$groupKey,
                    ref: null,
                    name: '',
                    $selected: false
                };
                $app.favoriteObjects.set(objectId, ctx);
                if (type === 'friend') {
                    ref = API.cachedUsers.get(objectId);
                    if (typeof ref === 'undefined') {
                        ref = $app.friendLog.get(objectId);
                        if (typeof ref !== 'undefined' && ref.displayName) {
                            ctx.name = ref.displayName;
                        }
                    } else {
                        ctx.ref = ref;
                        ctx.name = ref.displayName;
                    }
                } else if (type === 'world') {
                    ref = API.cachedWorlds.get(objectId);
                    if (typeof ref !== 'undefined') {
                        ctx.ref = ref;
                        ctx.name = ref.name;
                    }
                } else if (type === 'avatar') {
                    ref = API.cachedAvatars.get(objectId);
                    if (typeof ref !== 'undefined') {
                        ctx.ref = ref;
                        ctx.name = ref.name;
                    }
                }
                isTypeChanged = true;
            } else {
                if (ctx.type !== type) {
                    // WTF???
                    isTypeChanged = true;
                    if (type === 'friend') {
                        removeFromArray($app.favoriteFriends_, ctx);
                        removeFromArray($app.favoriteFriendsSorted, ctx);
                    } else if (type === 'world') {
                        removeFromArray($app.favoriteWorlds_, ctx);
                        removeFromArray($app.favoriteWorldsSorted, ctx);
                    } else if (type === 'avatar') {
                        removeFromArray($app.favoriteAvatars_, ctx);
                        removeFromArray($app.favoriteAvatarsSorted, ctx);
                    }
                }
                if (type === 'friend') {
                    ref = API.cachedUsers.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.displayName) {
                            ctx.name = ref.displayName;
                            $app.sortFavoriteFriends = true;
                        }
                    }
                    // else too bad
                } else if (type === 'world') {
                    ref = API.cachedWorlds.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.name) {
                            ctx.name = ref.name;
                            $app.sortFavoriteWorlds = true;
                        }
                    } else {
                        // try fetch from local world favorites
                        const world =
                            await database.getCachedWorldById(objectId);
                        if (world) {
                            ctx.ref = world;
                            ctx.name = world.name;
                            ctx.deleted = true;
                            $app.sortFavoriteWorlds = true;
                        }
                        if (!world) {
                            // try fetch from local world history
                            const worldName =
                                await database.getGameLogWorldNameByWorldId(
                                    objectId
                                );
                            if (worldName) {
                                ctx.name = worldName;
                                ctx.deleted = true;
                                $app.sortFavoriteWorlds = true;
                            }
                        }
                    }
                } else if (type === 'avatar') {
                    ref = API.cachedAvatars.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.name) {
                            ctx.name = ref.name;
                            $app.sortFavoriteAvatars = true;
                        }
                    } else {
                        // try fetch from local avatar history
                        const avatar =
                            await database.getCachedAvatarById(objectId);
                        if (avatar) {
                            ctx.ref = avatar;
                            ctx.name = avatar.name;
                            ctx.deleted = true;
                            $app.sortFavoriteAvatars = true;
                        }
                    }
                }
            }
            if (isTypeChanged) {
                if (sortTop) {
                    if (type === 'friend') {
                        $app.favoriteFriends_.unshift(ctx);
                        $app.favoriteFriendsSorted.push(ctx);
                        $app.sortFavoriteFriends = true;
                    } else if (type === 'world') {
                        $app.favoriteWorlds_.unshift(ctx);
                        $app.favoriteWorldsSorted.push(ctx);
                        $app.sortFavoriteWorlds = true;
                    } else if (type === 'avatar') {
                        $app.favoriteAvatars_.unshift(ctx);
                        $app.favoriteAvatarsSorted.push(ctx);
                        $app.sortFavoriteAvatars = true;
                    }
                } else if (type === 'friend') {
                    $app.favoriteFriends_.push(ctx);
                    $app.favoriteFriendsSorted.push(ctx);
                    $app.sortFavoriteFriends = true;
                } else if (type === 'world') {
                    $app.favoriteWorlds_.push(ctx);
                    $app.favoriteWorldsSorted.push(ctx);
                    $app.sortFavoriteWorlds = true;
                } else if (type === 'avatar') {
                    $app.favoriteAvatars_.push(ctx);
                    $app.favoriteAvatarsSorted.push(ctx);
                    $app.sortFavoriteAvatars = true;
                }
            }
        } else if (typeof ctx !== 'undefined') {
            $app.favoriteObjects.delete(objectId);
            if (type === 'friend') {
                removeFromArray($app.favoriteFriends_, ctx);
                removeFromArray($app.favoriteFriendsSorted, ctx);
            } else if (type === 'world') {
                removeFromArray($app.favoriteWorlds_, ctx);
                removeFromArray($app.favoriteWorldsSorted, ctx);
            } else if (type === 'avatar') {
                removeFromArray($app.favoriteAvatars_, ctx);
                removeFromArray($app.favoriteAvatarsSorted, ctx);
            }
        }
    }

    return {
        favoriteFriends,
        favoriteWorlds,
        favoriteAvatars,
        applyFavorite
    };
});
