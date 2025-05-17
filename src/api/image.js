import { API, $app } from '../app';

const imageReq = {
    // use in uploadAvatarImage
    // need to test
    async uploadAvatarFailCleanup(id) {
        const json = await API.call(`file/${id}`, {
            method: 'GET'
        });
        const fileId = json.id;
        const fileVersion = json.versions[json.versions.length - 1].version;
        API.call(`file/${fileId}/${fileVersion}/signature/finish`, {
            method: 'PUT'
        });
        API.call(`file/${fileId}/${fileVersion}/file/finish`, {
            method: 'PUT'
        });
        $app.avatarDialog.loading = false;
        // $app.changeAvatarImageDialogLoading = false;
    },

    async uploadAvatarImage(params, fileId) {
        try {
            return await API.call(`file/${fileId}`, {
                method: 'POST',
                params
            }).then((json) => {
                const args = {
                    json,
                    params,
                    fileId
                };
                // API.$emit('AVATARIMAGE:INIT', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadAvatarFailCleanup(fileId);
            throw err;
        }
        // return void 0;
    },

    async uploadAvatarImageFileStart(params) {
        try {
            return await API.call(
                `file/${params.fileId}/${params.fileVersion}/file/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                const args = {
                    json,
                    params
                };
                // API.$emit('AVATARIMAGE:FILESTART', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadAvatarFailCleanup(params.fileId);
        }
        return void 0;
    },

    uploadAvatarImageFileFinish(params) {
        return API.call(
            `file/${params.fileId}/${params.fileVersion}/file/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('AVATARIMAGE:FILEFINISH', args);
            return args;
        });
    },

    async uploadAvatarImageSigStart(params) {
        try {
            return await API.call(
                `file/${params.fileId}/${params.fileVersion}/signature/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                const args = {
                    json,
                    params
                };
                // API.$emit('AVATARIMAGE:SIGSTART', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadAvatarFailCleanup(params.fileId);
        }
        return void 0;
    },

    uploadAvatarImageSigFinish(params) {
        return API.call(
            `file/${params.fileId}/${params.fileVersion}/signature/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('AVATARIMAGE:SIGFINISH', args);
            return args;
        });
    },

    setAvatarImage(params) {
        return API.call(`avatars/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('AVATARIMAGE:SET', args);
            API.$emit('AVATAR', args);
            return args;
        });
    },

    // use in uploadWorldImage
    // need to test
    async uploadWorldFailCleanup(id) {
        const json = await API.call(`file/${id}`, {
            method: 'GET'
        });
        const fileId = json.id;
        const fileVersion = json.versions[json.versions.length - 1].version;
        API.call(`file/${fileId}/${fileVersion}/signature/finish`, {
            method: 'PUT'
        });
        API.call(`file/${fileId}/${fileVersion}/file/finish`, {
            method: 'PUT'
        });
        $app.worldDialog.loading = false;
        // $app.changeWorldImageDialogLoading = false;
    },

    async uploadWorldImage(params, fileId) {
        try {
            return await API.call(`file/${fileId}`, {
                method: 'POST',
                params
            }).then((json) => {
                const args = {
                    json,
                    params,
                    fileId
                };
                // API.$emit('WORLDIMAGE:INIT', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadWorldFailCleanup(fileId);
        }
        return void 0;
    },

    async uploadWorldImageFileStart(params) {
        try {
            return await API.call(
                `file/${params.fileId}/${params.fileVersion}/file/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                const args = {
                    json,
                    params
                };
                // API.$emit('WORLDIMAGE:FILESTART', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadWorldFailCleanup(params.fileId);
        }
        return void 0;
    },

    uploadWorldImageFileFinish(params) {
        return API.call(
            `file/${params.fileId}/${params.fileVersion}/file/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('WORLDIMAGE:FILEFINISH', args);
            return args;
        });
    },

    async uploadWorldImageSigStart(params) {
        try {
            return await API.call(
                `file/${params.fileId}/${params.fileVersion}/signature/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                const args = {
                    json,
                    params
                };
                // API.$emit('WORLDIMAGE:SIGSTART', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            imageReq.uploadWorldFailCleanup(params.fileId);
        }
        return void 0;
    },

    uploadWorldImageSigFinish(params) {
        return API.call(
            `file/${params.fileId}/${params.fileVersion}/signature/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('WORLDIMAGE:SIGFINISH', args);
            return args;
        });
    },

    setWorldImage(params) {
        return API.call(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('WORLDIMAGE:SET', args);
            API.$emit('WORLD', args);
            return args;
        });
    },

    getAvatarImages(params) {
        return API.call(`file/${params.fileId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('AVATARIMAGE:GET', args);
            return args;
        });
    },

    getWorldImages(params) {
        return API.call(`file/${params.fileId}`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // API.$emit('WORLDIMAGE:GET', args);
            return args;
        });
    }
};

export default imageReq;
