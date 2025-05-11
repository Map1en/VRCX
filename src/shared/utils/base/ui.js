function systemIsDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function changeAppThemeStyle(themeMode) {
    const themeStyle = {};
    switch (themeMode) {
        case 'light':
            themeStyle.href = '';
            break;
        case 'dark':
            themeStyle.href = '';
            break;
        case 'darkvanillaold':
            themeStyle.href = 'theme.darkvanillaold.css';
            break;
        case 'darkvanilla':
            themeStyle.href = 'theme.darkvanilla.css';
            break;
        case 'pink':
            themeStyle.href = 'theme.pink.css';
            break;
        case 'material3':
            themeStyle.href = 'theme.material3.css';
            break;
        case 'system':
            themeStyle.href = '';
            break;
    }

    /**
     * prevents flickering
     * giving absolute paths does prevent flickering
     * when switching from another dark theme to 'dark' theme
     * <del>works on my machine</del>
     */
    const filePathPrefix = 'file://vrcx/';

    let $appThemeStyle = document.getElementById('app-theme-style');
    if (!$appThemeStyle) {
        $appThemeStyle = document.createElement('link');
        $appThemeStyle.setAttribute('id', 'app-theme-style');
        $appThemeStyle.rel = 'stylesheet';
        document.head.appendChild($appThemeStyle);
    }
    $appThemeStyle.href = themeStyle.href
        ? `${filePathPrefix}${themeStyle.href}`
        : '';

    let $appThemeDarkStyle = document.getElementById('app-theme-dark-style');

    const darkThemeCssPath = `${filePathPrefix}theme.dark.css`;

    if (!$appThemeDarkStyle && themeMode !== 'light') {
        if (themeMode === 'system' && !systemIsDarkMode()) {
            return;
        }
        $appThemeDarkStyle = document.createElement('link');
        $appThemeDarkStyle.setAttribute('id', 'app-theme-dark-style');
        $appThemeDarkStyle.rel = 'stylesheet';
        $appThemeDarkStyle.href = darkThemeCssPath;
        document.head.appendChild($appThemeDarkStyle);
    } else {
        if (themeMode === 'system' && systemIsDarkMode()) {
            if ($appThemeDarkStyle.href === darkThemeCssPath) {
                return;
            }
            $appThemeDarkStyle.href = darkThemeCssPath;
        } else if (themeMode !== 'light' && themeMode !== 'system') {
            if ($appThemeDarkStyle.href === darkThemeCssPath) {
                return;
            }
            $appThemeDarkStyle.href = darkThemeCssPath;
        } else {
            $appThemeDarkStyle && $appThemeDarkStyle.remove();
        }
    }
}

// CJK character in Japanese, Korean, Chinese are different
// so change font-family order when users change language to display CJK character correctly
function changeCJKFontsOrder(lang) {
    const otherFonts = window
        .getComputedStyle(document.body)
        .fontFamily.split(',')
        .filter((item) => !item.includes('Noto Sans'))
        .join(', ');
    const notoSans = 'Noto Sans';

    const fontFamilies = {
        ja_JP: ['JP', 'KR', 'TC', 'SC'],
        ko: ['KR', 'JP', 'TC', 'SC'],
        zh_TW: ['TC', 'JP', 'KR', 'SC'],
        zh_CN: ['SC', 'JP', 'KR', 'TC']
    };

    if (fontFamilies[lang]) {
        const CJKFamily = fontFamilies[lang]
            .map((item) => `${notoSans} ${item}`)
            .join(', ');
        document.body.style.fontFamily = `${CJKFamily}, ${otherFonts}`;
    }
}

export { changeAppThemeStyle, changeCJKFontsOrder };
