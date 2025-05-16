import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../service/config';

export const useVRCXUpdaterStore = defineStore('VRCXUpdater', () => {
    const state = reactive({
        appVersion: '',
        autoUpdateVRCX: 'Auto Download',
        latestAppVersion: '',
        branch: 'Stable',
        vrcxId: '',
        checkingForVRCXUpdate: false,
        VRCXUpdateDialog: {
            visible: false,
            updatePending: false,
            updatePendingIsLatest: false,
            release: '',
            releases: [],
            json: {}
        }
    });

    async function initSettings() {
        const [autoUpdateVRCX, vrcxId] = await Promise.all([
            configRepository.getString('VRCX_autoUpdateVRCX', 'Auto Download'),
            configRepository.getString('VRCX_id', '')
        ]);

        if (autoUpdateVRCX === 'Auto Install') {
            state.autoUpdateVRCX = 'Auto Download';
        } else {
            state.autoUpdateVRCX = autoUpdateVRCX;
        }

        state.appVersion = await AppApi.GetVersion();
        state.vrcxId = vrcxId;

        await initBranch();
        await loadVrcxId();
    }

    const appVersion = computed(() => state.appVersion);
    const autoUpdateVRCX = computed(() => state.autoUpdateVRCX);
    const latestAppVersion = computed(() => state.latestAppVersion);
    const branch = computed(() => state.branch);
    const currentVersion = computed(() =>
        state.appVersion.replace(' (Linux)', '')
    );
    const vrcxId = computed(() => state.vrcxId);
    const checkingForVRCXUpdate = computed({
        get: () => state.checkingForVRCXUpdate,
        set: (value) => {
            state.checkingForVRCXUpdate = value;
        }
    });
    const VRCXUpdateDialog = computed({
        get: () => state.VRCXUpdateDialog,
        set: (value) => {
            state.VRCXUpdateDialog = { ...state.VRCXUpdateDialog, ...value };
        }
    });

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
    async function loadVrcxId() {
        if (!state.vrcxId) {
            state.vrcxId = crypto.randomUUID();
            await configRepository.setString('VRCX_id', state.vrcxId);
        }
    }

    return {
        state,
        initSettings,

        appVersion,
        autoUpdateVRCX,
        latestAppVersion,
        branch,
        currentVersion,
        vrcxId,
        checkingForVRCXUpdate,
        VRCXUpdateDialog,

        setAutoUpdateVRCX,
        setLatestAppVersion,
        setBranch,

        compareAppVersion
    };
});
