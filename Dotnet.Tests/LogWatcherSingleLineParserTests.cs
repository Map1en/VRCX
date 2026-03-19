using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace VRCX.Tests;

public class LogWatcherSingleLineParserTests
{
    public static TheoryData<string, string, string[]> EmittingParserCases => new()
    {
        {
            "ParseLogScreenshot",
            "2023.02.08 12:31:35 Log        -  [VRC Camera] Took screenshot to: C:\\Users\\Tea\\Pictures\\VRChat\\shot.png",
            new[] { "screenshot", @"C:\Users\Tea\Pictures\VRChat\shot.png" }
        },
        {
            "ParseLogPortalSpawn",
            "2022.07.29 18:40:37 Log        -  [Behaviour] Instantiated a (Clone [800004] Portals/PortalInternalDynamic)",
            new[] { "portal-spawn" }
        },
        {
            "ParseLogJoinBlocked",
            "2021.04.07 09:34:37 Error      -  [Behaviour] Master is not sending any events! Moving to a new instance.",
            new[] { "event", "Joining instance blocked by master" }
        },
        {
            "ParseLogAvatarPedestalChange",
            "2021.05.07 10:48:19 Log        -  [Network Processing] RPC invoked SwitchAvatar on AvatarPedestal for User",
            new[] { "event", "User changed avatar pedestal" }
        },
        {
            "ParseLogWorldVRCX",
            "2023.04.01 10:20:30 Log        -  [VRCX] VideoPlay(PyPyDance) \"https://example.com/video.mp4\",0.1,2.3,\"Track\"",
            new[] { "vrcx", "VideoPlay(PyPyDance) \"https://example.com/video.mp4\",0.1,2.3,\"Track\"" }
        },
        {
            "ParseLogVideoChange",
            "2021.04.20 13:37:59 Log        -  [Video Playback] Attempting to resolve URL 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'",
            new[] { "video-play", "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
        },
        {
            "ParseLogAVProVideoChange",
            "2023.05.12 15:53:48 Log        -  [Video Playback] Resolving URL 'rtspt://topaz.chat/live/kiriri520'",
            new[] { "video-play", "rtspt://topaz.chat/live/kiriri520" }
        },
        {
            "ParseLogSDK2VideoPlay",
            "2021.04.23 13:12:25 Log        -  User Natsumi-sama added URL https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            new[] { "video-play", "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "Natsumi-sama" }
        },
        {
            "ParseLogUsharpVideoPlay",
            "2021.12.12 05:51:58 Log        -  [USharpVideo] Started video load for URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1s, requested by ʜ ᴀ ᴘ ᴘ ʏ",
            new[] { "video-play", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1s", "ʜ ᴀ ᴘ ᴘ ʏ" }
        },
        {
            "ParseLogUsharpVideoSync",
            "2022.01.16 05:20:23 Log        -  [USharpVideo] Syncing video to 2.52",
            new[] { "video-sync", "2.52" }
        },
        {
            "ParseLogNotification",
            "2021.01.03 05:48:58 Log        -  [API] Received Notification: < hello world > received at 01/02/2021 16:48:58 UTC",
            new[] { "notification", " hello world " }
        },
        {
            "ParseLogAPIRequest",
            "2021.10.03 09:49:50 Log        -  [API] [110] Sending Get request to https://api.vrchat.cloud/api/1/worlds?foo=bar",
            new[] { "api-request", "https://api.vrchat.cloud/api/1/worlds?foo=bar" }
        },
        {
            "ParseLogAvatarChange",
            "2023.11.05 14:45:57 Log        -  [Behaviour] Switching K․MOG to avatar MoeSera",
            new[] { "avatar-change", "K․MOG", "MoeSera" }
        },
        {
            "ParseLogStringDownload",
            "2023.03.23 11:37:21 Log        -  [String Download] Attempting to load String from URL 'https://pastebin.com/raw/BaW6NL2L'",
            new[] { "resource-load-string", "https://pastebin.com/raw/BaW6NL2L" }
        },
        {
            "ParseLogImageDownload",
            "2023.03.23 11:32:25 Log        -  [Image Download] Attempting to load image from URL 'https://i.imgur.com/lCfUMX0.jpeg'",
            new[] { "resource-load-image", "https://i.imgur.com/lCfUMX0.jpeg" }
        },
        {
            "ParseVoteKick",
            "2023.06.02 01:08:04 Log        -  [Behaviour] Received executive message: You have been kicked from the instance by majority vote",
            new[] { "event", "You have been kicked from the instance by majority vote" }
        },
        {
            "ParseFailedToJoin",
            "2023.09.01 10:42:19 Warning    -  [Behaviour] Failed to join instance 'wrld_123' due to 'Outdated version'",
            new[] { "event", "Failed to join instance 'wrld_123' due to 'Outdated version'" }
        },
        {
            "ParseOscFailedToStart",
            "2023.09.26 04:12:57 Warning    -  Could not Start OSC: Address already in use",
            new[] { "event", "VRChat couldn't start OSC server, \"Could not Start OSC: Address already in use\"" }
        },
        {
            "ParseInstanceResetWarning",
            "2024.08.30 01:43:40 Log        -  [ModerationManager] This instance will be reset in 60 minutes due to its age.",
            new[] { "event", "This instance will be reset in 60 minutes due to its age." }
        },
        {
            "ParseVoteKickInitiation",
            "2024.08.29 02:04:47 Log        -  [ModerationManager] A vote kick has been initiated against Player 849d, do you agree?",
            new[] { "event", "A vote kick has been initiated against Player 849d, do you agree?" }
        },
        {
            "ParseVoteKickSuccess",
            "2024.08.29 02:05:21 Log        -  [ModerationManager] Vote to kick Player 849d succeeded",
            new[] { "event", "Vote to kick Player 849d succeeded" }
        },
        {
            "ParseOpenVRInit",
            "2023.04.22 16:52:28 Log        -  Initializing VRSDK.",
            new[] { "openvr-init" }
        },
        {
            "ParseDesktopMode",
            "2023.04.22 16:54:18 Log        -  VR Disabled",
            new[] { "desktop-mode" }
        }
    };

    [Theory]
    [MemberData(nameof(EmittingParserCases))]
    public void Emitting_parsers_append_expected_log_item(string methodName, string line, string[] expectedTail)
    {
        using var harness = new LogWatcherTestHarness();

        var handled = harness.InvokeParser(methodName, line);

        Assert.True(handled);
        var expected = new[] { harness.FileInfo.Name, harness.ConvertLogTimeToIso(line) }.Concat(expectedTail).ToArray();
        var items = harness.GetLogItems();
        var item = Assert.Single(items);
        Assert.Equal(expected, item);
    }

    [Fact]
    public void ParseLogWorldDataVRCX_returns_true_without_emitting_any_item()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2024.03.01 01:02:03 Log        -  [VRCX-World] store:test:testvalue";

        var handled = harness.InvokeParser("ParseLogWorldDataVRCX", line);

        Assert.True(handled);
        Assert.Empty(harness.GetLogItems());
    }

    [Fact]
    public void ParseLogStringDownload_ignores_own_localhost_requests()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2023.03.23 11:37:21 Log        -  [String Download] Attempting to load String from URL 'http://localhost:22500/raw'";

        var handled = harness.InvokeParser("ParseLogStringDownload", line);

        Assert.True(handled);
        Assert.Empty(harness.GetLogItems());
    }

    [Fact]
    public void ParseLogImageDownload_ignores_own_loopback_requests()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2023.03.23 11:32:25 Log        -  [Image Download] Attempting to load image from URL 'http://127.0.0.1:22500/image'";

        var handled = harness.InvokeParser("ParseLogImageDownload", line);

        Assert.True(handled);
        Assert.Empty(harness.GetLogItems());
    }
}

