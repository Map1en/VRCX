import { compareUnityVersion } from '../avatar';
import {
    extractFileId,
    extractFileVersion,
    extractVariantVersion
} from '../common';

// not window.$app
window.getBundleLocation = async function (input) {
    const $app = window.$app;
    var assetUrl = input;
    var variant = '';
    if (assetUrl) {
        // continue
    } else if (
        $app.avatarDialog.visible &&
        $app.avatarDialog.ref.unityPackages.length > 0
    ) {
        var unityPackages = $app.avatarDialog.ref.unityPackages;
        for (let i = unityPackages.length - 1; i > -1; i--) {
            var unityPackage = unityPackages[i];
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
        var unityPackages = $app.worldDialog.ref.unityPackages;
        for (let i = unityPackages.length - 1; i > -1; i--) {
            var unityPackage = unityPackages[i];
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
    var fileId = extractFileId(assetUrl);
    var fileVersion = parseInt(extractFileVersion(assetUrl), 10);
    var variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    var assetLocation = await AssetBundleManager.GetVRChatCacheFullLocation(
        fileId,
        fileVersion,
        variant,
        variantVersion
    );
    var cacheInfo = await AssetBundleManager.CheckVRChatCache(
        fileId,
        fileVersion,
        variant,
        variantVersion
    );
    var inCache = false;
    if (cacheInfo.Item1 > 0) {
        inCache = true;
    }
    console.log(`InCache: ${inCache}`);
    var fullAssetLocation = `${assetLocation}\\__data`;
    console.log(fullAssetLocation);
    return fullAssetLocation;
};
