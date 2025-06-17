import { API, $app } from '../app.js';
import { inventoryRequest } from '../api';

export default function init() {
    API.currentUserInventory = new Map();
    API.$on('LOGIN', function () {
        API.currentUserInventory.clear();
    });

    const _data = {
        inventoryTable: []
    };

    const _methods = {
        async getInventory() {
            this.inventoryTable = [];
            API.currentUserInventory.clear();
            var params = {
                n: 100,
                offset: 0,
                order: 'newest'
            };
            this.galleryDialogInventoryLoading = true;
            try {
                for (let i = 0; i < 100; i++) {
                    params.offset = i * params.n;
                    const args =
                        await inventoryRequest.getInventoryItems(params);
                    for (const item of args.json.data) {
                        API.currentUserInventory.set(item.id, item);
                        if (!item.flags.includes('ugc')) {
                            this.inventoryTable.push(item);
                        }
                    }
                    if (args.json.data.length === 0) {
                        break;
                    }
                }
            } catch (error) {
                console.error('Error fetching inventory items:', error);
            } finally {
                this.galleryDialogInventoryLoading = false;
            }
        }
    };

    $app.data = { ...$app.data, ..._data };
    $app.methods = { ...$app.methods, ..._methods };
}
