// MOCK RUNTIME ONLY
// Data generation and API handlers for browser-safe mock mode live in this file.

import { MOCK_CREDENTIALS, MOCK_DATA_CONFIG } from './config';

const MOCK_CURRENT_USER_ID = 'usr_mock_current';
const MOCK_GROUP_ID = 'grp_mock_vrcx';
const MOCK_IMAGE_URL = 'https://assets.vrchat.com/www/images/logo.png';

const worldNamePrefixes = [
    'Mock',
    'Benchmark',
    'Load',
    'Stress',
    'Debug',
    'Profile',
    'Latency',
    'Scale'
];
const worldNameSuffixes = [
    'Lounge',
    'Garden',
    'Hall',
    'Atrium',
    'Lab',
    'Harbor',
    'Station',
    'Arena'
];
const groupNamePrefixes = [
    'Mock',
    'Perf',
    'Scale',
    'Load',
    'Debug',
    'Graph',
    'Quest',
    'Builders'
];
const groupNameSuffixes = [
    'Builders',
    'Crew',
    'Ops',
    'Network',
    'Raid',
    'Union',
    'Guild',
    'Labs'
];

function padId(prefix, index, width = 4) {
    return `${prefix}${String(index + 1).padStart(width, '0')}`;
}

function makeLabel(prefixes, suffixes, index) {
    return `${prefixes[index % prefixes.length]} ${suffixes[Math.floor(index / prefixes.length) % suffixes.length]} ${index + 1}`;
}

function buildGroup(index) {
    const id = index === 0 ? MOCK_GROUP_ID : padId('grp_mock_', index);
    const ownerId =
        index % 4 === 0
            ? MOCK_CURRENT_USER_ID
            : `usr_mock_owner_${String(index + 1).padStart(4, '0')}`;
    const isRepresenting = index === 0;
    return {
        id,
        groupId: id,
        name: index === 0 ? 'Mock Builders' : makeLabel(groupNamePrefixes, groupNameSuffixes, index),
        ownerId,
        iconUrl: 'https://assets.vrchat.com/www/images/logo.png',
        bannerUrl: MOCK_IMAGE_URL,
        description: `Mock runtime group ${index + 1} focused on browser debug, world hopping, and large friend-list coverage.`,
        rules: `1. Keep logs enabled.\n2. Expect irregular joins, leaves, and world hops.\n3. Use for mock runtime verification only.`,
        shortCode: `M${String(index + 1).padStart(3, '0')}`,
        discriminator: String(index + 1).padStart(4, '0'),
        memberCount: 40 + (index % 9) * 35,
        onlineMemberCount: 5 + (index % 5) * 8,
        createdAt: `2026-01-${String((index % 27) + 1).padStart(2, '0')}T00:00:00.000Z`,
        updatedAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T12:00:00.000Z`,
        memberCountSyncedAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T12:00:00.000Z`,
        links:
            index % 3 === 0
                ? ['https://vrcx.app', 'https://docs.vrcx.app']
                : ['https://vrc.group'],
        languages: index % 4 === 0 ? ['eng', 'jpn'] : ['eng'],
        privacy: index % 5 === 0 ? 'default' : 'private',
        joinState:
            index % 6 === 0
                ? 'open'
                : index % 6 === 1
                  ? 'request'
                  : index % 6 === 2
                    ? 'invite'
                    : 'closed',
        isVerified: index % 6 === 0,
        iconId: `file_grp_icon_${index + 1}`,
        bannerId: `file_grp_banner_${index + 1}`,
        galleries: [
            {
                id: `gallery_${index + 1}_1`,
                name: 'Highlights',
                description: 'Mock runtime highlights',
                membersOnly: false
            },
            {
                id: `gallery_${index + 1}_2`,
                name: 'Staff',
                description: 'Members only captures',
                membersOnly: true,
                roleIdsToView: ['grol_owner', 'grol_mod']
            }
        ],
        membershipStatus: 'member',
        isRepresenting,
        roleIds: ['grol_owner'],
        roles: [
            {
                id: 'grol_owner',
                name: 'Owner',
                description: 'Mock owner',
                isManagementRole: true
            },
            {
                id: 'grol_mod',
                name: 'Moderator',
                description: 'Mock moderator',
                isManagementRole: true
            },
            {
                id: 'grol_member',
                name: 'Member',
                description: 'Mock member',
                isManagementRole: false
            }
        ],
        myMember: {
            roleIds: ['grol_owner'],
            visibility: index % 3 === 0 ? 'friends' : 'visible',
            isRepresenting,
            isSubscribedToAnnouncements: false,
            membershipStatus: 'member',
            permissions: [
                '*',
                'group-members-viewall',
                'group-members-manage',
                'group-members-remove',
                'group-roles-assign',
                'group-bans-manage',
                'group-audit-view',
                'group-instance-moderate',
                'group-gallery-manage',
                'group-announcement-manage'
            ]
        }
    };
}

const mockWorlds = Array.from({ length: MOCK_DATA_CONFIG.worldCount }, (_, index) => ({
    id: padId('wrld_mock_', index),
    name: makeLabel(worldNamePrefixes, worldNameSuffixes, index),
    description: `Mock world ${index + 1} for friend and instance testing`,
    authorId: index % 3 === 0 ? MOCK_CURRENT_USER_ID : `usr_mock_author_${String((index % 48) + 1).padStart(3, '0')}`,
    authorName: index % 3 === 0 ? 'Mock Current User' : `Mock Author ${String((index % 48) + 1).padStart(3, '0')}`,
    capacity: 32 + (index % 3) * 8,
    recommendedCapacity: 16 + (index % 2) * 8,
    tags:
        index % 9 === 1
            ? ['system_labs', `author_tag_performance`, `author_tag_social`]
            : [`author_tag_worlds`, index % 4 === 0 ? 'author_tag_community' : 'author_tag_events'],
    releaseStatus: index % 11 === 0 ? 'private' : 'public',
    imageUrl: MOCK_IMAGE_URL,
    thumbnailImageUrl: MOCK_IMAGE_URL,
    version: 1,
    previewYoutubeId: index % 10 === 0 ? 'dQw4w9WgXcQ' : '',
    favorites: 48 + (index % 32) * 7,
    created_at: `2026-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
    updated_at: `2026-03-${String((((13 - (index % 14)) + 14) % 14) + 1).padStart(2, '0')}T12:00:00.000Z`,
    labsPublicationDate:
        index % 9 === 1
            ? `2026-02-${String((index % 18) + 1).padStart(2, '0')}T09:00:00.000Z`
            : 'none',
    publicationDate:
        index % 6 === 0
            ? 'none'
            : `2026-03-${String((index % 18) + 1).padStart(2, '0')}T18:00:00.000Z`,
    visits: 260 + index * 11,
    popularity: 1 + (index % 8),
    heat: index % 6,
    occupants: 4 + (index % 18),
    unityPackages: [
        {
            assetUrl: `https://api.vrchat.cloud/api/1/file/file_world_pc_${index + 1}`,
            assetVersion: 1,
            created_at: `2026-03-${String((index % 18) + 1).padStart(2, '0')}T21:00:00.000Z`,
            platform: 'standalonewindows',
            unityVersion: '2022.3.22f1',
            variant: 'security'
        },
        {
            assetUrl: `https://api.vrchat.cloud/api/1/file/file_world_android_${index + 1}`,
            assetVersion: 1,
            created_at: `2026-03-${String((index % 18) + 1).padStart(2, '0')}T20:00:00.000Z`,
            platform: 'android',
            unityVersion: '2022.3.22f1',
            variant: 'security'
        }
    ],
    instances: []
}));

const mockGroups = Array.from({ length: MOCK_DATA_CONFIG.groupCount }, (_, index) =>
    buildGroup(index)
);

