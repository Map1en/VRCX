import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { avatarRequest, imageRequest } from '../api';
import { $app, API } from '../app';
import database from '../service/database';
import {
    checkVRChatCache,
    getAvailablePlatforms,
    getPlatformInfo,
    getBundleDateSize,
    replaceBioSymbols,
    extractFileId,
    storeAvatarImage
} from '../shared/utils';
import { useFavoriteStore } from './favorite';
import { useUserStore } from './user';

export const useAvatarStore = defineStore('Avatar', () => {
    const favoriteStore = useFavoriteStore();
    const userStore = useUserStore();
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
        cachedAvatarModerations: new Map(),
        avatarHistory: new Set(),
        avatarHistoryArray: [],
        cachedAvatars: new Map(),
        cachedAvatarNames: new Map()
    });

    const avatarDialog = computed({
        get: () => state.avatarDialog,
        set: (value) => {
            state.avatarDialog = value;
        }
    });
    const avatarHistory = state.avatarHistory;
    const avatarHistoryArray = computed({
        get: () => state.avatarHistory,
        set: (value) => {
            state.avatarHistoryArray = value;
        }
    });

    const cachedAvatarModerations = computed({
        get: () => state.cachedAvatarModerations,
        set: (value) => {
            state.cachedAvatarModerations = value;
        }
    });

    const cachedAvatars = computed({
        get: () => state.cachedAvatars,
        set: (value) => {
            state.cachedAvatars = value;
        }
    });

    const cachedAvatarNames = computed({
        get: () => state.cachedAvatarNames,
        set: (value) => {
            state.cachedAvatarNames = value;
        }
    });

    API.$on('AVATAR', function (args) {
        args.ref = applyAvatar(args.json);
    });

    API.$on('AVATAR:LIST', function (args) {
        for (const json of args.json) {
            API.$emit('AVATAR', {
                json,
                params: {
                    avatarId: json.id
                }
            });
        }
    });

    API.$on('AVATAR:SAVE', function (args) {
        const { json } = args;
        API.$emit('AVATAR', {
            json,
            params: {
                avatarId: json.id
            }
        });
    });

    API.$on('AVATAR:SELECT', function (args) {
        API.$emit('USER:CURRENT', args);
    });

    API.$on('AVATAR:DELETE', function (args) {
        const { json } = args;
        state.cachedAvatars.delete(json._id);
        if (userStore.userDialog.id === json.authorId) {
            const map = new Map();
            for (const ref of state.cachedAvatars.values()) {
                if (ref.authorId === json.authorId) {
                    map.set(ref.id, ref);
                }
            }
            const array = Array.from(map.values());
            $app.sortUserDialogAvatars(array);
        }
    });

    /**
     *
     * @param {string} avatarId
     * @returns
     */
    function showAvatarDialog(avatarId) {
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
            favoriteStore.cachedFavoritesByObjectId.has(avatarId) ||
            (API.currentUser.$isVRCPlus &&
                favoriteStore.localAvatarFavoritesList.includes(avatarId));
        D.isBlocked = state.cachedAvatarModerations.has(avatarId);
        const ref2 = state.cachedAvatars.get(avatarId);
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
                const { ref } = args;
                D.ref = ref;
                getAvatarGallery(avatarId);
                updateVRChatAvatarCache();
                if (/quest/.test(ref.tags)) {
                    D.isQuestFallback = true;
                }
                const { isPC, isQuest, isIos } = getAvailablePlatforms(
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

    /**
     * aka: `$app.methods.getAvatarHistory`
     * @returns {Promise<void>}
     */
    async function getAvatarHistory() {
        state.avatarHistory = new Set();
        const historyArray = await database.getAvatarHistory(
            API.currentUser.id
        );
        state.avatarHistoryArray = historyArray;
        for (let i = 0; i < historyArray.length; i++) {
            const avatar = historyArray[i];
            if (avatar.authorId === API.currentUser.id) {
                continue;
            }
            state.avatarHistory.add(avatar.id);
            applyAvatar(avatar);
        }
    }

    /**
     * aka: `$app.methods.addAvatarToHistory`
     * @param {string} avatarId
     */
    function addAvatarToHistory(avatarId) {
        avatarRequest.getAvatar({ avatarId }).then((args) => {
            const { ref } = args;

            database.addAvatarToCache(ref);
            database.addAvatarToHistory(ref.id);

            if (ref.authorId === API.currentUser.id) {
                return;
            }

            const historyArray = state.avatarHistoryArray;
            for (let i = 0; i < historyArray.length; ++i) {
                if (historyArray[i].id === ref.id) {
                    historyArray.splice(i, 1);
                }
            }

            state.avatarHistoryArray.unshift(ref);
            state.avatarHistory.delete(ref.id);
            state.avatarHistory.add(ref.id);
        });
    }

    /**
     * aka: `API.applyAvatar`
     * @param {object} json
     * @returns {object} ref
     */
    function applyAvatar(json) {
        let ref = state.cachedAvatars.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                acknowledgements: '',
                authorId: '',
                authorName: '',
                created_at: '',
                description: '',
                featured: false,
                highestPrice: null,
                id: '',
                imageUrl: '',
                lock: false,
                lowestPrice: null,
                name: '',
                productId: null,
                publishedListings: [],
                releaseStatus: '',
                searchable: false,
                styles: [],
                tags: [],
                thumbnailImageUrl: '',
                unityPackageUrl: '',
                unityPackageUrlObject: {},
                unityPackages: [],
                updated_at: '',
                version: 0,
                ...json
            };
            state.cachedAvatars.set(ref.id, ref);
        } else {
            const { unityPackages } = ref;
            Object.assign(ref, json);
            if (
                json.unityPackages?.length > 0 &&
                unityPackages.length > 0 &&
                !json.unityPackages[0].assetUrl
            ) {
                ref.unityPackages = unityPackages;
            }
        }
        // eslint-disable-next-line no-unsafe-optional-chaining
        for (const listing of ref?.publishedListings) {
            listing.displayName = replaceBioSymbols(listing.displayName);
            listing.description = replaceBioSymbols(listing.description);
        }
        ref.name = replaceBioSymbols(ref.name);
        ref.description = replaceBioSymbols(ref.description);
        return ref;
    }

    function clearAvatarHistory() {
        state.avatarHistory = new Set();
        state.avatarHistoryArray = [];
        database.clearAvatarHistory();
    }

    function promptClearAvatarHistory() {
        this.$confirm('Continue? Clear Avatar History', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    clearAvatarHistory();
                }
            }
        });
    }

    /**
     *
     * @param {string} imageUrl
     * @returns {Promise<object>}
     */
    async function getAvatarName(imageUrl) {
        const fileId = extractFileId(imageUrl);
        if (!fileId) {
            return {
                ownerId: '',
                avatarName: '-'
            };
        }
        if (state.cachedAvatarNames.has(fileId)) {
            return state.cachedAvatarNames.get(fileId);
        }
        const args = await imageRequest.getAvatarImages({ fileId });
        return storeAvatarImage(args, state.cachedAvatarNames);
    }

    return {
        state,
        avatarDialog,
        avatarHistory,
        avatarHistoryArray,
        cachedAvatarModerations,
        cachedAvatars,
        cachedAvatarNames,

        showAvatarDialog,
        applyAvatarModeration,
        getAvatarGallery,
        updateVRChatAvatarCache,
        getAvatarHistory,
        addAvatarToHistory,
        applyAvatar,
        promptClearAvatarHistory,
        getAvatarName
    };
});
