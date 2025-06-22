import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';
import { $app } from '../app';
import { useNotificationStore } from './notification';

export const useUiStore = defineStore('Ui', () => {
    const notificationStore = useNotificationStore();
    const state = reactive({
        menuActiveIndex: 'feed'
    });

    const menuActiveIndex = computed({
        get: () => state.menuActiveIndex,
        set: (value) => {
            state.menuActiveIndex = value;
        }
    });

    function notifyMenu(index) {
        const navRef = $app.$refs.menu.$children[0];
        if (state.menuActiveIndex !== index) {
            const item = navRef.items[index];
            if (item) {
                item.$el.classList.add('notify');
            }
        }
    }

    function selectMenu(index) {
        state.menuActiveIndex = index;
        const item = $app.$refs.menu.$children[0]?.items[index];
        if (item) {
            item.$el.classList.remove('notify');
        }
        if (index === 'notification') {
            notificationStore.unseenNotifications = [];
        }
    }

    return { state, menuActiveIndex, notifyMenu, selectMenu };
});