const instancePool = Array.from(
    { length: MOCK_DATA_CONFIG.instanceCount },
    (_, index) => {
        const world = mockWorlds[index % mockWorlds.length];
        const group = mockGroups[index % mockGroups.length];
        const typeIndex = index % 5;
        let suffix = `:${index + 1}`;
        if (typeIndex === 1) {
            suffix += `~group(${group.id})`;
        } else if (typeIndex === 2) {
            suffix += `~private(${MOCK_CURRENT_USER_ID})`;
        } else if (typeIndex === 3) {
            suffix += `~hidden(${MOCK_CURRENT_USER_ID})`;
        } else if (typeIndex === 4) {
            suffix += '~friends';
        }
        return {
            worldId: world.id,
            location: `${world.id}${suffix}`,
            name: world.name,
            groupId: group.id
        };
    }
);

function buildAvatar(id, authorId, authorName, name) {
    return {
        id,
        authorId,
        authorName,
        name,
        description: `${name} mock avatar`,
        imageUrl: MOCK_IMAGE_URL,
        thumbnailImageUrl: MOCK_IMAGE_URL,
        releaseStatus: 'public',
        tags: ['author_tag_style', /_self$/.test(id) ? 'system_approved' : 'content_sex'],
        version: 1 + (id.length % 4),
        created_at: '2026-01-04T09:00:00.000Z',
        updated_at: '2026-03-11T21:00:00.000Z',
        styles: {
            primary: 'cyber',
            secondary: 'street'
        },
        unityPackages: [
            {
                assetUrl: `https://api.vrchat.cloud/api/1/file/${id}`,
                assetVersion: 1,
                created_at: '2026-01-01T00:00:00.000Z',
                platform: 'standalonewindows',
                unityVersion: '2022.3.22f1',
                variant: 'security',
                performanceRating: 'Good'
            },
            {
                assetUrl: `https://api.vrchat.cloud/api/1/file/${id}_android`,
                assetVersion: 1,
                created_at: '2026-01-01T00:00:00.000Z',
                platform: 'android',
                unityVersion: '2022.3.22f1',
                variant: 'security',
                performanceRating: 'Medium'
            },
            {
                assetUrl: `https://api.vrchat.cloud/api/1/file/${id}_impostor`,
                assetVersion: 1,
                created_at: '2026-03-10T12:00:00.000Z',
                platform: 'standalonewindows',
                variant: 'impostor',
                imposterizerVersion: '2.1.0',
                performanceRating: 'Good'
            }
        ],
        publishedListings: [
            {
                id: `listing_${id}`,
                displayName: `${name} Listing`,
                description: `Marketplace listing for ${name}`,
                imageId: `img_${id}`,
                priceTokens: 2500 + id.length * 10
            }
        ]
    };
}

