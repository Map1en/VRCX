// MOCK RUNTIME ONLY
// Fake WebSocket event source for friend presence testing in browser mode.

import { getMockFriends } from './api';
import { MOCK_WS_CONFIG } from './config';

let friendIndex = 0;
let eventIndex = 0;
let scenarioIndex = 0;

function getOnlineLocations() {
    return getMockFriends()
        .filter((friend) => friend.location && friend.location !== 'offline')
        .map((friend) => friend.location);
}

function getNextLocation(seed) {
    const locations = getOnlineLocations();
    if (locations.length === 0) {
        return 'offline';
    }
    return locations[seed % locations.length];
}

function cloneFriendPayload(friend) {
    return {
        ...friend
    };
}

function buildFriendUpdate(friend) {
    return {
        type: 'friend-location',
        content: {
            userId: friend.id,
            location: friend.location,
            user: {
                ...cloneFriendPayload(friend)
            }
        }
    };
}

function buildFriendOnline(friend) {
    return {
        type: 'friend-online',
        content: {
            userId: friend.id,
            platform: friend.platform,
            location: friend.location,
            worldId: friend.location.split(':')[0],
            travelingToLocation: friend.travelingToLocation,
            user: {
                ...cloneFriendPayload(friend)
            }
        }
    };
}

function buildFriendOffline(friend) {
    return {
        type: 'friend-offline',
        content: {
            userId: friend.id,
            platform: friend.platform
        }
    };
}

function buildFriendActive(friend) {
    return {
        type: 'friend-active',
        content: {
            userId: friend.id,
            platform: friend.platform || 'standalonewindows',
            user: {
                ...cloneFriendPayload(friend)
            }
        }
    };
}

function buildFriendProfileUpdate(friend) {
    return {
        type: 'friend-update',
        content: {
            userId: friend.id,
            user: {
                ...cloneFriendPayload(friend)
            }
        }
    };
}

function chooseEventType() {
    const weightedEvents = [
        ['friend-location', MOCK_WS_CONFIG.locationWeight],
        ['friend-online', MOCK_WS_CONFIG.onlineWeight],
        ['friend-offline', MOCK_WS_CONFIG.offlineWeight],
        ['friend-update', MOCK_WS_CONFIG.updateWeight],
        ['friend-active', MOCK_WS_CONFIG.activeWeight]
    ].filter(([, weight]) => weight > 0);

    if (weightedEvents.length === 0) {
        return 'friend-location';
    }
    const totalWeight = weightedEvents.reduce(
        (sum, [, weight]) => sum + weight,
        0
    );
    let cursor = eventIndex % totalWeight;
    eventIndex += 1;
    for (const [type, weight] of weightedEvents) {
        if (cursor < weight) {
            return type;
        }
        cursor -= weight;
    }
    return weightedEvents[0][0];
}

function mutateFriendForEvent(friend, eventType) {
    const nextLocation = getNextLocation(friendIndex + eventIndex);
    switch (eventType) {
        case 'friend-online':
            friend.state = 'online';
            friend.platform = friend.platform || 'standalonewindows';
            friend.last_platform = friend.platform;
            friend.location = nextLocation;
            friend.travelingToLocation = '';
            friend.status = 'join me';
            friend.statusDescription = 'WS mock online';
            return buildFriendOnline(friend);
        case 'friend-offline':
            friend.state = 'offline';
            friend.location = 'offline';
            friend.travelingToLocation = 'offline';
            friend.status = 'busy';
            friend.statusDescription = 'WS mock offline';
            return buildFriendOffline(friend);
        case 'friend-update':
            friend.statusDescription = `WS update ${eventIndex}`;
            friend.bio = `Mock friend update ${eventIndex}`;
            return buildFriendProfileUpdate(friend);
        case 'friend-active':
            friend.state = 'active';
            friend.location = 'offline';
            friend.travelingToLocation = 'offline';
            friend.status = 'active';
            friend.statusDescription = 'WS mock active';
            return buildFriendActive(friend);
        case 'friend-location':
        default:
            friend.state = 'online';
            friend.platform = friend.platform || 'standalonewindows';
            friend.last_platform = friend.platform;
            friend.location = nextLocation;
            friend.travelingToLocation =
                eventIndex % 5 === 0
                    ? getNextLocation(friendIndex + eventIndex + 3)
                    : '';
            friend.statusDescription = `WS move ${eventIndex}`;
            return buildFriendUpdate(friend);
    }
}

function chooseScenarioType() {
    const weightedScenarios = [
        ['cluster', MOCK_WS_CONFIG.clusterWeight],
        ['split', MOCK_WS_CONFIG.splitWeight],
        ['chaos', MOCK_WS_CONFIG.chaosWeight]
    ].filter(([, weight]) => weight > 0);

    if (weightedScenarios.length === 0) {
        return '';
    }

    const totalWeight = weightedScenarios.reduce(
        (sum, [, weight]) => sum + weight,
        0
    );
    let cursor = scenarioIndex % totalWeight;
    scenarioIndex += 1;
    for (const [type, weight] of weightedScenarios) {
        if (cursor < weight) {
            return type;
        }
        cursor -= weight;
    }
    return weightedScenarios[0][0];
}

