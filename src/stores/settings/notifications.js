import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import configRepository from '../../service/config';

export const useNotificationsStore = defineStore('NotificationsStore', () => {
    const state = reactive({
        overlayToast: true
    });

    async function initSettings() {
        const [overlayToast] = await Promise.all([
            configRepository.getString('VRCX_overlayToast', 'Game Running')
        ]);
        state.overlayToast = overlayToast;
    }

    const overlayToast = computed(() => state.overlayToast);

    function setOverlayToast(value) {
        state.overlayToast = value;
        configRepository.setString('VRCX_overlayToast', value);
    }

    return {
        state,
        initSettings,

        overlayToast,

        setOverlayToast
    };
});
