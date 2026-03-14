// requires binding of WebApi
import { handleMockRequest } from '../mocks/api.js';
import { isMockRuntime } from '../mocks/mode.js';

class WebApiService {
    clearCookies() {
        return WebApi.ClearCookies();
    }

    getCookies() {
        return WebApi.GetCookies();
    }

    setCookies(cookie) {
        return WebApi.SetCookies(cookie);
    }

    /**
     * @param {any} options
     * @returns {Promise<{status: number, data?: string}>}
     */
    async execute(options) {
        if (!options) {
            throw new Error('options is required');
        }
        if (isMockRuntime) {
            return handleMockRequest('', options);
        }
        if (LINUX) {
            const requestJson = JSON.stringify(options);
            var json = await WebApi.ExecuteJson(requestJson);
            var data = JSON.parse(json);
            if (data.status === -1) {
                throw new Error(data.message);
            }
            return {
                status: data.status,
                data: data.message
            };
        }

        var item = await WebApi.Execute(options);
        if (item.Item1 === -1) {
            throw item.Item2;
        }
        return {
            status: item.Item1,
            data: item.Item2
        };
    }
}

var self = new WebApiService();
window.webApiService = self;

export { self as default, WebApiService };
