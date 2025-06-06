import { defineStore, storeToRefs } from 'pinia';
import { computed, reactive } from 'vue';
import { avatarRequest } from '../api';
import { $app } from '../app';
import API from '../classes/apiInit';
import { getAvailablePlatforms, getPlatformInfo } from '../shared/utils';
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
        }
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
        const D = this.avatarDialog;
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
        D.isBlocked = API.cachedAvatarModerations.has(avatarId);
        const ref2 = API.cachedAvatars.get(avatarId);
        if (typeof ref2 !== 'undefined') {
            D.ref = ref2;
            $app.updateVRChatAvatarCache();
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
                $app.getAvatarGallery(avatarId);
                $app.updateVRChatAvatarCache();
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
                    $app.getBundleDateSize(ref).then((bundleSizes) => {
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

    return { state, avatarDialog, showAvatarDialog };
});