function buildUser(index) {
    const ratioSeed = (index % 1000) / 1000;
    const nonOfflineThreshold = Math.min(
        0.98,
        MOCK_DATA_CONFIG.activeRatio + MOCK_DATA_CONFIG.onlineRatio
    );
    const state =
        ratioSeed < MOCK_DATA_CONFIG.activeRatio
            ? 'active'
            : ratioSeed < nonOfflineThreshold
              ? 'online'
              : 'offline';
    const instance = instancePool[index % instancePool.length];
    const location = state === 'offline' ? 'offline' : instance.location;
    const avatarId = `avtr_mock_${(index % 8) + 1}`;
    const groupIds = [];
    if (index % 7 === 0) {
        groupIds.push(mockGroups[index % mockGroups.length].id);
    }
    if (index % 19 === 0) {
        groupIds.push(mockGroups[(index + 3) % mockGroups.length].id);
    }
    const isTraveling =
        state !== 'offline' &&
        ((index * 37) % 1000) / 1000 < MOCK_DATA_CONFIG.travelingRatio;
    const isVrcPlus = index % 8 === 0 || index % 29 === 0;
    const noteBlock = isVrcPlus ? ['system_supporter'] : [];
    const platformCycle = index % 10;
    const platform =
        state === 'offline'
            ? ''
            : platformCycle < 6
              ? 'standalonewindows'
              : platformCycle < 8
                ? 'android'
                : 'ios';

    return {
        acceptedPrivacyVersion: 1,
        acceptedTOSVersion: 1,
        badges: isVrcPlus
            ? [
                  {
                      badgeId: 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa',
                      badgeName: 'Supporter',
                      badgeDescription: 'Supports VRChat through VRC+',
                      badgeImageUrl:
                          'https://assets.vrchat.com/badges/fa/bdgai_583f6b13-91ab-4e1b-974e-ab91600b06cb.png',
                      hidden: false,
                      showcased: false
                  }
              ]
            : [],
        bio: `Mock friend ${index + 1} generated for runtime scale testing${
            isVrcPlus ? ' [VRC+]' : ''
        }`,
        bioLinks: index % 13 === 0 ? ['https://vrcx.app/mock-profile'] : [],
        currentAvatar: avatarId,
        currentAvatarImageUrl: MOCK_IMAGE_URL,
        currentAvatarThumbnailImageUrl: MOCK_IMAGE_URL,
        currentAvatarTags: [],
        allowAvatarCopying: index % 3 === 0,
        date_joined: '2024-01-01T00:00:00.000Z',
        displayName: `Mock Friend ${String(index + 1).padStart(5, '0')}`,
        friendKey: '',
        hasBirthday: false,
        id: `usr_mock_${String(index + 1).padStart(5, '0')}`,
        isFriend: true,
        last_activity: '2026-03-14T12:00:00.000Z',
        last_login: '2026-03-14T12:00:00.000Z',
        last_platform: platform,
        location,
        platform,
        presence: {
            groups: groupIds
        },
        note: index % 17 === 0 ? `Priority contact ${index + 1}` : '',
        profilePicOverride: isVrcPlus ? MOCK_IMAGE_URL : '',
        profilePicOverrideThumbnail: isVrcPlus ? MOCK_IMAGE_URL : '',
        pronouns: '',
        state,
        status:
            state === 'active'
                ? 'active'
                : state === 'online'
                  ? index % 4 === 0
                      ? 'ask me'
                      : 'join me'
                  : 'busy',
        statusDescription:
            state === 'offline'
                ? 'Offline in mock mode'
                : `${instance.name} ${index % 5 === 0 ? 'load test' : 'session'}${
                      isVrcPlus ? ' [VRC+]' : ''
                  }`,
        tags: noteBlock,
        travelingToLocation: isTraveling
            ? instancePool[(index + 1) % instancePool.length].location
            : '',
        userIcon: '',
        updated_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T17:00:00.000Z`,
        username: `mock_friend_${index + 1}`
    };
}

const mockFriends = Array.from({ length: MOCK_DATA_CONFIG.friendCount }, (_, index) =>
    buildUser(index)
);

const mockCurrentUser = {
    acceptedPrivacyVersion: 1,
    acceptedTOSVersion: 1,
    activeFriends: mockFriends.filter((user) => user.state === 'active').map((user) => user.id),
    ageVerificationStatus: '',
    ageVerified: false,
    allowAvatarCopying: false,
    badges: [],
    bio: 'Mock current user',
    bioLinks: [],
    currentAvatar: 'avtr_mock_self',
    currentAvatarImageUrl: MOCK_IMAGE_URL,
    currentAvatarThumbnailImageUrl: MOCK_IMAGE_URL,
    currentAvatarTags: [],
    date_joined: '2020-01-01T00:00:00.000Z',
    displayName: 'Mock Current User',
    fallbackAvatar: '',
    friendGroupNames: [],
    friendKey: '',
    friends: mockFriends.map((user) => user.id),
    homeLocation: `${mockWorlds[0].id}:1~home`,
    id: MOCK_CURRENT_USER_ID,
    isBoopingEnabled: false,
    isFriend: false,
    last_activity: '2026-03-14T12:00:00.000Z',
    last_login: '2026-03-14T12:00:00.000Z',
    last_platform: 'standalonewindows',
    offlineFriends: mockFriends.filter((user) => user.state === 'offline').map((user) => user.id),
    onlineFriends: mockFriends
        .filter((user) => user.state !== 'offline')
        .map((user) => user.id),
    pastDisplayNames: ['Mock Legacy User'],
    platform: 'standalonewindows',
    presence: {
        avatarThumbnail: '',
        currentAvatarTags: [],
        displayName: 'Mock Current User',
        groups: [mockGroups[0].id],
        id: MOCK_CURRENT_USER_ID,
        instance: '',
        instanceType: '',
        platform: 'standalonewindows',
        profilePicOverride: '',
        status: 'active',
        travelingToInstance: '',
        travelingToWorld: '',
        userIcon: '',
        world: ''
    },
    profilePicOverride: '',
    profilePicOverrideThumbnail: '',
    state: 'online',
    status: 'active',
    statusDescription: 'Mock runtime',
    tags: ['system_supporter'],
    travelingToLocation: '',
    updated_at: '2026-03-14T12:00:00.000Z',
    userIcon: '',
    userLanguage: 'eng',
    userLanguageCode: 'en',
    username: 'mock_current_user'
};

const mockAvatars = [
    buildAvatar(
        'avtr_mock_self',
        MOCK_CURRENT_USER_ID,
        'Mock Current User',
        'Mock Main Avatar'
    ),
    ...Array.from(
        { length: Math.max(1, MOCK_DATA_CONFIG.avatarCount - 1) },
        (_, index) =>
            buildAvatar(
                `avtr_mock_${index + 1}`,
                mockFriends[index % mockFriends.length]?.id || MOCK_CURRENT_USER_ID,
                mockFriends[index % mockFriends.length]?.displayName ||
                    'Mock Friend',
                `Mock Avatar ${String(index + 1).padStart(4, '0')}`
            )
    )
];

const mockLinkedUsers = Array.from(
    new Map(
        [
            ...mockWorlds.map((world) => [
                world.authorId,
                {
                    id: world.authorId,
                    displayName: world.authorName,
                    username: `linked_${world.authorId}`,
                    bio: `${world.authorName} linked mock author`,
                    bioLinks: [],
                    badges: [],
                    currentAvatar: 'avtr_mock_self',
                    currentAvatarImageUrl:
                        'https://files.vrchat.cloud/file/avtr_mock_self/1/file',
                    currentAvatarThumbnailImageUrl:
                        'https://files.vrchat.cloud/file/avtr_mock_self/1/file',
                    currentAvatarTags: [],
                    allowAvatarCopying: true,
                    date_joined: '2024-01-01T00:00:00.000Z',
                    friendKey: '',
                    id: world.authorId,
                    isFriend: false,
                    last_activity: '2026-03-14T12:00:00.000Z',
                    last_login: '2026-03-14T12:00:00.000Z',
                    last_platform: 'standalonewindows',
                    location: 'offline',
                    platform: '',
                    presence: {
                        groups: []
                    },
                    profilePicOverride: '',
                    profilePicOverrideThumbnail: '',
                    pronouns: '',
                    state: 'offline',
                    status: 'busy',
                    statusDescription: 'Offline in mock mode',
                    tags: [],
                    travelingToLocation: '',
                    userIcon: '',
                    updated_at: '2026-03-14T12:00:00.000Z'
                }
            ]),
            ...mockGroups.map((group) => [
                group.ownerId,
                {
                    id: group.ownerId,
                    displayName: `${group.name} Owner`,
                    username: `linked_${group.ownerId}`,
                    bio: `${group.name} owner account`,
                    bioLinks: [],
                    badges: [],
                    currentAvatar: 'avtr_mock_self',
                    currentAvatarImageUrl:
                        'https://files.vrchat.cloud/file/avtr_mock_self/1/file',
                    currentAvatarThumbnailImageUrl:
                        'https://files.vrchat.cloud/file/avtr_mock_self/1/file',
                    currentAvatarTags: [],
                    allowAvatarCopying: true,
                    date_joined: '2024-01-01T00:00:00.000Z',
                    friendKey: '',
                    id: group.ownerId,
                    isFriend: false,
                    last_activity: '2026-03-14T12:00:00.000Z',
                    last_login: '2026-03-14T12:00:00.000Z',
                    last_platform: 'standalonewindows',
                    location: 'offline',
                    platform: '',
                    presence: {
                        groups: [group.id]
                    },
                    profilePicOverride: '',
                    profilePicOverrideThumbnail: '',
                    pronouns: '',
                    state: 'offline',
                    status: 'busy',
                    statusDescription: 'Offline in mock mode',
                    tags: [],
                    travelingToLocation: '',
                    userIcon: '',
                    updated_at: '2026-03-14T12:00:00.000Z'
                }
            ])
        ].filter(([id]) => id !== MOCK_CURRENT_USER_ID)
    ).values()
);

const mockPlayerModerations = mockFriends
    .slice(0, 24)
    .flatMap((friend, index) => {
        const entries = [];
        if (index % 3 === 0) {
            entries.push({
                id: `pm_block_${index + 1}`,
                type: 'block',
                sourceUserId: MOCK_CURRENT_USER_ID,
                sourceDisplayName: mockCurrentUser.displayName,
                targetUserId: friend.id,
                targetDisplayName: friend.displayName,
                created: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T09:00:00.000Z`
            });
        }
        if (index % 4 === 0) {
            entries.push({
                id: `pm_mute_${index + 1}`,
                type: 'mute',
                sourceUserId: MOCK_CURRENT_USER_ID,
                sourceDisplayName: mockCurrentUser.displayName,
                targetUserId: friend.id,
                targetDisplayName: friend.displayName,
                created: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T09:30:00.000Z`
            });
        }
        if (index % 5 === 0) {
            entries.push({
                id: `pm_interact_${index + 1}`,
                type: 'interactOff',
                sourceUserId: MOCK_CURRENT_USER_ID,
                sourceDisplayName: mockCurrentUser.displayName,
                targetUserId: friend.id,
                targetDisplayName: friend.displayName,
                created: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T10:00:00.000Z`
            });
        }
        return entries;
    });

const mockAvatarModerations = mockAvatars.slice(0, 18).map((avatar, index) => ({
    targetAvatarId: avatar.id,
    created: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T11:00:00.000Z`,
    avatarModerationType: index % 2 === 0 ? 'block' : 'show'
}));

const mockUserStats = new Map(
    mockFriends.map((friend, index) => [
        friend.id,
        {
            userId: friend.id,
            lastSeen:
                friend.state === 'offline'
                    ? `2026-03-${String((index % 13) + 1).padStart(2, '0')}T0${index % 9}:30:00.000Z`
                    : `2026-03-15T00:${String(index % 59).padStart(2, '0')}:00.000Z`,
            joinCount: 8 + (index % 34),
            timeSpent: (15 + (index % 80)) * 60 * 1000,
            previousDisplayNames: new Map(
                index % 9 === 0
                    ? [[`${friend.displayName} Legacy`, `2025-11-${String((index % 28) + 1).padStart(2, '0')}T12:00:00.000Z`]]
                    : []
            )
        }
    ])
);

const mockWorldStats = new Map(
    mockWorlds.map((world, index) => [
        world.id,
        {
            worldId: world.id,
            created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T19:00:00.000Z`,
            visitCount: 18 + (index % 56),
            timeSpent: (2 + (index % 18)) * 60 * 60 * 1000
        }
    ])
);

const mockAvatarStats = new Map(
    mockAvatars.map((avatar, index) => [
        avatar.id,
        {
            avatarId: avatar.id,
            timeSpent: (8 + (index % 36)) * 60 * 1000
        }
    ])
);

