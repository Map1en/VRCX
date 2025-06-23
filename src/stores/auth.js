import Noty from 'noty';
import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { $app } from '../app';
import API from '../classes/apiInit';
import configRepository from '../service/config';
import webApiService from '../service/webapi';

export const useAuthStore = defineStore('Auth', () => {
    const state = reactive({
        loginForm: {
            loading: true,
            username: '',
            password: '',
            endpoint: '',
            websocket: '',
            saveCredentials: false,
            savedCredentials: {},
            lastUserLoggedIn: '',
            rules: {
                username: [
                    {
                        required: true,
                        trigger: 'blur'
                    }
                ],
                password: [
                    {
                        required: true,
                        trigger: 'blur'
                    }
                ]
            }
        }
    });

    async function init() {
        const [savedCredentials, lastUserLoggedIn] = await Promise.all([
            configRepository.getString('savedCredentials'),
            configRepository.getString('lastUserLoggedIn')
        ]);
        state.loginForm = {
            ...state.loginForm,
            savedCredentials: savedCredentials
                ? JSON.parse(savedCredentials)
                : {},
            lastUserLoggedIn
        };
    }

    init();

    const loginForm = computed({
        get: () => state.loginForm,
        set: (value) => {
            state.loginForm = value;
        }
    });

    async function clearCookiesTryLogin() {
        await webApiService.clearCookies();
        if (state.loginForm.lastUserLoggedIn) {
            const user =
                state.loginForm.savedCredentials[
                    state.loginForm.lastUserLoggedIn
                ];
            if (typeof user !== 'undefined') {
                delete user.cookies;
                await $app.relogin(user);
            }
        }
    }

    async function resendEmail2fa() {
        if (state.loginForm.lastUserLoggedIn) {
            const user =
                state.loginForm.savedCredentials[
                    state.loginForm.lastUserLoggedIn
                ];
            if (typeof user !== 'undefined') {
                await webApiService.clearCookies();
                delete user.cookies;
                $app.relogin(user).then(() => {
                    new Noty({
                        type: 'success',
                        text: 'Email 2FA resent.'
                    }).show();
                });
                return;
            }
        }
        new Noty({
            type: 'error',
            text: 'Cannot send 2FA email without saved credentials. Please login again.'
        }).show();
    }

    API.$on('USER:2FA', function () {
        AppApi.FocusWindow();
        $app.promptTOTP();
    });

    API.$on('USER:EMAILOTP', function () {
        AppApi.FocusWindow();
        $app.promptEmailOTP();
    });

    return { state, loginForm, clearCookiesTryLogin, resendEmail2fa };
});
