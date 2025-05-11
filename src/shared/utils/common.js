import Noty from 'noty';
import { compareUnityVersion } from './avatar';
import { escapeTag } from './base/string';

function getAvailablePlatforms(unityPackages) {
    var isPC = false;
    var isQuest = false;
    var isIos = false;
    if (typeof unityPackages === 'object') {
        for (var unityPackage of unityPackages) {
            if (
                unityPackage.variant &&
                unityPackage.variant !== 'standard' &&
                unityPackage.variant !== 'security'
            ) {
                continue;
            }
            if (unityPackage.platform === 'standalonewindows') {
                isPC = true;
            } else if (unityPackage.platform === 'android') {
                isQuest = true;
            } else if (unityPackage.platform === 'ios') {
                isIos = true;
            }
        }
    }
    return { isPC, isQuest, isIos };
}

function downloadAndSaveJson(fileName, data) {
    if (!fileName || !data) {
        return;
    }
    try {
        var link = document.createElement('a');
        link.setAttribute(
            'href',
            `data:application/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(data, null, 2)
            )}`
        );
        link.setAttribute('download', `${fileName}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch {
        new Noty({
            type: 'error',
            text: escapeTag('Failed to download JSON.')
        }).show();
    }
}

async function deleteVRChatCache(ref) {
    var assetUrl = '';
    var variant = '';
    for (var i = ref.unityPackages.length - 1; i > -1; i--) {
        var unityPackage = ref.unityPackages[i];
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
    var id = extractFileId(assetUrl);
    var version = parseInt(extractFileVersion(assetUrl), 10);
    var variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    await AssetBundleManager.DeleteCache(id, version, variant, variantVersion);
}

async function checkVRChatCache(ref) {
    if (!ref.unityPackages) {
        return { Item1: -1, Item2: false, Item3: '' };
    }
    var assetUrl = '';
    var variant = '';
    for (var i = ref.unityPackages.length - 1; i > -1; i--) {
        var unityPackage = ref.unityPackages[i];
        if (unityPackage.variant && unityPackage.variant !== 'security') {
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
    if (!assetUrl) {
        assetUrl = ref.assetUrl;
    }
    var id = extractFileId(assetUrl);
    var version = parseInt(extractFileVersion(assetUrl), 10);
    var variantVersion = parseInt(extractVariantVersion(assetUrl), 10);
    if (!id || !version) {
        return { Item1: -1, Item2: false, Item3: '' };
    }

    return AssetBundleManager.CheckVRChatCache(
        id,
        version,
        variant,
        variantVersion
    );
}

function copyToClipboard(text, message = 'Copied successfully!') {
    navigator.clipboard
        .writeText(text)
        .then(() => {
            window.$app.$message({
                message: message,
                type: 'success'
            });
        })
        .catch((err) => {
            console.error('Copy failed:', err);
            window.$app.$message.error('Copy failed!');
        });
}

function getFaviconUrl(resource) {
    try {
        const url = new URL(resource);
        return `https://icons.duckduckgo.com/ip2/${url.host}.ico`;
    } catch (err) {
        console.error('Invalid URL:', err);
        return '';
    }
}

function convertFileUrlToImageUrl(url, resolution = 128) {
    if (!url) {
        return '';
    }
    /**
     * possible patterns?
     * /file/file_fileId/version
     * /file/file_fileId/version/
     * /file/file_fileId/version/file
     * /file/file_fileId/version/file/
     */
    const pattern = /file\/file_([a-f0-9-]+)\/(\d+)(\/file)?\/?$/;
    const match = url.match(pattern);

    if (match) {
        const fileId = match[1];
        const version = match[2];
        return `https://api.vrchat.cloud/api/1/image/file_${fileId}/${version}/${resolution}`;
    }
    // no match return origin url
    return url;
}

function replaceVrcPackageUrl(url) {
    if (!url) {
        return '';
    }
    return url.replace('https://api.vrchat.cloud/', 'https://vrchat.com/');
}

function extractFileId(s) {
    var match = String(s).match(/file_[0-9A-Za-z-]+/);
    return match ? match[0] : '';
}

function extractFileVersion(s) {
    var match = /(?:\/file_[0-9A-Za-z-]+\/)([0-9]+)/gi.exec(s);
    return match ? match[1] : '';
}

function extractVariantVersion(url) {
    if (!url) {
        return '0';
    }
    try {
        const params = new URLSearchParams(new URL(url).search);
        const version = params.get('v');
        if (version) {
            return version;
        }
        return '0';
    } catch {
        return '0';
    }
}

function buildTreeData(json) {
    const node = [];
    for (const key in json) {
        if (key[0] === '$') {
            continue;
        }
        const value = json[key];
        if (Array.isArray(value) && value.length === 0) {
            node.push({
                key,
                value: '[]'
            });
        } else if (value === Object(value) && Object.keys(value).length === 0) {
            node.push({
                key,
                value: '{}'
            });
        } else if (Array.isArray(value)) {
            node.push({
                children: value.map((val, idx) => {
                    if (val === Object(val)) {
                        return {
                            children: buildTreeData(val),
                            key: idx
                        };
                    }
                    return {
                        key: idx,
                        value: val
                    };
                }),
                key
            });
        } else if (value === Object(value)) {
            node.push({
                children: buildTreeData(value),
                key
            });
        } else {
            node.push({
                key,
                value: String(value)
            });
        }
    }
    node.sort(function (a, b) {
        const A = String(a.key).toUpperCase();
        const B = String(b.key).toUpperCase();
        if (A < B) {
            return -1;
        }
        if (A > B) {
            return 1;
        }
        return 0;
    });
    return node;
}

function replaceBioSymbols(text) {
    if (!text) {
        return '';
    }
    const symbolList = {
        '@': '＠',
        '#': '＃',
        $: '＄',
        '%': '％',
        '&': '＆',
        '=': '＝',
        '+': '＋',
        '/': '⁄',
        '\\': '＼',
        ';': ';',
        ':': '˸',
        ',': '‚',
        '?': '？',
        '!': 'ǃ',
        '"': '＂',
        '<': '≺',
        '>': '≻',
        '.': '․',
        '^': '＾',
        '{': '｛',
        '}': '｝',
        '[': '［',
        ']': '］',
        '(': '（',
        ')': '）',
        '|': '｜',
        '*': '∗'
    };
    let newText = text;
    for (const key in symbolList) {
        const regex = new RegExp(symbolList[key], 'g');
        newText = newText.replace(regex, key);
    }
    return newText.replace(/ {1,}/g, ' ').trimRight();
}

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
};