const mockGroupPostsById = new Map(
    mockGroups.map((group, groupIndex) => [
        group.id,
        Array.from({ length: 6 }, (_, index) => ({
            id: `grp_post_${groupIndex + 1}_${index + 1}`,
            groupId: group.id,
            title: `${group.name} Update ${index + 1}`,
            text:
                index === 0
                    ? 'Announcement channel seeded by mock runtime.'
                    : `Mock group post ${index + 1} for ${group.name}.`,
            imageUrl: index % 2 === 0 ? 'https://assets.vrchat.com/www/images/logo.png' : '',
            authorId: group.ownerId,
            editorId: index % 3 === 0 ? MOCK_CURRENT_USER_ID : '',
            roleIds: index % 2 === 0 ? ['grol_owner', 'grol_mod'] : [],
            createdAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T08:00:00.000Z`,
            updatedAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T10:00:00.000Z`
        }))
    ])
);

const mockUsersById = new Map([
    [mockCurrentUser.id, mockCurrentUser],
    ...mockLinkedUsers.map((user) => [user.id, user]),
    ...mockFriends.map((user) => [user.id, user])
]);

const representedGroup = mockGroups[0];
const favoriteGroupsByType = {
    friend: ['group_0', 'group_1'],
    world: ['worlds1', 'worlds2'],
    avatar: ['avatars1']
};
const mockFavorites = [
    ...mockFriends.slice(0, Math.min(450, mockFriends.length)).map((friend, index) => ({
        id: `fav_friend_${index + 1}`,
        favoriteId: friend.id,
        type: 'friend',
        tags: [`group_${Math.floor(index / 150)}`]
    })),
    ...mockWorlds.slice(0, Math.min(400, mockWorlds.length)).map((world, index) => ({
        id: `fav_world_${index + 1}`,
        favoriteId: world.id,
        type: 'world',
        tags: [`worlds${Math.floor(index / 100) + 1}`]
    })),
    ...mockAvatars.slice(0, Math.min(300, mockAvatars.length)).map((avatar, index) => ({
        id: `fav_avatar_${index + 1}`,
        favoriteId: avatar.id,
        type: 'avatar',
        tags: [`avatars${Math.floor(index / 50) + 1}`]
    }))
];
const mockFavoriteGroups = [
    ...favoriteGroupsByType.friend.map((groupKey, index) => ({
        id: `fav_group_friend_${index + 1}`,
        ownerId: MOCK_CURRENT_USER_ID,
        type: 'friend',
        displayName: `Friends ${index + 1}`,
        name: groupKey,
        visibility: 'private',
        tags: [groupKey]
    })),
    ...favoriteGroupsByType.world.map((groupKey, index) => ({
        id: `fav_group_world_${index + 1}`,
        ownerId: MOCK_CURRENT_USER_ID,
        type: 'world',
        displayName: `Worlds ${index + 1}`,
        name: groupKey,
        visibility: 'private',
        tags: [groupKey]
    })),
    ...favoriteGroupsByType.avatar.map((groupKey, index) => ({
        id: `fav_group_avatar_${index + 1}`,
        ownerId: MOCK_CURRENT_USER_ID,
        type: 'avatar',
        displayName: `Avatars ${index + 1}`,
        name: groupKey,
        visibility: 'private',
        tags: [groupKey]
    }))
];
const mockUserNotes = mockFriends
    .slice(0, Math.min(40, mockFriends.length))
    .map((friend, index) => ({
        id: `note_${index + 1}`,
        targetUserId: friend.id,
        userId: MOCK_CURRENT_USER_ID,
        note: `Mock note for ${friend.displayName}`,
        created_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T09:00:00.000Z`,
        updated_at: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T12:00:00.000Z`
    }));
