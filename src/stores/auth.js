import Noty from 'noty';
import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { $app, $t, API } from '../app';
import configRepository from '../service/config';
import security from '../service/security';
import webApiService from '../service/webapi';
import { escapeTag } from '../shared/utils';
import { useFriendStore } from './friend';
import { useNotificationStore } from './notification';
import { useAdvancedSettingsStore } from './settings/advanced';

export const useAuthStore = defineStore('Auth', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const notificationStore = useNotificationStore();
    const friendStore = useFriendStore();
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
        },
        enablePrimaryPasswordDialog: {
            visible: false,
            password: '',
            rePassword: '',
            beforeClose(done) {
                $app._data.enablePrimaryPassword = false;
                done();
            }
        },
        saveCredentials: null,
        twoFactorAuthDialogVisible: false
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

    const enablePrimaryPasswordDialog = computed({
        get: () => state.enablePrimaryPasswordDialog,
        set: (value) => {
            state.enablePrimaryPasswordDialog = value;
        }
    });

    const saveCredentials = computed({
        get: () => state.saveCredentials,
        set: (value) => {
            state.saveCredentials = value;
        }
    });

    const twoFactorAuthDialogVisible = computed({
        get: () => state.twoFactorAuthDialogVisible,
        set: (value) => {
            state.twoFactorAuthDialogVisible = value;
        }
    });

    API.$on('LOGOUT', function () {
        if (API.isLoggedIn) {
            new Noty({
                type: 'success',
                text: `See you again, <strong>${escapeTag(
                    API.currentUser.displayName
                )}</strong>!`
            }).show();
        }
        API.isLoggedIn = false;
        friendStore.friendLogInitStatus = false;
        notificationStore.notificationInitStatus = false;
    });

    API.$on('LOGIN', function (args) {
        new Noty({
            type: 'success',
            text: `Hello there, <strong>${escapeTag(
                args.ref.displayName
            )}</strong>!`
        }).show();
        updateStoredUser(API.currentUser);
    });

    API.$on('LOGOUT', async function () {
        await updateStoredUser(API.currentUser);
        webApiService.clearCookies();
        state.loginForm.lastUserLoggedIn = '';
        await configRepository.remove('lastUserLoggedIn');
        // workerTimers.setTimeout(() => location.reload(), 500);
    });

    API.$on('LOGIN', function () {
        state.twoFactorAuthDialogVisible = false;
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

    function enablePrimaryPasswordChange() {
        advancedSettingsStore.enablePrimaryPassword =
            !advancedSettingsStore.enablePrimaryPassword;

        state.enablePrimaryPasswordDialog.password = '';
        state.enablePrimaryPasswordDialog.rePassword = '';
        if (advancedSettingsStore.enablePrimaryPassword) {
            state.enablePrimaryPasswordDialog.visible = true;
        } else {
            $app.$prompt(
                $t('prompt.primary_password.description'),
                $t('prompt.primary_password.header'),
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({ value }) => {
                    for (const userId in state.loginForm.savedCredentials) {
                        security
                            .decrypt(
                                state.loginForm.savedCredentials[userId]
                                    .loginParmas.password,
                                value
                            )
                            .then(async (pt) => {
                                state.saveCredentials = {
                                    username:
                                        state.loginForm.savedCredentials[userId]
                                            .loginParmas.username,
                                    password: pt
                                };
                                await updateStoredUser(
                                    state.loginForm.savedCredentials[userId]
                                        .user
                                );
                                await configRepository.setBool(
                                    'enablePrimaryPassword',
                                    false
                                );
                            })
                            .catch(async () => {
                                advancedSettingsStore.enablePrimaryPassword = true;
                                advancedSettingsStore.setEnablePrimaryPasswordConfigRepository(
                                    true
                                );
                            });
                    }
                })
                .catch(async () => {
                    advancedSettingsStore.enablePrimaryPassword = true;
                    advancedSettingsStore.setEnablePrimaryPasswordConfigRepository(
                        true
                    );
                });
        }
    }
    async function setPrimaryPassword() {
        await configRepository.setBool(
            'enablePrimaryPassword',
            advancedSettingsStore.enablePrimaryPassword
        );
        state.enablePrimaryPasswordDialog.visible = false;
        if (advancedSettingsStore.enablePrimaryPassword) {
            const key = state.enablePrimaryPasswordDialog.password;
            for (const userId in state.loginForm.savedCredentials) {
                security
                    .encrypt(
                        state.loginForm.savedCredentials[userId].loginParmas
                            .password,
                        key
                    )
                    .then((ct) => {
                        state.saveCredentials = {
                            username:
                                state.loginForm.savedCredentials[userId]
                                    .loginParmas.username,
                            password: ct
                        };
                        updateStoredUser(
                            state.loginForm.savedCredentials[userId].user
                        );
                    });
            }
        }
    }

    async function updateStoredUser(user) {
        let savedCredentials = {};
        if ((await configRepository.getString('savedCredentials')) !== null) {
            savedCredentials = JSON.parse(
                await configRepository.getString('savedCredentials')
            );
        }
        if (state.saveCredentials) {
            const credentialsToSave = {
                user,
                loginParmas: state.saveCredentials
            };
            savedCredentials[user.id] = credentialsToSave;
            state.saveCredentials = null;
        } else if (typeof savedCredentials[user.id] !== 'undefined') {
            savedCredentials[user.id].user = user;
            savedCredentials[user.id].cookies =
                await webApiService.getCookies();
        }
        state.loginForm.savedCredentials = savedCredentials;
        const jsonCredentialsArray = JSON.stringify(savedCredentials);
        await configRepository.setString(
            'savedCredentials',
            jsonCredentialsArray
        );
        state.loginForm.lastUserLoggedIn = user.id;
        await configRepository.setString('lastUserLoggedIn', user.id);
    }

    async function migrateStoredUsers() {
        let savedCredentials = {};
        if ((await configRepository.getString('savedCredentials')) !== null) {
            savedCredentials = JSON.parse(
                await configRepository.getString('savedCredentials')
            );
        }
        for (const name in savedCredentials) {
            const userId = savedCredentials[name]?.user?.id;
            if (userId && userId !== name) {
                savedCredentials[userId] = savedCredentials[name];
                delete savedCredentials[name];
            }
        }
        await configRepository.setString(
            'savedCredentials',
            JSON.stringify(savedCredentials)
        );
    }

    function checkPrimaryPassword(args) {
        return new Promise((resolve, reject) => {
            if (!advancedSettingsStore.enablePrimaryPassword) {
                resolve(args.password);
            }
            $app.$prompt(
                $t('prompt.primary_password.description'),
                $t('prompt.primary_password.header'),
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({ value }) => {
                    security
                        .decrypt(args.password, value)
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    return {
        state,
        loginForm,
        enablePrimaryPasswordDialog,
        saveCredentials,
        twoFactorAuthDialogVisible,

        clearCookiesTryLogin,
        resendEmail2fa,
        enablePrimaryPasswordChange,
        setPrimaryPassword,
        updateStoredUser,
        migrateStoredUsers,
        checkPrimaryPassword
    };
});
