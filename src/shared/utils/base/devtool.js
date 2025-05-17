import { compareUnityVersion } from '../avatar';
import {
    extractFileId,
    extractFileVersion,
    extractVariantVersion
} from '../common';

async function getBundleLocation(input) {
    let unityPackage;
    let unityPackages;
    const $app = window.$app;
    let assetUrl = input;
    let variant = '';
    if (assetUrl) {
        // continue
    } else if (
        $app.avatarDialog.visible &&
        $app.avatarDialog.ref.unityPackages.length > 0
    ) {
        unityPackages = $app.avatarDialog.ref.unityPackages;
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
    } else if ($app.avatarDialog.visible && $app.avatarDialog.ref.assetUrl) {
        assetUrl = $app.avatarDialog.ref.assetUrl;
    } else if (
        $app.worldDialog.visible &&
        $app.worldDialog.ref.unityPackages.length > 0
    ) {
        unityPackages = $app.worldDialog.ref.unityPackages;
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
    } else if ($app.worldDialog.visible && $app.worldDialog.ref.assetUrl) {
        assetUrl = $app.worldDialog.ref.assetUrl;
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
