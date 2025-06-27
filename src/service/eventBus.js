import { $app } from '../app.js';
import { request } from './request';

const eventHandlers = new Map();
const API = {};

API.$emit = function (name, ...args) {
    if ($app.debug) {
        console.log(name, ...args);
    }
    const handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        return;
    }
    try {
        for (const handler of handlers) {
            handler.apply(this, args);
        }
    } catch (err) {
        console.error(err);
    }
};

API.$on = function (name, handler) {
    let handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        handlers = [];
        eventHandlers.set(name, handlers);
    }
    handlers.push(handler);
};

API.$off = function (name, handler) {
    const handlers = eventHandlers.get(name);
    if (typeof handlers === 'undefined') {
        return;
    }
    const { length } = handlers;
    for (let i = 0; i < length; ++i) {
        if (handlers[i] === handler) {
            if (length > 1) {
                handlers.splice(i, 1);
            } else {
                eventHandlers.delete(name);
            }
            break;
        }
    }
};

API.getConfig = function () {
    return request('config', {
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
    AppApi.PopulateImageHosts(JSON.stringify(args.ref.whiteListedAssetUrls));
});

API.applyConfig = function (json) {
    const ref = {
        ...json
    };
    this.cachedConfig = ref;
    return ref;
};

export { API };
