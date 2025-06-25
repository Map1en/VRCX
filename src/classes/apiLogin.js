import Noty from 'noty';
import { $app, t } from '../app.js';
import { request } from '../service/apiRequestHandler';
import configRepository from '../service/config.js';
import { API } from '../service/eventBus';
import security from '../service/security.js';

export default async function init() {
    API.isLoggedIn = false;
    API.attemptingAutoLogin = false;
    API.autoLoginAttempts = new Set();

    /**
     * @param {{ username: string, password: string }} params credential to login
     * @returns {Promise<{origin: boolean, json: any, params}>}
     */
    API.login = function (params) {
        let { username, password, saveCredentials, cipher } = params;
        username = encodeURIComponent(username);
        password = encodeURIComponent(password);
        const auth = btoa(`${username}:${password}`);
        if (saveCredentials) {
            delete params.saveCredentials;
            if (cipher) {
                params.password = cipher;
                delete params.cipher;
            }
            $app.store.auth.saveCredentials = params;
        }
        return request('auth/user', {
            method: 'GET',
            headers: {
                Authorization: `Basic ${auth}`
            }
        }).then((json) => {
            const args = {
                json,
                params,
                origin: true
            };
            if (
                json.requiresTwoFactorAuth &&
                json.requiresTwoFactorAuth.includes('emailOtp')
            ) {
                this.$emit('USER:EMAILOTP', args);
            } else if (json.requiresTwoFactorAuth) {
                this.$emit('USER:2FA', args);
            } else {
                this.$emit('USER:CURRENT', args);
            }
            return args;
        });
    };

    API.$on('AUTOLOGIN', function () {
        if (this.attemptingAutoLogin) {
            return;
        }
        this.attemptingAutoLogin = true;
        const user =
            $app.store.auth.loginForm.savedCredentials[
                $app.store.auth.loginForm.lastUserLoggedIn
            ];
        if (typeof user === 'undefined') {
            this.attemptingAutoLogin = false;
            return;
        }
        if ($app.store.advancedSettings.enablePrimaryPassword) {
            console.error(
                'Primary password is enabled, this disables auto login.'
            );
            this.attemptingAutoLogin = false;
            this.logout();
            return;
        }
        const attemptsInLastHour = Array.from(this.autoLoginAttempts).filter(
            (timestamp) => timestamp > new Date().getTime() - 3600000
        ).length;
        if (attemptsInLastHour >= 3) {
            console.error(
                'More than 3 auto login attempts within the past hour, logging out instead of attempting auto login.'
            );
            this.attemptingAutoLogin = false;
            this.logout();
            return;
        }
        this.autoLoginAttempts.add(new Date().getTime());
        $app.relogin(user)
            .then(() => {
                if (this.errorNoty) {
                    this.errorNoty.close();
                }
                this.errorNoty = new Noty({
                    type: 'success',
                    text: 'Automatically logged in.'
                }).show();
                console.log('Automatically logged in.');
            })
            .catch((err) => {
                if (this.errorNoty) {
                    this.errorNoty.close();
                }
                this.errorNoty = new Noty({
                    type: 'error',
                    text: 'Failed to login automatically.'
                }).show();
                console.error('Failed to login automatically.', err);
            })
            .finally(() => {
                if (!navigator.onLine) {
                    this.errorNoty = new Noty({
                        type: 'error',
                        text: `You're offline.`
                    }).show();
                    console.error(`You're offline.`);
                }
            });
    });

    API.$on('USER:CURRENT', function () {
        this.attemptingAutoLogin = false;
    });

    API.$on('LOGOUT', function () {
        this.attemptingAutoLogin = false;
        this.autoLoginAttempts.clear();
    });

    API.logout = function () {
        this.$emit('LOGOUT');
        // return request('logout', {
        //     method: 'PUT'
        // }).finally(() => {
        //     this.$emit('LOGOUT');
        // });
    };

    const _methods = {
        async relogin(user) {
            const { loginParmas } = user;
            if (user.cookies) {
                await webApiService.setCookies(user.cookies);
            }
            this.store.auth.loginForm.lastUserLoggedIn = user.user.id; // for resend email 2fa
            if (loginParmas.endpoint) {
                API.endpointDomain = loginParmas.endpoint;
                API.websocketDomain = loginParmas.websocket;
            } else {
                API.endpointDomain = API.endpointDomainVrchat;
                API.websocketDomain = API.websocketDomainVrchat;
            }
            return new Promise((resolve, reject) => {
                this.store.auth.loginForm.loading = true;
                if (this.store.advancedSettings.enablePrimaryPassword) {
                    this.store.auth
                        .checkPrimaryPassword(loginParmas)
                        .then((pwd) => {
                            return API.getConfig()
                                .catch((err) => {
                                    reject(err);
                                })
                                .then(() => {
                                    API.login({
                                        username: loginParmas.username,
                                        password: pwd,
                                        cipher: loginParmas.password,
                                        endpoint: loginParmas.endpoint,
                                        websocket: loginParmas.websocket
                                    })
                                        .catch((err2) => {
                                            // API.logout();
                                            reject(err2);
                                        })
                                        .then(() => {
                                            resolve();
                                        });
                                });
                        })
                        .catch((_) => {
                            this.$message({
                                message: 'Incorrect primary password',
                                type: 'error'
                            });
                            reject(_);
                        });
                } else {
                    API.getConfig()
                        .catch((err) => {
                            reject(err);
                        })
                        .then(() => {
                            API.login({
                                username: loginParmas.username,
                                password: loginParmas.password,
                                endpoint: loginParmas.endpoint,
                                websocket: loginParmas.websocket
                            })
                                .catch((err2) => {
                                    API.logout();
                                    reject(err2);
                                })
                                .then(() => {
                                    resolve();
                                });
                        });
                }
            }).finally(() => (this.store.auth.loginForm.loading = false));
        },

        async deleteSavedLogin(userId) {
            const savedCredentials = JSON.parse(
                await configRepository.getString('savedCredentials')
            );
            delete savedCredentials[userId];
            // Disable primary password when no account is available.
            if (Object.keys(savedCredentials).length === 0) {
                this.store.advancedSettings.enablePrimaryPassword = false;
                this.store.advancedSettings.setEnablePrimaryPasswordConfigRepository(
                    false
                );
            }
            this.store.auth.loginForm.savedCredentials = savedCredentials;
            const jsonCredentials = JSON.stringify(savedCredentials);
            await configRepository.setString(
                'savedCredentials',
                jsonCredentials
            );
            new Noty({
                type: 'success',
                text: 'Account removed.'
            }).show();
        },

        async login() {
            await webApiService.clearCookies();
            if (!this.store.auth.loginForm.loading) {
                this.store.auth.loginForm.loading = true;
                if (this.store.auth.loginForm.endpoint) {
                    API.endpointDomain = this.store.auth.loginForm.endpoint;
                    API.websocketDomain = this.store.auth.loginForm.websocket;
                } else {
                    API.endpointDomain = API.endpointDomainVrchat;
                    API.websocketDomain = API.websocketDomainVrchat;
                }
                API.getConfig()
                    .catch((err) => {
                        this.store.auth.loginForm.loading = false;
                        throw err;
                    })
                    .then((args) => {
                        if (
                            this.store.auth.loginForm.saveCredentials &&
                            this.store.advancedSettings.enablePrimaryPassword
                        ) {
                            $app.$prompt(
                                t('prompt.primary_password.description'),
                                t('prompt.primary_password.header'),
                                {
                                    inputType: 'password',
                                    inputPattern: /[\s\S]{1,32}/
                                }
                            )
                                .then(({ value }) => {
                                    const saveCredential =
                                        this.store.auth.loginForm
                                            .savedCredentials[
                                            Object.keys(
                                                this.store.auth.loginForm
                                                    .savedCredentials
                                            )[0]
                                        ];
                                    security
                                        .decrypt(
                                            saveCredential.loginParmas.password,
                                            value
                                        )
                                        .then(() => {
                                            security
                                                .encrypt(
                                                    this.store.auth.loginForm
                                                        .password,
                                                    value
                                                )
                                                .then((pwd) => {
                                                    API.login({
                                                        username:
                                                            this.store.auth
                                                                .loginForm
                                                                .username,
                                                        password:
                                                            this.store.auth
                                                                .loginForm
                                                                .password,
                                                        endpoint:
                                                            this.store.auth
                                                                .loginForm
                                                                .endpoint,
                                                        websocket:
                                                            this.store.auth
                                                                .loginForm
                                                                .websocket,
                                                        saveCredentials:
                                                            this.store.auth
                                                                .loginForm
                                                                .saveCredentials,
                                                        cipher: pwd
                                                    });
                                                });
                                        });
                                })
                                .finally(() => {
                                    this.store.auth.loginForm.loading = false;
                                });
                            return args;
                        }
                        API.login({
                            username: this.store.auth.loginForm.username,
                            password: this.store.auth.loginForm.password,
                            endpoint: this.store.auth.loginForm.endpoint,
                            websocket: this.store.auth.loginForm.websocket,
                            saveCredentials:
                                this.store.auth.loginForm.saveCredentials
                        }).finally(() => {
                            this.store.auth.loginForm.loading = false;
                        });
                        return args;
                    });
            }
        },

        logout() {
            this.$confirm('Continue? Logout', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                callback: (action) => {
                    if (action === 'confirm') {
                        API.logout();
                    }
                }
            });
        }
    };

    $app.methods = { ...$app.methods, ..._methods };
}
