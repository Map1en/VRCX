import { $app } from '../app.js';

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

API.$on('CONFIG', function (args) {
    const ref = {
        ...args.json
    };
    args.ref = ref;
    this.cachedConfig = ref;
});

API.$on('CONFIG', function (args) {
    if (typeof args.ref?.whiteListedAssetUrls !== 'object') {
        console.error('Invalid config whiteListedAssetUrls');
    }
    AppApi.PopulateImageHosts(JSON.stringify(args.ref.whiteListedAssetUrls));
});

export { API };
