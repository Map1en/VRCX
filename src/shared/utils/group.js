import { API } from '../../app';
import { parseLocation } from './location';

function hasGroupPermission(ref, permission) {
    if (
        ref &&
        ref.myMember &&
        ref.myMember.permissions &&
        (ref.myMember.permissions.includes('*') ||
            ref.myMember.permissions.includes(permission))
    ) {
        return true;
    }
    return false;
}

async function getGroupName(data) {
    if (!data) {
        return '';
    }
    let groupName = '';
    let groupId = data;
    if (!data.startsWith('grp_')) {
        const L = parseLocation(data);
        groupId = L.groupId;
        if (!L.groupId) {
            return '';
        }
    }
    try {
        const args = await API.getCachedGroup({
            groupId
        });
        groupName = args.ref.name;
    } catch (err) {
        console.error(err);
    }
    return groupName;
}

export { hasGroupPermission, getGroupName };
