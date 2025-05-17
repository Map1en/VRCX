import { API } from '../baseClass.js';

export default function init() {
    API.getConfig = function () {
        return this.call('config', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            this.$emit('CONFIG', args);
            return args;
        });
    };

    API.$on('CONFIG', function (args) {
        args.ref = this.applyConfig(args.json);
    });

    API.$on('CONFIG', function (args) {
        if (typeof args.ref?.whiteListedAssetUrls !== 'object') {
            console.error('Invalid config whiteListedAssetUrls');
        }
        AppApi.PopulateImageHosts(
            JSON.stringify(args.ref.whiteListedAssetUrls)
        );
    });

    API.applyConfig = function (json) {
        const ref = {
            ...json
        };
        this.cachedConfig = ref;
        return ref;
    };
}
