import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../service/config';

export const useVRCXUpdaterStore = defineStore('VRCXUpdater', () => {
    const state = reactive({
        appVersion: '',
        autoUpdateVRCX: 'Auto Download',
        latestAppVersion: '',
        branch: 'Stable'
    });

    async function initSettings() {
        const [autoUpdateVRCX] = await Promise.all([
            configRepository.getString('VRCX_autoUpdateVRCX', 'Auto Download')
        ]);

        if (autoUpdateVRCX === 'Auto Install') {
            state.autoUpdateVRCX = 'Auto Download';
        } else {
            state.autoUpdateVRCX = autoUpdateVRCX;
        }

        state.appVersion = await AppApi.GetVersion();
        // state.branch = branch;

        await initBranch();
    }

    const appVersion = computed(() => state.appVersion);
    const autoUpdateVRCX = computed(() => state.autoUpdateVRCX);
    const latestAppVersion = computed(() => state.latestAppVersion);
    const branch = computed(() => state.branch);
    const currentVersion = computed(() =>
        state.appVersion.replace(' (Linux)', '')
    );

    async function setAutoUpdateVRCX(value) {
        state.autoUpdateVRCX = value;
        await configRepository.setString('VRCX_autoUpdateVRCX', value);
    }
    function setLatestAppVersion(value) {
        state.latestAppVersion = value;
    }
    function setBranch(value) {
        state.branch = value;
        configRepository.setString('VRCX_branch', value);
    }

    async function initBranch() {
        if (!state.appVersion) {
            return;
        }
        if (currentVersion.value.includes('VRCX Nightly')) {
            state.branch = 'Nightly';
        } else {
            state.branch = 'Stable';
        }
        await configRepository.setString('VRCX_branch', state.branch);
    }

    async function compareAppVersion() {
        const lastVersion = await configRepository.getString(
            'VRCX_lastVRCXVersion',
            ''
        );
        if (lastVersion !== currentVersion.value) {
            await configRepository.setString(
                'VRCX_lastVRCXVersion',
                currentVersion
            );
            return state.branch === 'Stable' && !!lastVersion;
        }
        return false;
    }

    return {
        state,
        initSettings,

        appVersion,
        autoUpdateVRCX,
        latestAppVersion,
        branch,
        currentVersion,

        setAutoUpdateVRCX,
        setLatestAppVersion,
        setBranch,

        compareAppVersion
    };
});
