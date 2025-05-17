import { API } from '../app';

// #region | API: World
const worldReq = {
    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    getWorld(params) {
        return API.call(`worlds/${params.worldId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD', args);
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    getCachedWorld(params) {
        return new Promise((resolve, reject) => {
            const ref = API.cachedWorlds.get(params.worldId);
            if (typeof ref === 'undefined') {
                worldReq.getWorld(params).catch(reject).then(resolve);
            } else {
                resolve({
                    cache: true,
                    json: ref,
                    params,
                    ref
                });
            }
        });
    },

    /**
     * @typedef {object} WorldSearchParameter
     * @property {number} n
     * @property {number} offset
     * @property {string} search
     * @property {string} userId
     * @property {'me' | 'friend'} user
     * @property {'popularity' | 'heat' | 'trust' | 'shuffle' | 'favorites' | 'reportScore' | 'reportCount' | 'publicationDate' | 'labsPublicationDate' | 'created' | '_created_at' | 'updated' | '_updated_at' | 'order'} sort
     * @property {'ascending' | 'descending'} order
     * @property {'public' | 'private' | 'hidden' | 'all'} releaseStatus
     * @property {boolean} featured
     */
    /**
     *
     * @param {WorldSearchParameter} params
     * @param {string?} option sub-path of calling endpoint
     * @returns {Promise<{json: any, params, option}>}
     */
    getWorlds(params, option) {
        let endpoint = 'worlds';
        if (typeof option !== 'undefined') {
            endpoint = `worlds/${option}`;
        }
        return API.call(endpoint, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params,
                option
            };
            API.$emit('WORLD:LIST', args);
            return args;
        });
    },
    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    deleteWorld(params) {
        return API.call(`worlds/${params.worldId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD:DELETE', args);
            return args;
        });
    },

    /**
     * @param {{id: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    saveWorld(params) {
        return API.call(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD:SAVE', args);
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    publishWorld(params) {
        return API.call(`worlds/${params.worldId}/publish`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD:SAVE', args);
            return args;
        });
    },

    /**
     * @param {{worldId: string}} params
     * @returns {Promise<{json: any, params}>}
     */
    unpublishWorld(params) {
        return API.call(`worlds/${params.worldId}/publish`, {
            method: 'DELETE',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('WORLD:SAVE', args);
            return args;
        });
    }
};

// #endregion

export default worldReq;
