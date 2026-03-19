using System.Linq;
using System.Text.Json;
using Xunit;

namespace VRCX.Tests;

public class LogWatcherStatefulParserTests
{
    [Fact]
    public void ParseLogLocation_stores_world_name_then_emits_join_location_and_resets_related_state()
    {
        using var harness = new LogWatcherTestHarness();
        harness.SetContextField("LastAudioDevice", "Microphone");
        harness.GetContextField<System.Collections.Generic.HashSet<string>>("VideoPlaybackErrors").Add("old error");
        harness.Watcher.VrcClosedGracefully = true;

        const string enterLine = "2021.06.23 12:02:56 Log        -  [Behaviour] Entering Room: VRChat Home";
        const string joinLine = "2021.06.23 12:03:00 Log        -  [Behaviour] Joining wrld_abc/123:1~private(usr_123)";

        var enterHandled = harness.InvokeParser("ParseLogLocation", enterLine);
        var joinHandled = harness.InvokeParser("ParseLogLocation", joinLine);

        Assert.True(enterHandled);
        Assert.True(joinHandled);
        Assert.Equal("VRChat Home", harness.GetContextField<string>("RecentWorldName"));
        Assert.Equal(string.Empty, harness.GetContextField<string>("LastAudioDevice"));
        Assert.Empty(harness.GetContextField<System.Collections.Generic.HashSet<string>>("VideoPlaybackErrors"));
        Assert.False(harness.Watcher.VrcClosedGracefully);

        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal(
            new[]
            {
                harness.FileInfo.Name,
                harness.ConvertLogTimeToIso(joinLine),
                "location",
                "wrld_abc123:1~private(usr_123)",
                "VRChat Home"
            },
            item);
    }

    [Fact]
    public void ParseLogLocation_ignores_joining_or_creating_room_lines()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2020.10.31 23:36:31 Log        -  [Behaviour] Joining or Creating Room: VRChat Home";

        var handled = harness.InvokeParser("ParseLogLocation", line);

