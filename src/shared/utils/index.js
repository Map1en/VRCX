export { removeFromArray, arraysMatch } from './base/array';
export { timeToText, formatDateFilter } from './base/format';
export {
    escapeTag,
    escapeTagRecursive,
    textToHex,
    commaNumber,
    localeIncludes
} from './base/string';
export {
    changeAppThemeStyle,
    changeCJKFontsOrder,
    systemIsDarkMode
} from './base/ui';

export {
    storeAvatarImage,
    parseAvatarUrl,
    getPlatformInfo,
    compareUnityVersion
} from './avatar';

export { loadEcharts } from './chart';

export {
    getAvailablePlatforms,
    downloadAndSaveJson,
    deleteVRChatCache,
    checkVRChatCache,
    copyToClipboard,
    getFaviconUrl,
    convertFileUrlToImageUrl,
    replaceVrcPackageUrl,
    extractFileId,
    extractFileVersion,
    extractVariantVersion,
    buildTreeData,
    replaceBioSymbols
} from './common';

export {
    compareByName,
    compareByCreatedAt,
    compareByCreatedAtAscending,
    compareByUpdatedAt,
    compareByDisplayName,
    compareByMemberCount,
    compareByPrivate,
    compareByStatus,
    compareByLastActive,
    compareByLastSeen,
    compareByLocationAt,
    compareByLocation
} from './compare';

export { getFriendsSortFunction, sortStatus, isFriendOnline } from './friend';

export { hasGroupPermission } from './group';

export {
    refreshInstancePlayerCount,
    isRealInstance,
    displayLocation,
    parseLocation,
    getLaunchURL
} from './instance';

export { getVRChatResolution } from './setting';

export { userOnlineForTimestamp, languageClass } from './user';

export { getPrintLocalDate, getPrintFileName } from './gallery';
