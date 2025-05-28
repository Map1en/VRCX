import { $app } from '../app.js';
import database from '../service/database.js';

export default function init(app) {
    const _methods = {
        async migrateMemos() {
            var json = JSON.parse(await VRCXStorage.GetAll());
            for (var line in json) {
                if (line.substring(0, 8) === 'memo_usr') {
                    var userId = line.substring(5);
                    var memo = json[line];
                    if (memo) {
                        await this.saveUserMemo(userId, memo);
                        VRCXStorage.Remove(`memo_${userId}`);
                    }
                }
            }
        },

        async getUserMemo(userId) {
            try {
                return await database.getUserMemo(userId);
            } catch (err) {
                console.error(err);
                return {
                    userId: '',
                    editedAt: '',
                    memo: ''
                };
            }
        },

        async saveUserMemo(id, memo) {
            if (memo) {
                await database.setUserMemo({
                    userId: id,
                    editedAt: new Date().toJSON(),
                    memo
                });
            } else {
                await database.deleteUserMemo(id);
            }
            var ref = this.store.friend.friends.get(id);
            if (ref) {
                ref.memo = String(memo || '');
                if (memo) {
                    var array = memo.split('\n');
                    ref.$nickName = array[0];
                } else {
                    ref.$nickName = '';
                }
            }
        },

        async getAllUserMemos() {
            var memos = await database.getAllUserMemos();
            memos.forEach((memo) => {
                var ref = $app.store.friend.friends.get(memo.userId);
                if (typeof ref !== 'undefined') {
                    ref.memo = memo.memo;
                    ref.$nickName = '';
                    if (memo.memo) {
                        var array = memo.memo.split('\n');
                        ref.$nickName = array[0];
                    }
                }
            });
        },

        async getWorldMemo(worldId) {
            try {
                return await database.getWorldMemo(worldId);
            } catch (err) {
                console.error(err);
                return {
                    worldId: '',
                    editedAt: '',
                    memo: ''
                };
            }
        },

        async getAvatarMemo(avatarId) {
            try {
                return await database.getAvatarMemoDB(avatarId);
            } catch (err) {
                console.error(err);
                return {
                    avatarId: '',
                    editedAt: '',
                    memo: ''
                };
            }
        }
    };

    app.data = { ...app.data, ..._methods };
}
