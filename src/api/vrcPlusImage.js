import { API } from '../app';

const vrcPlusImageReq = {
    uploadGalleryImage(imageData) {
        const params = {
            tag: 'gallery'
        };
        return API.call('file/image', {
            uploadImage: true,
            matchingDimensions: false,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('GALLERYIMAGE:ADD', args);
            return args;
        });
    },

    uploadSticker(imageData, params) {
        return API.call('file/image', {
            uploadImage: true,
            matchingDimensions: true,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('STICKER:ADD', args);
            return args;
        });
    },

    getPrints(params) {
        return API.call(`prints/user/${API.currentUser.id}`, {
            method: 'GET',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('PRINT:LIST', args);
            return args;
        });
    },

    deletePrint(printId) {
        return API.call(`prints/${printId}`, {
            method: 'DELETE'
        }).then((json) => {
            const args = {
                json,
                printId
            };
            // API.$emit('PRINT:DELETE', args);
            return args;
        });
    },

    uploadPrint(imageData, cropWhiteBorder, params) {
        return API.call('prints', {
            uploadImagePrint: true,
            cropWhiteBorder,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('PRINT:ADD', args);
            return args;
        });
    },

    getPrint(params) {
        return API.call(`prints/${params.printId}`, {
            method: 'GET'
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('PRINT', args);
            return args;
        });
    },

    uploadEmoji(imageData, params) {
        return API.call('file/image', {
            uploadImage: true,
            matchingDimensions: true,
            postData: JSON.stringify(params),
            imageData
        }).then((json) => {
            const args = {
                json,
                params
            };
            API.$emit('EMOJI:ADD', args);
            return args;
        });
    }

    // ----------- no place uses this function ------------

    // editPrint(params) {
    //     return API.call(`prints/${params.printId}`, {
    //         method: 'POST',
    //         params
    //     }).then((json) => {
    //         const args = {
    //             json,
    //             params
    //         };
    //         API.$emit('PRINT:EDIT', args);
    //         return args;
    //     });
    // },
};

export default vrcPlusImageReq;
