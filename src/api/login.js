const loginReq = {
    /**
     * @param {{ code: string }} params One-time password
     * @returns {Promise<{json: any, params}>}
     */
    verifyOTP(params) {
        return window.API.call('auth/twofactorauth/otp/verify', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // window.API.$emit('OTP', args);
            return args;
        });
    },

    /**
     * @param {{ code: string }} params One-time token
     * @returns {Promise<{json: any, params}>}
     */
    verifyTOTP(params) {
        return window.API.call('auth/twofactorauth/totp/verify', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // window.API.$emit('TOTP', args);
            return args;
        });
    },

    /**
     * @param {{ code: string }} params One-time token
     * @returns {Promise<{json: any, params}>}
     */
    verifyEmailOTP(params) {
        return window.API.call('auth/twofactorauth/emailotp/verify', {
            method: 'POST',
            params
        }).then((json) => {
            const args = {
                json,
                params
            };
            // window.API.$emit('EMAILOTP', args);
            return args;
        });
    }
};

export default loginReq;
