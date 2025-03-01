// Note: API user methods
// Use windows.API for now, sees no problem with that. I'll test each one.
// Future refactor may be needed.

import userRequest from './user';
import worldRequest from './world';
import instanceRequest from './instance';
import friendRequest from './friend';
import avatarRequest from './avatar';
import notificationRequest from './notification';

export {
    userRequest,
    worldRequest,
    instanceRequest,
    friendRequest,
    avatarRequest,
    notificationRequest
};
