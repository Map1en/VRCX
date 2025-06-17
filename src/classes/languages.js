import { $app, API } from '../app.js';

export default function init() {
    API.$on('CONFIG', function (args) {
        const languages =
            args.ref?.constants?.LANGUAGE?.SPOKEN_LANGUAGE_OPTIONS;
        if (!languages) {
            return;
        }
        $app.subsetOfLanguages = languages;
        const data = [];
        for (const key in languages) {
            const value = languages[key];
            data.push({
                key,
                value
            });
        }
        $app.languageDialog.languages = data;
    });

    const _data = {
        subsetOfLanguages: [],

        languageDialog: {
            visible: false,
            loading: false,
            languageChoice: false,
            languages: []
        }
    };

    $app.data = { ...$app.data, ..._data };
}