const mockNotifications = [
    {
        id: 'noty_friend_request_1',
        senderUserId: mockFriends[0]?.id || '',
        senderUsername: mockFriends[0]?.displayName || 'Mock Friend 1',
        type: 'friendRequest',
        message: 'Sent you a friend request',
        details: {},
        seen: false,
        created_at: '2026-03-14T12:00:00.000Z'
    },
    {
        id: 'noty_invite_1',
        senderUserId: mockFriends[1]?.id || '',
        senderUsername: mockFriends[1]?.displayName || 'Mock Friend 2',
        type: 'invite',
        message: 'Invite to world',
        details: {
            worldId: instancePool[1]?.location || mockCurrentUser.homeLocation,
            worldName: instancePool[1]?.name || mockWorlds[0].name
        },
        seen: false,
        created_at: '2026-03-14T11:58:00.000Z'
    }
];
const mockNotificationsV2 = [
    {
        id: 'noty_v2_boop_1',
        createdAt: '2026-03-14T11:50:00.000Z',
        updatedAt: '2026-03-14T11:50:00.000Z',
        expiresAt: '',
        type: 'boop',
        link: '',
        linkText: '',
        title: 'Mock Friend 003 booped you',
        message: '',
        imageUrl: '',
        seen: false,
        senderUserId: mockFriends[2]?.id || '',
        senderUsername: mockFriends[2]?.displayName || 'Mock Friend 3',
        data: {},
        responses: [],
        details: {
            emojiId: 'default_wave',
            emojiVersion: 1
        },
        version: 2
    }
];
const mockCalendarEvents = Array.from({ length: 120 }, (_, index) => {
    const group = mockGroups[index % mockGroups.length];
    const world = mockWorlds[index % mockWorlds.length];
    const day = String((index % 28) + 1).padStart(2, '0');
    const hour = String((index % 12) + 10).padStart(2, '0');
    return {
        id: `gce_mock_${index + 1}`,
        ownerId: group.id,
        title: `${group.name} Event ${index + 1}`,
        description: `Mock calendar event ${index + 1}`,
        imageUrl: world.thumbnailImageUrl,
        startsAt: `2026-03-${day}T${hour}:00:00.000Z`,
        endsAt: `2026-03-${day}T${String((Number(hour) + 2) % 24).padStart(2, '0')}:00:00.000Z`,
        location: `${world.id}:${index + 1}`,
        worldId: world.id,
        worldName: world.name,
        isPublic: index % 3 !== 0,
        userInterest: {
            isFollowing: index % 5 === 0
        }
    };
});
const mockInventoryItems = Array.from({ length: 240 }, (_, index) => ({
    id: `inv_mock_${index + 1}`,
    inventoryId: `inv_mock_${index + 1}`,
    inventoryTemplateId: `tmpl_mock_${(index % 48) + 1}`,
    name: `Mock Inventory ${String(index + 1).padStart(4, '0')}`,
    displayName: `Mock Inventory ${String(index + 1).padStart(4, '0')}`,
    description: `Mock inventory item ${index + 1}`,
    imageUrl: 'https://assets.vrchat.com/www/images/logo.png',
    thumbnailImageUrl: 'https://assets.vrchat.com/www/images/logo.png',
    itemType:
        index % 4 === 0
            ? 'emoji'
            : index % 4 === 1
              ? 'sticker'
              : index % 4 === 2
                ? 'print'
                : 'icon',
    flags: index % 9 === 0 ? ['ugc'] : [],
    createdAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T12:00:00.000Z`
}));
const mockGroupMember = {
    id: `gmem_${MOCK_CURRENT_USER_ID}_${MOCK_GROUP_ID}`,
    groupId: MOCK_GROUP_ID,
    userId: MOCK_CURRENT_USER_ID,
    roleIds: ['grol_owner'],
    visibility: 'visible',
    isSubscribedToAnnouncements: false,
    managerNotes: '',
    membershipStatus: 'member',
    joinedAt: '2026-01-01T00:00:00.000Z'
};

function paginate(items, offset = 0, n = 50) {
    return items.slice(offset, offset + n);
}

function createResponse(data, status = 200) {
    return {
        status,
        data: JSON.stringify(data)
    };
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function decodeBasicAuthHeader(headerValue) {
    if (!headerValue || !headerValue.startsWith('Basic ')) {
        return null;
    }
    try {
        const decoded = atob(headerValue.slice('Basic '.length));
        const separatorIndex = decoded.indexOf(':');
        if (separatorIndex === -1) {
            return null;
        }
        return {
            username: decodeURIComponent(decoded.slice(0, separatorIndex)),
            password: decodeURIComponent(decoded.slice(separatorIndex + 1))
        };
    } catch {
        return null;
    }
}

function buildWorld(worldId) {
    return (
        mockWorlds.find((world) => world.id === worldId) || {
            ...mockWorlds[0],
            id: worldId
        }
    );
}

function buildInstance(path) {
    const [worldId, instanceId] = path.replace('instances/', '').split(':');
    const ownerId =
        instanceId?.includes('group(')
            ? instanceId.match(/group\(([^)]+)\)/)?.[1] || MOCK_GROUP_ID
            : instanceId?.includes('private(') || instanceId?.includes('hidden(')
              ? instanceId.match(/\(([^)]+)\)/)?.[1] || MOCK_CURRENT_USER_ID
              : MOCK_CURRENT_USER_ID;
    const ownerUser = mockUsersById.get(ownerId);
    const ownerGroup = getGroupById(ownerId);
    return {
        id: `${worldId}:${instanceId}`,
        location: `${worldId}:${instanceId}`,
        instanceId,
        worldId,
        name: buildWorld(worldId).name,
        type: instanceId?.includes('group(')
            ? 'group'
            : instanceId?.includes('hidden(')
              ? 'hidden'
              : instanceId?.includes('private(')
                ? 'private'
                : instanceId?.includes('friends')
                  ? 'friends'
                  : 'public',
        ownerId,
        active: true,
        full: false,
        n_users: 8,
        capacity: 32,
        recommendedCapacity: 16,
        userCount: 8,
        platforms: {
            standalonewindows: 8
        },
        photonRegion: 'us',
        region: 'us',
        world: buildWorld(worldId),
        users: [],
        shortName: '',
        displayName:
            ownerUser?.displayName ||
            ownerGroup?.name ||
            buildWorld(worldId).name,
        contentSettings: {},
        $fetchedAt: new Date().toJSON()
    };
}

function getGroupById(groupId = MOCK_GROUP_ID) {
    return mockGroups.find((group) => group.id === groupId) || representedGroup;
}

function getUserGroupsById(userId = MOCK_CURRENT_USER_ID) {
    if (userId === MOCK_CURRENT_USER_ID) {
        return mockGroups;
    }
    return mockGroups.filter((_, index) => index % 4 === 0 || index % 7 === 0);
}

function createMembershipJson(group, userId = MOCK_CURRENT_USER_ID) {
    return {
        ...group,
        id: `gmem_${userId}_${group.id}`,
        groupId: group.id,
        myMember: {
            roleIds: [...(group.myMember?.roleIds || ['grol_member'])],
            visibility: group.myMember?.visibility || 'visible',
            isRepresenting: userId === MOCK_CURRENT_USER_ID && group.id === representedGroup.id,
            isSubscribedToAnnouncements: false,
            membershipStatus: 'member'
        }
    };
}

function getGroupMemberJson(groupId = MOCK_GROUP_ID, userId = MOCK_CURRENT_USER_ID) {
    const group = getGroupById(groupId);
    if (userId === MOCK_CURRENT_USER_ID) {
        return {
            ...mockGroupMember,
            groupId,
            id: `gmem_${userId}_${groupId}`,
            roleIds: [...(group.myMember?.roleIds || mockGroupMember.roleIds)],
            visibility: group.myMember?.visibility || mockGroupMember.visibility
        };
    }
    return {
        id: `gmem_${userId}_${groupId}`,
        groupId,
        userId,
        roleIds: [],
        visibility: 'visible',
        isSubscribedToAnnouncements: false,
        managerNotes: '',
        membershipStatus: 'member',
        joinedAt: '2026-01-01T00:00:00.000Z'
    };
}

function getFriendsByOfflineFlag(isOffline) {
    return mockFriends.filter((user) =>
        isOffline ? user.state === 'offline' : user.state !== 'offline'
    );
}

function filterByType(items, type) {
    if (!type) {
        return items;
    }
    return items.filter((item) => item.type === type);
}

function filterBySearch(items, search, getText) {
    const needle = String(search || '').trim().toLowerCase();
    if (!needle) {
        return items;
    }
    return items.filter((item) => getText(item).toLowerCase().includes(needle));
}

function getMockWorldById(worldId) {
    return buildWorld(worldId);
}

function getMockAvatarById(avatarId) {
    return mockAvatars.find((avatar) => avatar.id === avatarId) || mockAvatars[0];
}

function getMockUserById(userId) {
    return mockUsersById.get(userId);
}

function createSyntheticUser(userId) {
    if (!userId) {
        return null;
    }
    const label =
        userId.startsWith('usr_mock_author_')
            ? 'Mock Author'
            : userId.startsWith('usr_mock_owner_')
              ? 'Mock Owner'
              : 'Mock User';
    const serial = userId.split('_').pop() || '0001';
    return {
        acceptedPrivacyVersion: 1,
        acceptedTOSVersion: 1,
        allowAvatarCopying: false,
        badges: [],
        bio: `${label} ${serial}`,
        bioLinks: [],
        currentAvatar: 'avtr_mock_self',
        currentAvatarImageUrl:
            'https://files.vrchat.cloud/file/avtr_mock_self/1/file',
        currentAvatarThumbnailImageUrl:
            'https://files.vrchat.cloud/file/avtr_mock_self/1/file',
        currentAvatarTags: [],
        date_joined: '2024-01-01T00:00:00.000Z',
        displayName: `${label} ${serial}`,
        id: userId,
        isFriend: false,
        last_activity: '2026-03-14T12:00:00.000Z',
        last_login: '2026-03-14T12:00:00.000Z',
        last_platform: 'standalonewindows',
        location: 'offline',
        platform: '',
        presence: {
            groups: []
        },
        profilePicOverride: '',
        profilePicOverrideThumbnail: '',
        state: 'offline',
        status: 'busy',
        statusDescription: `${label} offline`,
        tags: [],
        travelingToLocation: '',
        updated_at: '2026-03-14T12:00:00.000Z',
        userIcon: '',
        username: `synthetic_${serial}`
    };
}

function getMockUserStatsByRef(user) {
    const existing = mockUserStats.get(user.id);
    if (existing) {
        return existing;
    }
    return {
        userId: user.id,
        lastSeen: user.state === 'offline' ? user.updated_at || user.last_activity : new Date().toISOString(),
        joinCount: 0,
        timeSpent: 0,
        previousDisplayNames: new Map()
    };
}

function getMockWorldStatsById(worldId) {
    return (
        mockWorldStats.get(worldId) || {
            worldId,
            created_at: '',
            visitCount: 0,
            timeSpent: 0
        }
    );
}

function getMockAvatarStatsById(avatarId) {
    return (
        mockAvatarStats.get(avatarId) || {
            avatarId,
            timeSpent: 0
        }
    );
}

function getMockGroupPosts(groupId) {
    return cloneJson(mockGroupPostsById.get(groupId) || []);
}

function getMockGroupCalendar(groupId) {
    return cloneJson(
        mockCalendarEvents.filter((event) => event.ownerId === groupId).slice(0, 18)
    );
}

function getMockGroupEvent(groupId, eventId) {
    return cloneJson(
        mockCalendarEvents.find(
            (event) => event.ownerId === groupId && event.id === eventId
        ) || mockCalendarEvents[0]
    );
}

function getMockGroupMembers(groupId, search = '') {
    const group = getGroupById(groupId);
    const members = [
        {
            ...getGroupMemberJson(groupId, MOCK_CURRENT_USER_ID),
            user: mockCurrentUser,
            userId: MOCK_CURRENT_USER_ID
        },
        ...mockFriends.slice(0, 36).map((friend, index) => ({
            ...getGroupMemberJson(groupId, friend.id),
            user: friend,
            roleIds: index % 9 === 0 ? ['grol_mod'] : ['grol_member'],
            joinedAt: `2026-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`
        }))
    ];
    return filterBySearch(
        members,
        search,
        (member) =>
            `${member.user?.displayName || ''} ${member.user?.username || ''} ${group.name}`
    );
}

function getMockGroupGalleryItems(groupId, galleryId, offset = 0, n = 100) {
    const world = mockWorlds[(galleryId.length + offset) % mockWorlds.length] || mockWorlds[0];
    return Array.from({ length: Math.min(n, 12) }, (_, index) => ({
        id: `gallery_item_${groupId}_${galleryId}_${offset + index + 1}`,
        groupId,
        galleryId,
        createdAt: `2026-03-${String(((offset + index) % 14) + 1).padStart(2, '0')}T12:00:00.000Z`,
        ownerId: MOCK_CURRENT_USER_ID,
        imageUrl: world?.imageUrl || 'https://assets.vrchat.com/www/images/logo.png',
        thumbnailUrl:
            world?.thumbnailImageUrl || 'https://assets.vrchat.com/www/images/logo.png',
        mimeType: 'image/png',
        fileId: `file_gallery_${galleryId}_${offset + index + 1}`
    }));
}

function getMockGroupBans(groupId, offset = 0, n = 100) {
    return mockFriends.slice(offset, offset + n).slice(0, 18).map((friend, index) => ({
        ...getGroupMemberJson(groupId, friend.id),
        user: friend,
        roleIds: ['grol_member'],
        bannedAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T17:00:00.000Z`,
        managerNotes: `Mock ban note ${index + 1}`
    }));
}

