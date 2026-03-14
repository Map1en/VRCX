# Mock Runtime

Use `npm run dev-mock` to start the frontend in mock mode.

This mode does not use the real Electron/.NET backend and should not touch the default VRCX config directory, database, or log watcher data.

For a heavy friend dataset preset, use `npm run dev-mock-large`.
The central mock configuration lives in [`src/mocks/config.js`](/home/pa/code/VRCX/src/mocks/config.js), and a ready-to-edit env example lives at [`.env.mock.example`](/home/pa/code/VRCX/.env.mock.example).

## Test Login

- Username: `mock`
- Password: `mock`

## What Is Mocked

- `AppApi`: in-memory / stubbed responses
- `VRCXStorage`: in-memory key/value store
- `SQLite`: in-memory config table shim
- `WebApi`: mock HTTP responses from [`src/mocks/api.js`](/home/pa/code/VRCX/src/mocks/api.js)
- `LogWatcher`: live mock game log stream from [`src/mocks/gameLog.js`](/home/pa/code/VRCX/src/mocks/gameLog.js)
- `Discord`: no-op
- `AssetBundleManager`: no-op
- WebSocket: fake friend activity events from [`src/mocks/websocket.js`](/home/pa/code/VRCX/src/mocks/websocket.js)
- Floating controls: browser-only mock tuning panel from [`src/mocks/MockRuntimeControls.vue`](/home/pa/code/VRCX/src/mocks/MockRuntimeControls.vue)

## Current Scope

- Login page
- Mock current user
- Mock friend list and user detail
- Mock worlds preload and world detail
- Mock groups, represented group, and basic group member data
- Mock live game log / player list activity
- Mock player and avatar moderation samples
- Mock current user edits such as status/avatar changes
- Mock user/group/world/avatar search and common notification/invite action endpoints
- Minimal favorite/status/file/persist responses to let the app initialize

## Scaling

- `VITE_MOCK_FRIEND_COUNT`
- `VITE_MOCK_GROUP_COUNT`
- `VITE_MOCK_WORLD_COUNT`
- `VITE_MOCK_AVATAR_COUNT`
- `VITE_MOCK_INSTANCE_COUNT`
- `VITE_MOCK_ONLINE_RATIO`
- `VITE_MOCK_ACTIVE_RATIO`
- `VITE_MOCK_TRAVELING_RATIO`
- `VITE_MOCK_WS_INTERVAL_MS`
- `VITE_MOCK_WS_BATCH_SIZE`
- `VITE_MOCK_WS_LOCATION_WEIGHT`
- `VITE_MOCK_WS_ONLINE_WEIGHT`
- `VITE_MOCK_WS_OFFLINE_WEIGHT`
- `VITE_MOCK_WS_UPDATE_WEIGHT`
- `VITE_MOCK_WS_ACTIVE_WEIGHT`
- `VITE_MOCK_WS_COHORT_SIZE`
- `VITE_MOCK_WS_CLUSTER_WEIGHT`
- `VITE_MOCK_WS_SPLIT_WEIGHT`
- `VITE_MOCK_WS_CHAOS_WEIGHT`
- `VITE_MOCK_LOG_INTERVAL_MS`
- `VITE_MOCK_LOG_BATCH_SIZE`
- `VITE_MOCK_LOG_MIN_PLAYERS`
- `VITE_MOCK_LOG_MAX_PLAYERS`
- `VITE_MOCK_LOG_JOIN_WEIGHT`
- `VITE_MOCK_LOG_LEAVE_WEIGHT`
- `VITE_MOCK_LOG_AVATAR_WEIGHT`
- `VITE_MOCK_LOG_PORTAL_WEIGHT`
- `VITE_MOCK_LOG_VIDEO_WEIGHT`
- `VITE_MOCK_LOG_PHOTON_WEIGHT`
- `VITE_MOCK_LOG_STICKER_WEIGHT`
- `VITE_MOCK_LOG_TRAVEL_WEIGHT`

Example:

```bash
VITE_MOCK_RUNTIME=1 \
VITE_MOCK_FRIEND_COUNT=10000 \
VITE_MOCK_GROUP_COUNT=64 \
VITE_MOCK_WORLD_COUNT=180 \
VITE_MOCK_AVATAR_COUNT=320 \
VITE_MOCK_INSTANCE_COUNT=320 \
VITE_MOCK_WS_INTERVAL_MS=1000 \
VITE_MOCK_WS_BATCH_SIZE=3 \
npm run dev-linux
```

## Notes

- Use `dev-mock`, not `dev-linux`, when you want isolation from real local data.
- The mock runtime is intended for frontend debugging and later browser E2E, not backend integration testing.
- Some actions are intentionally no-op success responses so the UI can be exercised without touching real services.
- Saved accounts in mock mode now persist in browser local storage and still do not touch the real backend config or database directory.
- The floating `Mock` button in the lower-right corner lets you hot-tune WS and game log behavior. Dataset size changes are persisted and applied after reload.