function takeFriendCohort(friends) {
    const cohort = [];
    const size = Math.min(
        Math.max(2, MOCK_WS_CONFIG.cohortSize),
        Math.max(2, friends.length)
    );
    for (let i = 0; i < size; i += 1) {
        cohort.push(friends[(friendIndex + i) % friends.length]);
    }
    friendIndex += size;
    return cohort;
}

function setOnlinePresence(friend, location, statusDescription) {
    friend.state = 'online';
    friend.platform = friend.platform || 'standalonewindows';
    friend.last_platform = friend.platform;
    friend.location = location;
    friend.travelingToLocation = '';
    friend.status = 'join me';
    friend.statusDescription = statusDescription;
}

function createClusterScenario(friends) {
    const cohort = takeFriendCohort(friends);
    const location = getNextLocation(eventIndex + cohort.length + 11);
    return cohort.map((friend, index) => {
        setOnlinePresence(
            friend,
            location,
            `WS cluster ${scenarioIndex}-${index + 1}`
        );
        if (index === 0) {
            friend.state = 'active';
            friend.status = 'active';
            return buildFriendActive(friend);
        }
        return buildFriendUpdate(friend);
    });
}

function createSplitScenario(friends) {
    const cohort = takeFriendCohort(friends);
    const originLocation = getNextLocation(eventIndex + 17);
    const exitLocation = getNextLocation(eventIndex + 29);
    return cohort.map((friend, index) => {
        if (index === 0) {
            setOnlinePresence(friend, originLocation, 'WS split anchor');
            return buildFriendUpdate(friend);
        }
        if (index === 1) {
            setOnlinePresence(friend, exitLocation, 'WS split hop');
            friend.travelingToLocation = getNextLocation(eventIndex + 31);
            return buildFriendUpdate(friend);
        }
        if (index % 2 === 0) {
            friend.state = 'offline';
            friend.location = 'offline';
            friend.travelingToLocation = 'offline';
            friend.status = 'busy';
            friend.statusDescription = 'WS split red light';
            return buildFriendOffline(friend);
        }
        setOnlinePresence(friend, originLocation, 'WS split regroup');
        return buildFriendOnline(friend);
    });
}

function createChaosScenario(friends) {
    const cohort = takeFriendCohort(friends);
    const sharedLocation = getNextLocation(eventIndex + 43);
    const farLocation = getNextLocation(eventIndex + 71);
    const burst = [];
    const [a, b, c] = cohort;

    if (a) {
        setOnlinePresence(a, sharedLocation, 'WS chaos same-instance');
        burst.push(buildFriendUpdate(a));
    }
    if (b) {
        setOnlinePresence(b, sharedLocation, 'WS chaos same-instance');
        burst.push(buildFriendUpdate(b));
        setOnlinePresence(b, farLocation, 'WS chaos jump');
        b.travelingToLocation = '';
        burst.push(buildFriendUpdate(b));
    }
    if (a) {
        a.state = 'offline';
        a.location = 'offline';
        a.travelingToLocation = 'offline';
        a.status = 'busy';
        a.statusDescription = 'WS chaos red light';
        burst.push(buildFriendOffline(a));
    }
    if (c) {
        c.state = 'active';
        c.location = 'offline';
        c.travelingToLocation = 'offline';
        c.platform = c.platform || 'standalonewindows';
        c.last_platform = c.platform;
        c.status = 'active';
        c.statusDescription = 'WS chaos focus';
        burst.push(buildFriendActive(c));
    }

    return burst;
}

function createScenarioBurst(friends) {
    const scenarioType = chooseScenarioType();
    switch (scenarioType) {
        case 'cluster':
            return createClusterScenario(friends);
        case 'split':
            return createSplitScenario(friends);
        case 'chaos':
            return createChaosScenario(friends);
        default:
            return [];
    }
}

export function createMockWebSocketLifecycle({ onMessage }) {
    let timerId = null;
    let isClosed = false;

    function tick() {
        if (isClosed) {
            return;
        }
        const friends = getMockFriends();
        if (friends.length > 0) {
            const burst = createScenarioBurst(friends);
            if (burst.length > 0) {
                for (const event of burst) {
                    onMessage(event);
                }
            } else {
                for (let i = 0; i < MOCK_WS_CONFIG.batchSize; i += 1) {
                    const friend = friends[friendIndex % friends.length];
                    friendIndex += 1;
                    onMessage(mutateFriendForEvent(friend, chooseEventType()));
                }
            }
        }
        timerId = window.setTimeout(tick, MOCK_WS_CONFIG.intervalMs);
    }

    return {
        open() {
            isClosed = false;
            tick();
        },
        close() {
            isClosed = true;
            if (timerId !== null) {
                window.clearTimeout(timerId);
                timerId = null;
            }
        }
    };
}
