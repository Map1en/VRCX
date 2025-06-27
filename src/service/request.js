import Noty from 'noty';
import { $app, t } from '../app.js';
import { statusCodes } from '../shared/constants/api.js';
import { escapeTag } from '../shared/utils';
import {
    useAuthStore,
    useAvatarStore,
    useNotificationStore,
    useUserStore
} from '../stores';
import { API } from './eventBus.js';

API.endpointDomainVrchat = 'https://api.vrchat.cloud/api/1';
API.websocketDomainVrchat = 'wss://pipeline.vrchat.cloud';
API.endpointDomain = 'https://api.vrchat.cloud/api/1';
API.websocketDomain = 'wss://pipeline.vrchat.cloud';

const pendingGetRequests = new Map();
export let failedGetRequests = new Map();

export function request(endpoint, options) {
    const userStore = useUserStore();
    const avatarStore = useAvatarStore();
    const authStore = useAuthStore();
    const notificationStore = useNotificationStore();
    let req;
    const init = {
        url: `${API.endpointDomain}/${endpoint}`,
        method: 'GET',
        ...options
    };
    const { params } = init;
    if (init.method === 'GET') {
        // don't retry recent 404/403
        if (failedGetRequests.has(endpoint)) {
            const lastRun = failedGetRequests.get(endpoint);
            if (lastRun >= Date.now() - 900000) {
                // 15mins
                throw new Error(
                    `${t('api.error.message.403_404_bailing_request')}, ${endpoint}`
                );
            }
            failedGetRequests.delete(endpoint);
        }
        // transform body to url
        if (params === Object(params)) {
            const url = new URL(init.url);
            const { searchParams } = url;
            for (const key in params) {
                searchParams.set(key, params[key]);
            }
            init.url = url.toString();
        }
        // merge requests
        req = pendingGetRequests.get(init.url);
        if (typeof req !== 'undefined') {
            if (req.time >= Date.now() - 10000) {
                // 10s
                return req.req;
            }
            pendingGetRequests.delete(init.url);
        }
    } else if (
        init.uploadImage ||
        init.uploadFilePUT ||
        init.uploadImageLegacy
    ) {
        // nothing
    } else {
        init.headers = {
            'Content-Type': 'application/json;charset=utf-8',
            ...init.headers
        };
        init.body = params === Object(params) ? JSON.stringify(params) : '{}';
    }
    req = webApiService
        .execute(init)
        .catch((err) => {
            $throw(0, err, endpoint);
        })
        .then((response) => {
            if (!response.data) {
                if (API.debugWebRequests) {
                    console.log(init, response);
                }
                return response;
            }
            try {
                response.data = JSON.parse(response.data);
                if (API.debugWebRequests) {
                    console.log(init, response.data);
                }
                return response;
            } catch (e) {
                console.error(e);
            }
            if (response.status === 200) {
                $throw(
                    0,
                    t('api.error.message.invalid_json_response'),
                    endpoint
                );
            }
            if (
                response.status === 429 &&
                init.url.endsWith('/instances/groups')
            ) {
                $app.nextGroupInstanceRefresh = 120; // 1min
                throw new Error(`${response.status}: rate limited ${endpoint}`);
            }
            if (response.status === 504 || response.status === 502) {
                // ignore expected API errors
                throw new Error(
                    `${response.status}: ${response.data} ${endpoint}`
                );
            }
            $throw(response.status, endpoint);
            return {};
        })
        .then(({ data, status }) => {
            if (status === 200) {
                if (!data) {
                    return data;
                }
                let text = '';
                if (data.success === Object(data.success)) {
                    text = data.success.message;
                } else if (data.OK === String(data.OK)) {
                    text = data.OK;
                }
                if (text) {
                    new Noty({
                        type: 'success',
                        text: escapeTag(text)
                    }).show();
                }
                return data;
            }
            if (
                status === 401 &&
                data.error.message === '"Missing Credentials"'
            ) {
                API.$emit('AUTOLOGIN');
                throw new Error(
                    `401 ${t('api.error.message.missing_credentials')}`
                );
            }
            if (
                status === 401 &&
                data.error.message === '"Unauthorized"' &&
                endpoint !== 'auth/user'
            ) {
                // trigger 2FA dialog
                if (!authStore.twoFactorAuthDialogVisible) {
                    userStore.getCurrentUser();
                }
                throw new Error(`401 ${t('api.status_code.401')}`);
            }
            if (status === 403 && endpoint === 'config') {
                $app.$alert(
                    t('api.error.message.vpn_in_use'),
                    `403 ${t('api.error.message.login_error')}`
                );
                API.$emit('LOGOUT');
                throw new Error(`403 ${endpoint}`);
            }
            if (
                init.method === 'GET' &&
                status === 404 &&
                endpoint.startsWith('avatars/')
            ) {
                $app.$message({
                    message: t('message.api_handler.avatar_private_or_deleted'),
                    type: 'error'
                });
                avatarStore.avatarDialog.visible = false;
                throw new Error(`404: ${data.error.message} ${endpoint}`);
            }
            if (status === 404 && endpoint.endsWith('/persist/exists')) {
                return false;
            }
            if (
                init.method === 'GET' &&
                (status === 404 || status === 403) &&
                !endpoint.startsWith('auth/user')
            ) {
                failedGetRequests.set(endpoint, Date.now());
            }
            if (
                init.method === 'GET' &&
                status === 404 &&
                endpoint.startsWith('users/') &&
                endpoint.split('/').length - 1 === 1
            ) {
                throw new Error(`404: ${data.error.message} ${endpoint}`);
            }
            if (
                status === 404 &&
                endpoint.startsWith('invite/') &&
                init.inviteId
            ) {
                notificationStore.expireNotification(init.inviteId);
            }
            if (status === 403 && endpoint.startsWith('invite/myself/to/')) {
                throw new Error(`403: ${data.error.message} ${endpoint}`);
            }
            if (data && data.error === Object(data.error)) {
                $throw(
                    data.error.status_code || status,
                    data.error.message,
                    endpoint
                );
            } else if (data && typeof data.error === 'string') {
                $throw(data.status_code || status, data.error, endpoint);
            }
            $throw(status, data, endpoint);
            return data;
        });
    if (init.method === 'GET') {
        req.finally(() => {
            pendingGetRequests.delete(init.url);
        });
        pendingGetRequests.set(init.url, {
            req,
            time: Date.now()
        });
    }
    return req;
}