        Assert.False(handled);
        Assert.Empty(harness.GetLogItems());
    }

    [Fact]
    public void ParseLogLocationDestination_tracks_destination_until_left_room()
    {
        using var harness = new LogWatcherTestHarness();
        const string fetchLine = "2021.09.02 00:49:15 Log        -  [Behaviour] Destination fetching: wrld_abc/123:2~private(usr_456)";
        const string leftLine = "2022.08.13 18:57:00 Log        -  [Behaviour] OnLeftRoom";

        var fetchHandled = harness.InvokeParser("ParseLogLocationDestination", fetchLine);
        var leftHandled = harness.InvokeParser("ParseLogLocationDestination", leftLine);

        Assert.True(fetchHandled);
        Assert.True(leftHandled);
        Assert.Equal(string.Empty, harness.GetContextField<string>("LocationDestination"));

        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal(
            new[]
            {
                harness.FileInfo.Name,
                harness.ConvertLogTimeToIso(leftLine),
                "location-destination",
                "wrld_abc123:2~private(usr_456)"
            },
            item);
    }

    [Fact]
    public void ParseLogOnPlayerJoinedOrLeft_emits_player_joined_event_with_optional_user_id()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2021.12.12 11:47:22 Log        -  [Behaviour] OnPlayerJoined Natsumi-sama (usr_032383a7-748c-4fb2-94e4-bcb928e5de6b)";

        var handled = harness.InvokeParser("ParseLogOnPlayerJoinedOrLeft", line);

        Assert.True(handled);
        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal(
            new[]
            {
                harness.FileInfo.Name,
                harness.ConvertLogTimeToIso(line),
                "player-joined",
                "Natsumi-sama",
                "usr_032383a7-748c-4fb2-94e4-bcb928e5de6b"
            },
            item);
    }

    [Fact]
    public void ParseLogOnPlayerJoinedOrLeft_emits_player_left_event_with_optional_user_id()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2021.12.12 11:53:14 Log        -  [Behaviour] OnPlayerLeft Rize♡ (usr_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee)";

        var handled = harness.InvokeParser("ParseLogOnPlayerJoinedOrLeft", line);

        Assert.True(handled);
        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal(
            new[]
            {
                harness.FileInfo.Name,
                harness.ConvertLogTimeToIso(line),
                "player-left",
                "Rize♡",
                "usr_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
            },
            item);
    }

    [Fact]
    public void ParseLogOnPlayerJoinedOrLeft_ignores_colon_formatted_join_entries()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2021.12.12 11:47:22 Log        -  [Behaviour] OnPlayerJoined:Unnamed";

        var handled = harness.InvokeParser("ParseLogOnPlayerJoinedOrLeft", line);

        Assert.False(handled);
        Assert.Empty(harness.GetLogItems());
    }

    [Fact]
    public void ParseLogShaderKeywordsLimit_only_emits_the_first_time()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2021.08.20 04:20:59 Error      -  Maximum number (384) of shader global keywords exceeded, keyword _FOG_EXP2 will be ignored.";

        Assert.True(harness.InvokeParser("ParseLogShaderKeywordsLimit", line));
        Assert.True(harness.InvokeParser("ParseLogShaderKeywordsLimit", line));

        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal("event", item[2]);
        Assert.Equal("Shader Keyword Limit has been reached", item[3]);
        Assert.True(harness.GetContextField<bool>("ShaderKeywordsLimitReached"));
    }

    [Fact]
    public void ParseLogVideoError_deduplicates_repeated_errors()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2024.07.31 22:28:47 Error      -  [AVProVideo] Error: Loading failed. File not found";

        Assert.True(harness.InvokeParser("ParseLogVideoError", line));
        Assert.True(harness.InvokeParser("ParseLogVideoError", line));

        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal("event", item[2]);
        Assert.Equal("VideoError: Loading failed. File not found", item[3]);
    }

    [Fact]
    public void ParseLogVideoError_prepends_fix_link_for_youtube_bot_errors()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2021.04.08 06:40:07 Error      -  [Video Playback] ERROR: Sign in to confirm your age";

        var handled = harness.InvokeParser("ParseLogVideoError", line);

        Assert.True(handled);
        var item = Assert.Single(harness.GetLogItems());
        Assert.StartsWith("VideoError: [VRCX] Fix error with this: https://github.com/EllyVR/VRCVideoCacher", item[3]);
        Assert.Contains("Sign in to confirm your age", item[3]);
    }

    [Fact]
    public void ParseUntrustedUrl_deduplicates_repeated_entries()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2025.05.04 22:38:12 Error      -  Attempted to play an untrusted URL (Domain: localhost) that is not allowlisted for public instances.";

        Assert.True(harness.InvokeParser("ParseUntrustedUrl", line));
        Assert.True(harness.InvokeParser("ParseUntrustedUrl", line));

        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal("event", item[2]);
        Assert.Contains("Attempted to play an untrusted URL", item[3]);
    }

    [Fact]
    public void ParseLogOnAudioConfigurationChanged_emits_only_when_device_changes_after_notification()
    {
        using var harness = new LogWatcherTestHarness();
        const string initialLine = "2022.03.15 03:40:34 Log        -  [Always] uSpeak: SetInputDevice 0 (3 total) 'Index HMD Mic'";
        const string changedLine = "2022.03.15 04:02:22 Log        -  [Always] uSpeak: OnAudioConfigurationChanged - devicesChanged = True, resetting mic..";
        const string newDeviceLine = "2025.01.03 19:11:42 Log        -  [Always] uSpeak: SetInputDevice 0 (2 total) 'Microphone (NVIDIA Broadcast)'";

        Assert.True(harness.InvokeParser("ParseLogOnAudioConfigurationChanged", initialLine));
        Assert.True(harness.InvokeParser("ParseLogOnAudioConfigurationChanged", changedLine));
        Assert.True(harness.InvokeParser("ParseLogOnAudioConfigurationChanged", newDeviceLine));

        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal(
            new[]
            {
                harness.FileInfo.Name,
                harness.ConvertLogTimeToIso(newDeviceLine),
                "event",
                "Audio device changed, mic set to 'Microphone (NVIDIA Broadcast)''"
            },
            item);
        Assert.False(harness.GetContextField<bool>("AudioDeviceChanged"));
        Assert.Equal("Microphone (NVIDIA Broadcast)'", harness.GetContextField<string>("LastAudioDevice"));
    }

    [Fact]
    public void ParseApplicationQuit_sets_graceful_close_flag_and_emits_event()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2024.10.23 21:18:34 Log        -  VRCApplication: HandleApplicationQuit at 936.5161";

        var handled = harness.InvokeParser("ParseApplicationQuit", line);

        Assert.True(handled);
        Assert.True(harness.Watcher.VrcClosedGracefully);
        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal(
            new[]
            {
                harness.FileInfo.Name,
                harness.ConvertLogTimeToIso(line),
                "vrc-quit"
            },
            item);
    }

    [Fact]
    public void ParseStickerSpawn_flips_user_info_and_sanitizes_inventory_id()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2024.08.29 02:05:21 Log        -  [StickersManager] User usr_032383a7-748c-4fb2-94e4-bcb928e5de6b (Natsumi-sama) spawned sticker inv_8b380ee4-9a8a-484e-a0c3-b01290b92c6a!!!";

        var handled = harness.InvokeParser("ParseStickerSpawn", line);

        Assert.True(handled);
        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal(
            new[]
            {
                harness.FileInfo.Name,
                harness.ConvertLogTimeToIso(line),
                "sticker-spawn",
                "usr_032383a7-748c-4fb2-94e4-bcb928e5de6b",
                "Natsumi-sama",
                "inv_8b380ee4-9a8a-484e-a0c3-b01290b92c6a"
            },
            item);
    }

    [Fact]
    public void ParseLogUdonException_emits_full_line_for_pypy_dance_entries()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2022.11.29 04:27:33 Error      -  [PyPyDance] Failed to evaluate something";

        var handled = harness.InvokeParser("ParseLogUdonException", line);

        Assert.True(handled);
        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal("udon-exception", item[2]);
        Assert.Equal(line, item[3]);
    }

    [Fact]
    public void ParseLogUdonException_extracts_udon_vm_suffix_when_present()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "xxxxxxxxxxxxxxxxxxx ---> VRC.Udon.VM.UdonVMException: Boom";

        var handled = harness.InvokeParser("ParseLogUdonException", line);

        Assert.True(handled);
        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal("udon-exception", item[2]);
        Assert.Equal(" ---> VRC.Udon.VM.UdonVMException: Boom", item[3]);
    }

    [Fact]
    public void GetLogLines_returns_serialized_items_when_first_run_is_complete()
    {
        using var harness = new LogWatcherTestHarness();
        harness.SetFirstRun(false);
        const string line = "2023.02.08 12:31:35 Log        -  [VRC Camera] Took screenshot to: C:\\Users\\Tea\\Pictures\\VRChat\\shot.png";

        Assert.True(harness.InvokeParser("ParseLogScreenshot", line));

        var expectedItem = harness.GetLogItems().Single();
        var queuedLines = harness.DrainQueuedLines();
        Assert.Single(queuedLines);
        Assert.Equal(JsonSerializer.Serialize(expectedItem), queuedLines[0]);
        Assert.Empty(harness.DrainQueuedLines());
    }

    [Fact]
    public void Get_returns_buffered_items_in_batches_of_1000()
    {
        using var harness = new LogWatcherTestHarness();
        for (var i = 0; i < 1005; i++)
            harness.AddLogItem("file", i.ToString());

        var firstBatch = harness.GetBufferedItems();
        var secondBatch = harness.GetBufferedItems();

        Assert.Equal(1000, firstBatch.Length);
        Assert.Equal(5, secondBatch.Length);
        Assert.Empty(harness.GetBufferedItems());
    }
}


