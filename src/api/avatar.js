import { request } from '../service/apiRequestHandler';
import { API } from '../service/eventBus';

const avatarReq = {
    /**
     * @param {{ avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getAvatar(params) {
        return request(`avatars/${params.avatarId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('AVATAR', args);
            return args;
        });
    },

    /**
     * @typedef {{
     *     n: number,
     *     offset: number,
     *     search: string,
     *     userId: string,
     *     user: 'me' | 'friends'
     *     sort: 'created' | 'updated' | 'order' | '_created_at' | '_updated_at',
     *     order: 'ascending' | 'descending',
     *     releaseStatus: 'public' | 'private' | 'hidden' | 'all',
     *     featured: boolean
     * }} GetAvatarsParameter
     */
    /**
     *
     * @param {GetAvatarsParameter} params
     * @returns {Promise<{json: any, params}>}
     */
    getAvatars(params) {
        return request('avatars', {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('AVATAR:LIST', args);
            // API.$on('AVATAR:LIST')
            for (const json of args.json) {
                API.$emit('AVATAR', {
                    json,
                    params: {
                        avatarId: json.id
                    }
                });
            }

            return args;
        });
    },
    /**
     * @param {{ id: string, releaseStatus: 'public' | 'private' }} params
     * @returns {Promise<{json: any, params}>}
     */
    saveAvatar(params) {
        return request(`avatars/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('AVATAR:SAVE', args);
            // API.$on('AVATAR:SAVE')
            const { user } = args;
            API.$emit('AVATAR', {
                json: user,
                params: {
                    avatarId: user.id
                }
            });
            // });
            return args;
        });
    },

    /**
     * @param {{avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    selectAvatar(params) {
        return request(`avatars/${params.avatarId}/select`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('USER:CURRENT', args);
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    selectFallbackAvatar(params) {
        return request(`avatars/${params.avatarId}/selectfallback`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('USER:CURRENT', args);
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @return { Promise<{json: any, params}> }
     */
    deleteAvatar(params) {
        return request(`avatars/${params.avatarId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    createImposter(params) {
        return request(`avatars/${params.avatarId}/impostor/enqueue`, {
            method: 'POST'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('AVATAR:IMPOSTER:CREATE', args);
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @returns {Promise<{json: T, params}>}
     */
    deleteImposter(params) {
        return request(`avatars/${params.avatarId}/impostor`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('AVATAR:IMPOSTER:DELETE', args);
            return args;
        });
    },

    /**
     * @returns {Promise<{json: any, params}>}
     */
    getAvailableAvatarStyles() {
        return request('avatarStyles', {
            method: 'GET'
        }).then((json) => {
            const args = {
                json
            };
            // API.$emit('AVATAR:STYLES', args);
            return args;
        });
    },

    /**
     * @param {{ avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    getAvatarGallery(avatarId) {
        const params = {
            tag: 'avatargallery',
            galleryId: avatarId,
            n: 100,
            offset: 0
        };
        return request(`files`, {
            params,
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // window.API.$emit('AVATAR:GALLERY', args);
            return args;
        });
    },

    /**
     * @param {{ imageData: string, avatarId: string }} params
     * @returns {Promise<{json: any, params}>}
     */
    uploadAvatarGalleryImage(imageData, avatarId) {
        const params = {
            tag: 'avatargallery',
            galleryId: avatarId
        };
        return request('file/image', {
            uploadImage: true,
            matchingDimensions: false,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            // window.API.$emit('AVATARGALLERYIMAGE:ADD', args);
            return args;
        });
    },

    /**
     * @param {string[]} order
     * @returns {Promise<{json: any, params}>}
     */
    setAvatarGalleryOrder(order) {
        const params = {
            ids: order
        };
        return request('files/order', {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // window.API.$emit('AVATARGALLERYIMAGE:ORDER', args);
            return args;
        });
    }
};

export default avatarReq;
