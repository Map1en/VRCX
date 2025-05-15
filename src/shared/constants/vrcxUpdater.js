const branches = {
    Stable: {
        name: 'Stable',
        urlReleases: 'https://api0.vrcx.app/releases/stable',
        urlLatest: 'https://api0.vrcx.app/releases/stable/latest'
    },
    Nightly: {
        name: 'Nightly',
        urlReleases: 'https://api0.vrcx.app/releases/nightly',
        urlLatest: 'https://api0.vrcx.app/releases/nightly/latest'
    }
    // LinuxTest: {
    //     name: 'LinuxTest',
    //     urlReleases: 'https://api.github.com/repos/rs189/VRCX/releases',
    //     urlLatest:
    //         'https://api.github.com/repos/rs189/VRCX/releases/latest'
    // }
};

export { branches };
