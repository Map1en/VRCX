import { storeToRefs } from 'pinia';
import { useWorldStore } from '../../../stores/world';
import { compareUnityVersion } from '../avatar';
import {
    extractFileId,
    extractFileVersion,
    extractVariantVersion
} from '../common';

async function getBundleLocation(input) {
    const worldStore = useWorldStore();
    const { worldDialog } = storeToRefs(worldStore);
    let unityPackage;
    let unityPackages;
    const $app = window.$app;
    let assetUrl = input;
    let variant = '';
    if (assetUrl) {
        // continue
    } else if (
        $app.store.avatar.avatarDialog.visible &&
        $app.store.avatar.avatarDialog.ref.unityPackages.length > 0
    ) {
        unityPackages = $app.store.avatar.avatarDialog.ref.unityPackages;
        for (let i = unityPackages.length - 1; i > -1; i--) {
            unityPackage = unityPackages[i];
            if (
                unityPackage.variant &&
                unityPackage.variant !== 'standard' &&
                unityPackage.variant !== 'security'
            ) {
                continue;
            }
            if (
                unityPackage.platform === 'standalonewindows' &&
                compareUnityVersion(unityPackage.unitySortNumber)
            ) {
                assetUrl = unityPackage.assetUrl;
                if (unityPackage.variant !== 'standard') {
                    variant = unityPackage.variant;
                }
                break;
            }
        }
    } else if (
        $app.store.avatar.avatarDialog.visible &&
        $app.store.avatar.avatarDialog.ref.assetUrl
    ) {
        assetUrl = $app.store.avatar.avatarDialog.ref.assetUrl;
    } else if (
        worldDialog.value.visible &&
        worldDialog.value.ref.unityPackages.length > 0
    ) {
        unityPackages = worldDialog.value.ref.unityPackages;
        for (let i = unityPackages.length - 1; i > -1; i--) {
            unityPackage = unityPackages[i];
            if (
                unityPackage.platform === 'standalonewindows' &&
                compareUnityVersion(unityPackage.unitySortNumber)
            ) {
                assetUrl = unityPackage.assetUrl;
                break;
            }
        }
    } else if (worldDialog.value.visible && worldDialog.value.ref.assetUrl) {
        assetUrl = worldDialog.value.ref.assetUrl;
    }
    if (!assetUrl) {
        return null;
    }
    const fileId = extractFileId(assetUrl);
    const fileVersion = parseInt(extractFileVersion(assetUrl), 10);
    const variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    const assetLocation = await AssetBundleManager.GetVRChatCacheFullLocation(
        fileId,
        fileVersion,
        variant,
        variantVersion
    );
    const cacheInfo = await AssetBundleManager.CheckVRChatCache(
        fileId,
        fileVersion,
        variant,
        variantVersion
    );
    let inCache = false;
    if (cacheInfo.Item1 > 0) {
        inCache = true;
    }
    console.log(`InCache: ${inCache}`);
    const fullAssetLocation = `${assetLocation}\\__data`;
    console.log(fullAssetLocation);
    return fullAssetLocation;
}

export { getBundleLocation };
