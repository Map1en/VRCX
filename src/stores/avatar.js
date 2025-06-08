import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import { avatarRequest } from '../api';
import { $app } from '../app';
import API from '../classes/apiInit';
import {
    checkVRChatCache,
    getAvailablePlatforms,
    getPlatformInfo,
    getBundleDateSize
} from '../shared/utils';
import { useFavoriteStore } from './favorite';

export const useAvatarStore = defineStore('Avatar', () => {
    const state = reactive({
        avatarDialog: {
            visible: false,
            loading: false,
            id: '',
            memo: '',
            ref: {},
            isFavorite: false,
            isBlocked: false,
            isQuestFallback: false,
            hasImposter: false,
            imposterVersion: '',
            isPC: false,
            isQuest: false,
            isIos: false,
            bundleSizes: [],
            platformInfo: {},
            galleryImages: [],
            galleryLoading: false,
            lastUpdated: '',
            inCache: false,
            cacheSize: 0,
            cacheLocked: false,
            cachePath: ''
        },
        cachedAvatarModerations: new Map()
    });

    const avatarDialog = computed({
        get: () => state.avatarDialog,
        set: (value) => {
            state.avatarDialog = value;
        }
    });

    function showAvatarDialog(avatarId) {
        const favoriteStore = useFavoriteStore();
        const { cachedFavoritesByObjectId, localAvatarFavoritesList } =
            storeToRefs(favoriteStore);
        const D = state.avatarDialog;
        D.visible = true;
        D.loading = true;
        D.id = avatarId;
        D.inCache = false;
        D.cacheSize = 0;
        D.cacheLocked = false;
        D.cachePath = '';
        D.isQuestFallback = false;
        D.isPC = false;
        D.isQuest = false;
        D.isIos = false;
        D.hasImposter = false;
        D.imposterVersion = '';
        D.lastUpdated = '';
        D.bundleSizes = [];
        D.platformInfo = {};
        D.galleryImages = [];
        D.galleryLoading = true;
        D.isFavorite =
            cachedFavoritesByObjectId.value.has(avatarId) ||
            (API.currentUser.$isVRCPlus &&
                localAvatarFavoritesList.value.includes(avatarId));
        D.isBlocked = state.cachedAvatarModerations.has(avatarId);
        const ref2 = API.cachedAvatars.get(avatarId);
        if (typeof ref2 !== 'undefined') {
            D.ref = ref2;
            updateVRChatAvatarCache();
            if (
                ref2.releaseStatus !== 'public' &&
                ref2.authorId !== API.currentUser.id
            ) {
                D.loading = false;
                return;
            }
        }
        avatarRequest
            .getAvatar({ avatarId })
            .then((args) => {
                let { ref } = args;
                D.ref = ref;
                getAvatarGallery(avatarId);
                updateVRChatAvatarCache();
                if (/quest/.test(ref.tags)) {
                    D.isQuestFallback = true;
                }
                let { isPC, isQuest, isIos } = getAvailablePlatforms(
                    args.ref.unityPackages
                );
                D.isPC = isPC;
                D.isQuest = isQuest;
                D.isIos = isIos;
                D.platformInfo = getPlatformInfo(args.ref.unityPackages);
                for (let i = ref.unityPackages.length - 1; i > -1; i--) {
                    const unityPackage = ref.unityPackages[i];
                    if (unityPackage.variant === 'impostor') {
                        D.hasImposter = true;
                        D.imposterVersion = unityPackage.impostorizerVersion;
                        break;
                    }
                }
                if (D.bundleSizes.length === 0) {
                    getBundleDateSize(ref).then((bundleSizes) => {
                        D.bundleSizes = bundleSizes;
                    });
                }
            })
            .catch((err) => {
                D.visible = false;
                throw err;
            })
            .finally(() => {
                $app.$nextTick(() => (D.loading = false));
            });
    }

    /**
     * aka: `$app.methods.getAvatarGallery`
     * @param {string} avatarId
     * @returns {Promise<[]>}
     */
    async function getAvatarGallery(avatarId) {
        const D = state.avatarDialog;
        const args = await avatarRequest
            .getAvatarGallery(avatarId)
            .finally(() => {
                D.galleryLoading = false;
            });
        if (args.params.galleryId !== D.id) {
            return;
        }
        D.galleryImages = [];
        // wtf is this? why is order sorting only needed if it's your own avatar?
        const sortedGallery = args.json.sort((a, b) => {
            if (!a.order && !b.order) {
                return 0;
            }
            return a.order - b.order;
        });
        for (const file of sortedGallery) {
            const url = file.versions[file.versions.length - 1].file.url;
            D.galleryImages.push(url);
        }

        // for JSON tab treeData
        D.ref.gallery = args.json;
        return D.galleryImages;
    }

    /**
     * aka: `API.applyAvatarModeration`
     * @param {object} json
     * @returns {object} ref
     */
    function applyAvatarModeration(json) {
        // fix inconsistent Unix time response
        if (typeof json.created === 'number') {
            json.created = new Date(json.created).toJSON();
        }

        let ref = state.cachedAvatarModerations.get(json.targetAvatarId);
        if (typeof ref === 'undefined') {
            ref = {
                avatarModerationType: '',
                created: '',
                targetAvatarId: '',
                ...json
            };
            state.cachedAvatarModerations.set(ref.targetAvatarId, ref);
        } else {
            Object.assign(ref, json);
        }

        // update avatar dialog
        const D = state.avatarDialog;
        if (
            D.visible &&
            ref.avatarModerationType === 'block' &&
            D.id === ref.targetAvatarId
        ) {
            D.isBlocked = true;
        }

        return ref;
    }

    function updateVRChatAvatarCache() {
        const D = state.avatarDialog;
        if (D.visible) {
            D.inCache = false;
            D.cacheSize = 0;
            D.cacheLocked = false;
            D.cachePath = '';
            checkVRChatCache(D.ref).then((cacheInfo) => {
                if (cacheInfo.Item1 > 0) {
                    D.inCache = true;
                    D.cacheSize = `${(cacheInfo.Item1 / 1048576).toFixed(2)} MB`;
                    D.cachePath = cacheInfo.Item3;
                }
                D.cacheLocked = cacheInfo.Item2;
            });
        }
    }

    return {
        state,
        avatarDialog,
        showAvatarDialog,
        applyAvatarModeration,
        getAvatarGallery,
        updateVRChatAvatarCache
    };
});