function getMockGroupInvites(groupId, offset = 0, n = 100) {
    return mockFriends.slice(offset, offset + n).slice(0, 12).map((friend, index) => ({
        ...getGroupMemberJson(groupId, friend.id),
        user: friend,
        createdAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T14:00:00.000Z`
    }));
}

function getMockGroupRequests(groupId, blocked = false, offset = 0, n = 100) {
    return mockFriends
        .slice(offset + (blocked ? 12 : 24), offset + (blocked ? 24 : 36))
        .slice(0, n)
        .map((friend, index) => ({
            ...getGroupMemberJson(groupId, friend.id),
            user: friend,
            createdAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T15:00:00.000Z`,
            blockedAt: blocked
                ? `2026-03-${String((index % 14) + 1).padStart(2, '0')}T16:00:00.000Z`
                : ''
        }));
}

function getMockGroupLogs(groupId, offset = 0, n = 100) {
    return Array.from({ length: Math.min(n, 24) }, (_, index) => {
        const friend = mockFriends[(offset + index) % mockFriends.length];
        return {
            id: `group_log_${groupId}_${offset + index + 1}`,
            groupId,
            actorUserId: friend?.id || '',
            actorDisplayName: friend?.displayName || 'Mock Friend',
            targetUserId: mockFriends[(offset + index + 3) % mockFriends.length]?.id || '',
            eventType:
                index % 4 === 0
                    ? 'group.user.join'
                    : index % 4 === 1
                      ? 'group.user.leave'
                      : index % 4 === 2
                        ? 'group.member.role.add'
                        : 'group.post.create',
            description: `Mock group moderation log ${offset + index + 1}`,
            createdAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T18:00:00.000Z`
        };
    });
}

function getMockAvatarSearchResults(type, search) {
    if (type === 'authorId') {
        return mockAvatars.filter((avatar) => avatar.authorId === search);
    }
    return filterBySearch(
        mockAvatars,
        search,
        (avatar) => `${avatar.name} ${avatar.description} ${avatar.authorName}`
    ).slice(0, 5000);
}

function getMockGroupInstances() {
    return instancePool
        .filter((instance, index) => index % 5 === 1)
        .slice(0, Math.min(24, instancePool.length))
        .map((instance) => ({
            ...buildInstance(`instances/${instance.location}`),
            ownerId: instance.groupId,
            type: 'group'
        }));
}

export async function handleMockRequest(endpoint, init) {
    const url = new URL(init.url);
    const path = url.pathname.replace(/\/api\/1\/?/, '');
    const params = Object.fromEntries(url.searchParams.entries());

    if (!/vrchat\.com$/.test(url.hostname) && !/vrcx\.app$/.test(url.hostname)) {
        if (params.search) {
            return createResponse(
                getMockAvatarSearchResults('search', params.search)
            );
        }
        if (params.authorId) {
            return createResponse(
                getMockAvatarSearchResults('authorId', params.authorId)
            );
        }
        if (params.fileId) {
            const avatar = mockAvatars.find((item) => item.id.includes(params.fileId));
            return createResponse(avatar || {});
        }
    }

    if (url.hostname === 'status.vrchat.com') {
        if (url.pathname.endsWith('/status.json')) {
            return createResponse({
                page: {
                    updated_at: '2026-03-14T12:00:00.000Z'
                },
                status: {
                    description: 'All Systems Operational'
                }
            });
        }
        if (url.pathname.endsWith('/summary.json')) {
            return createResponse({
                components: []
            });
        }
    }

    if (url.hostname === 'api0.vrcx.app') {
        if (url.pathname.endsWith('/latest')) {
            return createResponse({
                tag_name: '2026.03.14-mock',
                body: 'Mock runtime release',
                assets: [],
                published_at: '2026-03-14T12:00:00.000Z'
            });
        }
        return createResponse([]);
    }

    if (path === 'config') {
        return createResponse({
            whiteListedAssetUrls: [
                'https://assets.vrchat.com',
                'https://files.vrchat.cloud'
            ],
            sdkUnityVersion: '2022.3.22f1',
            constants: {
                LANGUAGE: {
                    SPOKEN_LANGUAGE_OPTIONS: {
                        eng: 'English',
                        jpn: 'Japanese'
                    }
                }
            }
        });
    }

    if (path === 'auth') {
        return createResponse({ ok: true, token: 'mock-token' });
    }

    if (path === 'auth/user') {
        const credentials = decodeBasicAuthHeader(init.headers?.Authorization);
        if (
            credentials &&
            (credentials.username !== MOCK_CREDENTIALS.username ||
                credentials.password !== MOCK_CREDENTIALS.password)
        ) {
            return createResponse(
                {
                    error: {
                        status_code: 401,
                        message: 'Invalid Username/Email or Password'
                    }
                },
                401
            );
        }
        return createResponse(mockCurrentUser);
    }

    if (path === 'auth/user/friends') {
        const offline = params.offline === 'true';
        const offset = Number(params.offset || 0);
        const n = Number(params.n || 50);
        return createResponse(paginate(getFriendsByOfflineFlag(offline), offset, n));
    }

    if (path.startsWith('auth/user/notifications/')) {
        return createResponse({ ok: true });
    }

    if (path === 'avatars/favorites') {
        return createResponse(
            mockAvatars.slice(0, Math.min(300, mockAvatars.length))
        );
    }

    if (path === 'avatars') {
        if (params.user === 'me') {
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 50);
            return createResponse(paginate(mockAvatars, offset, n));
        }
        return createResponse([]);
    }

    if (path.startsWith('avatars/')) {
        if (path.endsWith('/select') || path.endsWith('/selectfallback')) {
            const avatarId = path.split('/')[1];
            mockCurrentUser.currentAvatar = avatarId;
            mockCurrentUser.currentAvatarImageUrl = MOCK_IMAGE_URL;
            mockCurrentUser.currentAvatarThumbnailImageUrl = MOCK_IMAGE_URL;
            return createResponse(mockCurrentUser);
        }
        const avatarId = path.split('/')[1];
        const avatar = mockAvatars.find((item) => item.id === avatarId);
        return createResponse(avatar || mockAvatars[0]);
    }

    if (path === 'avatarStyles') {
        return createResponse([]);
    }

    if (path === 'auth/user/favoritelimits') {
        return createResponse({
            maxFavoriteGroups: {
                avatar: 6,
                friend: 3,
                vrcPlusWorld: 4,
                world: 4
            },
            maxFavoritesPerGroup: {
                avatar: 50,
                friend: 150,
                vrcPlusWorld: 100,
                world: 100
            }
        });
    }

    if (path === 'auth/user/notifications') {
        const offset = Number(params.offset || 0);
        const n = Number(params.n || 50);
        return createResponse(paginate(mockNotifications, offset, n));
    }

    if (path === 'notifications') {
        const offset = Number(params.offset || 0);
        const n = Number(params.n || 50);
        return createResponse(paginate(mockNotificationsV2, offset, n));
    }

    if (path === 'auth/user/playermoderations') {
        return createResponse(mockPlayerModerations);
    }

    if (path === 'auth/user/avatarmoderations') {
        return createResponse(mockAvatarModerations);
    }

    if (path === 'auth/user/unplayermoderate') {
        return createResponse([]);
    }

    if (
        path === 'favorites' ||
        path === 'favorite/groups' ||
        path === 'worlds/favorites' ||
        path === 'avatars/favorites'
    ) {
        if (path === 'favorites') {
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 50);
            const items = paginate(
                filterByType(mockFavorites, params.type),
                offset,
                n
            );
            return createResponse(items);
        }
        if (path === 'favorite/groups') {
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 50);
            return createResponse(
                paginate(
                    filterByType(mockFavoriteGroups, params.type),
                    offset,
                    n
                )
            );
        }
        if (path === 'worlds/favorites') {
            return createResponse(mockWorlds.slice(0, Math.min(12, mockWorlds.length)));
        }
    }

    if (path === 'files') {
        if (params.tag === 'avatargallery') {
            return createResponse(
                Array.from({ length: 5 }, (_, index) => ({
                    id: `file_gallery_${params.galleryId}_${index + 1}`,
                    extension: 'png',
                    mimeType: 'image/png',
                    versions: [
                        {
                            file: {
                                url: 'https://assets.vrchat.com/www/images/logo.png'
                            }
                        }
                    ]
                }))
            );
        }
        return createResponse([]);
    }

    if (path.startsWith('file/')) {
        return createResponse({
            id: path.split('/')[1],
            name: 'mock-file',
            ownerId: MOCK_CURRENT_USER_ID
        });
    }

    if (path.startsWith('analysis/')) {
        const [, fileId, version, variant] = path.split('/');
        return createResponse({
            fileId,
            version: Number(version || 1),
            variant: variant || 'security',
            fileSize: 92_274_688,
            assetVersion: Number(version || 1),
            created_at: '2026-03-11T21:00:00.000Z',
            tags: [],
            _fileSize: '88.00 MB'
        });
    }

    if (path === 'worlds') {
        const offset = Number(params.offset || 0);
        const n = Number(params.n || 50);
        let worlds = filterBySearch(
            mockWorlds,
            params.search,
            (world) => `${world.name} ${world.description} ${world.authorName}`
        );
        if (params.user === 'me' || params.user === MOCK_CURRENT_USER_ID) {
            worlds = worlds.filter(
                (world) =>
                    world.authorId === MOCK_CURRENT_USER_ID || world.id.endsWith('1')
            );
        }
        return createResponse(paginate(worlds, offset, n));
    }

    if (path === 'instances' && init.method === 'POST') {
        return createResponse(buildInstance(`instances/${mockCurrentUser.homeLocation}`));
    }

    if (path.startsWith('instances/')) {
        if (path.endsWith('/shortName')) {
            return createResponse({
                shortName: 'MOCK42'
            });
        }
        return createResponse(buildInstance(path));
    }

    if (path === 'userNotes') {
        const offset = Number(params.offset || 0);
        const n = Number(params.n || 50);
        return createResponse(paginate(mockUserNotes, offset, n));
    }

    if (path.endsWith('/mutuals')) {
        return createResponse({
            friends: 0,
            groups: Math.min(4, mockGroups.length)
        });
    }

    if (path.endsWith('/mutuals/friends') || path.endsWith('/mutuals/groups')) {
        if (path.endsWith('/mutuals/friends')) {
            return createResponse(mockFriends.slice(0, Math.min(8, mockFriends.length)));
        }
        return createResponse(
            mockGroups
                .slice(0, Math.min(4, mockGroups.length))
                .map((group) => createMembershipJson(group))
        );
    }

    if (path === 'users') {
        const offset = Number(params.offset || 0);
        const n = Number(params.n || 50);
        const search = String(params.search || '').toLowerCase();
        const items = [mockCurrentUser, ...mockLinkedUsers, ...mockFriends].filter((user) => {
            if (!search) {
                return true;
            }
            return (
                user.displayName.toLowerCase().includes(search) ||
                user.username.toLowerCase().includes(search)
            );
        });
        return createResponse(paginate(items, offset, n));
    }

    if (path.startsWith('users/') && path.endsWith('/feedback')) {
        return createResponse([]);
    }

    if (path.startsWith('users/') && path.endsWith('/persist/exists')) {
        return createResponse(false);
    }

    if (path.startsWith('users/') && path.endsWith('/persist')) {
        return createResponse({ ok: true });
    }

    if (path.startsWith('users/') && path.endsWith('/boop')) {
        return createResponse({ ok: true });
    }

    if (path.startsWith('users/') && path.includes('/badges/')) {
        return createResponse({ ok: true });
    }

    if (path.startsWith('users/') && path.endsWith('/addTags')) {
        const tags = Array.isArray(init.params?.tags) ? init.params.tags : [];
        mockCurrentUser.tags = Array.from(new Set([...mockCurrentUser.tags, ...tags]));
        return createResponse(mockCurrentUser);
    }

    if (path.startsWith('users/') && path.endsWith('/removeTags')) {
        const tags = new Set(Array.isArray(init.params?.tags) ? init.params.tags : []);
        mockCurrentUser.tags = mockCurrentUser.tags.filter((tag) => !tags.has(tag));
        return createResponse(mockCurrentUser);
    }

    if (path.endsWith('/groups/represented')) {
        return createResponse(createMembershipJson(representedGroup));
    }

    if (path.endsWith('/groups/permissions')) {
        return createResponse(
            Object.fromEntries(
                mockGroups.map((group) => [
                    group.id,
                    [
                        'group-instance-moderate',
                        'group-member-viewall',
                        'group-members-manage',
                        'group-members-viewall',
                        'group-announcement-manage',
                        'group-invites-manage',
                        'group-roles-assign'
                    ]
                ])
            )
        );
    }

    if (path.endsWith('/instances/groups')) {
        return createResponse({
            fetchedAt: new Date().toJSON(),
            instances: getMockGroupInstances()
        });
    }

    if (path.includes('/instances/groups/')) {
        const groupId = path.split('/').pop();
        return createResponse({
            fetchedAt: new Date().toJSON(),
            instances: getMockGroupInstances().filter(
                (instance) => instance.ownerId === groupId
            )
        });
    }

    if (path.endsWith('/groups')) {
        const userId = path.split('/')[1];
        return createResponse(
            getUserGroupsById(userId).map((group) =>
                createMembershipJson(group, userId)
            )
        );
    }

    if (path === 'groups' || path === 'groups/strictsearch') {
        const offset = Number(params.offset || 0);
        const n = Number(params.n || 50);
        const items = filterBySearch(
            mockGroups,
            params.query || params.search,
            (group) => `${group.name} ${group.description} ${group.shortCode}`
        );
        return createResponse(paginate(items, offset, n));
    }

    if (path.startsWith('groups/')) {
        const parts = path.split('/');
        const groupId = parts[1];
        const group = getGroupById(groupId);
        if (path.endsWith('/auditLogTypes')) {
            return createResponse([
                'group.user.join',
                'group.user.leave',
                'group.member.role.add',
                'group.post.create'
            ]);
        }
        if (path.endsWith('/auditLogs')) {
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 100);
            const results = getMockGroupLogs(groupId, offset, n);
            return createResponse({
                results,
                hasNext: false
            });
        }
        if (path.endsWith('/roles')) {
            return createResponse(cloneJson(group.roles));
        }
        if (path.endsWith('/posts')) {
            const posts = getMockGroupPosts(groupId);
            return createResponse({
                posts,
                total: posts.length
            });
        }
        if (path.includes('/galleries/')) {
            const galleryId = parts[3];
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 100);
            return createResponse(
                getMockGroupGalleryItems(groupId, galleryId, offset, n)
            );
        }
        if (path.endsWith('/members/search')) {
            return createResponse({
                results: getMockGroupMembers(
                    groupId,
                    params.query || params.search
                )
            });
        }
        if (path.includes('/members')) {
            const maybeUserId = parts[3];
            if (parts.length === 4 && maybeUserId) {
                return createResponse(getGroupMemberJson(groupId, maybeUserId));
            }
            return createResponse(getMockGroupMembers(groupId));
        }
        if (path.endsWith('/instances')) {
            return createResponse({
                instances: getMockGroupInstances().filter(
                    (instance) => instance.ownerId === groupId
                )
            });
        }
        if (path.endsWith('/bans') && init.method === 'GET') {
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 100);
            return createResponse(getMockGroupBans(groupId, offset, n));
        }
        if (path.endsWith('/invites') && init.method === 'GET') {
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 100);
            return createResponse(getMockGroupInvites(groupId, offset, n));
        }
        if (path.endsWith('/requests') && init.method === 'GET') {
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 100);
            return createResponse(
                getMockGroupRequests(groupId, params.blocked === 'true', offset, n)
            );
        }
        if (path.endsWith('/calendar')) {
            return createResponse({
                results: getMockGroupCalendar(groupId)
            });
        }
        if (path.includes('/calendar/')) {
            return createResponse(getMockGroupEvent(groupId, parts[3]));
        }
        if (
            path.endsWith('/join') ||
            path.endsWith('/leave') ||
            path.endsWith('/representation') ||
            path.endsWith('/block') ||
            path.endsWith('/invites') ||
            path.includes('/requests/') ||
            path.includes('/bans') ||
            path.includes('/posts/')
        ) {
            return createResponse({ ok: true });
        }
        return createResponse(group);
    }

    if (path.startsWith('worlds/')) {
        const worldKey = path.split('/')[1];
        if (worldKey === 'active' || worldKey === 'recent' || worldKey === 'favorites') {
            const offset = Number(params.offset || 0);
            const n = Number(params.n || 50);
            return createResponse(
                paginate(
                    filterBySearch(
                        mockWorlds,
                        params.search,
                        (world) =>
                            `${world.name} ${world.description} ${world.authorName}`
                    ),
                    offset,
                    n
                )
            );
        }
        return createResponse(buildWorld(worldKey));
    }

    if (path === 'calendar') {
        return createResponse({
            results: mockCalendarEvents.slice(0, 60)
        });
    }

    if (path.startsWith('calendar/')) {
        const parts = path.split('/');
        if (parts.length === 2) {
            return createResponse({
                results: getMockGroupCalendar(parts[1])
            });
        }
        return createResponse(getMockGroupEvent(parts[1], parts[2]));
    }

    if (path.startsWith('user/') && path.endsWith('/balance')) {
        return createResponse(0);
    }

    if (
        path.startsWith('user/') &&
        (path.endsWith('/friendRequest') || path.endsWith('/friendStatus'))
    ) {
        return createResponse({ ok: true });
    }

    if (
        path.startsWith('invite/') ||
        path.startsWith('requestInvite/') ||
        path.startsWith('feedback/')
    ) {
        return createResponse({ ok: true });
    }

    if (path === 'visits') {
        return createResponse(1234);
    }

    if (path.startsWith('users/')) {
        const parts = path.split('/');
        const userId = parts[1];
        if (
            init.method === 'PUT' &&
            userId === MOCK_CURRENT_USER_ID &&
            parts.length === 2
        ) {
            Object.assign(mockCurrentUser, init.params || {});
            mockCurrentUser.updated_at = new Date().toISOString();
            return createResponse(mockCurrentUser);
        }
        const user = mockUsersById.get(userId) || createSyntheticUser(userId);
        if (!user) {
            return createResponse(
                {
                    error: {
                        status_code: 404,
                        message: 'Mock user not found'
                    }
                },
                404
            );
        }
        return createResponse({
            ...user,
            $lastFetch: Date.now()
        });
    }

    return createResponse({
        success: {
            message: `Mock response for ${path}`
        }
    });
}

export function getMockCurrentUser() {
    return mockCurrentUser;
}

export function getMockFriends() {
    return mockFriends;
}

export function getMockWorlds() {
    return mockWorlds;
}

export function getMockGroups() {
    return mockGroups;
}

export function getMockInstances() {
    return instancePool;
}

export function getMockAvatars() {
    return mockAvatars;
}

export function getMockUserStats(user) {
    return getMockUserStatsByRef(user);
}

export function getMockWorldStats(worldId) {
    return getMockWorldStatsById(worldId);
}

export function getMockAvatarStats(avatarId) {
    return getMockAvatarStatsById(avatarId);
}

export function getMockPlayerModerations() {
    return mockPlayerModerations;
}

export function getMockAvatarModerations() {
    return mockAvatarModerations;
}

export function getMockLocalFavoritesSeed() {
    return {
        friendGroups: ['Favorites', 'Raid', 'Builders'],
        worldGroups: {
            Favorites: mockWorlds.slice(0, 12),
            Benchmark: mockWorlds.slice(12, 24),
            Chill: mockWorlds.slice(24, 36)
        },
        avatarGroups: {
            Favorites: mockAvatars.slice(0, 10),
            Testers: mockAvatars.slice(10, 20)
        },
        friendGroupsMap: {
            Favorites: mockFriends.slice(0, 20).map((friend) => friend.id),
            Raid: mockFriends.slice(20, 40).map((friend) => friend.id),
            Builders: mockFriends.slice(40, 60).map((friend) => friend.id)
        }
    };
}

export function getMockNotificationsSeed() {
    return {
        v1: mockNotifications,
        v2: mockNotificationsV2
    };
}

export function getMockNotesSeed() {
    return mockUserNotes;
}

export function getMockMemosSeed() {
    return {
        users: mockFriends.slice(0, 40).map((friend, index) => ({
            userId: friend.id,
            editedAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T10:00:00.000Z`,
            memo: `Memo for ${friend.displayName}`
        })),
        worlds: mockWorlds.slice(0, 24).map((world, index) => ({
            worldId: world.id,
            editedAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T10:30:00.000Z`,
            memo: `World memo ${index + 1}`
        })),
        avatars: mockAvatars.slice(0, 24).map((avatar, index) => ({
            avatarId: avatar.id,
            editedAt: `2026-03-${String((index % 14) + 1).padStart(2, '0')}T11:00:00.000Z`,
            memo: `Avatar memo ${index + 1}`
        }))
    };
}

export function getMockCredentials() {
    return {
        username: MOCK_CREDENTIALS.username,
        password: MOCK_CREDENTIALS.password
    };
}