// FIXME : extra를 없애줘
export function $throw(code, error, endpoint) {
    let text = [];
    if (code > 0) {
        const status = statusCodes[code];
        if (typeof status === 'undefined') {
            text.push(`${code}`);
        } else {
            const codeText = t(`api.status_code.${code}`);
            text.push(`${code} ${codeText}`);
        }
    }
    if (typeof error !== 'undefined') {
        text.push(
            `${t('api.error.message.error_message')}: ${typeof error === 'string' ? error : JSON.stringify(error)}`
        );
    }
    if (typeof endpoint !== 'undefined') {
        text.push(
            `${t('api.error.message.endpoint')}: "${typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint)}"`
        );
    }
    text = text.map((s) => escapeTag(s)).join('<br>');
    if (text.length) {
        if (API.errorNoty) {
            API.errorNoty.close();
        }
        API.errorNoty = new Noty({
            type: 'error',
            text
        });
        API.errorNoty.show();
    }
    throw new Error(text);
}

function $bulk(options, args) {
    if ('handle' in options) {
        options.handle.call(this, args, options);
    }
    if (
        args.json.length > 0 &&
        ((options.params.offset += args.json.length),
        // eslint-disable-next-line no-nested-ternary
        options.N > 0
            ? options.N > options.params.offset
            : options.N < 0
              ? args.json.length
              : options.params.n === args.json.length)
    ) {
        bulk(options);
    } else if ('done' in options) {
        options.done.call(this, true, options);
    }
    return args;
}

export function bulk(options) {
    // it's stupid, but I won't waste time on the 'this' context
    // works, that's enough.
    if (typeof options.fn === 'function') {
        options
            .fn(options.params)
            .catch((err) => {
                if ('done' in options) {
                    options.done.call(this, false, options);
                }
                throw err;
            })
            .then((args) => $bulk(options, args));
    } else {
        this[options.fn](options.params)
            .catch((err) => {
                if ('done' in options) {
                    options.done.call(this, false, options);
                }
                throw err;
            })
            .then((args) => $bulk(options, args));
    }
}
