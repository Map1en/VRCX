using System;
using System.Globalization;
using Xunit;

namespace VRCX.Tests;

public class LogWatcherHelpersTests
{
    [Fact]
    public void ParseUserInfo_without_id_returns_display_name_only()
    {
        using var harness = new LogWatcherTestHarness();

        var result = harness.ParseUserInfo("Natsumi-sama");

        Assert.Equal("Natsumi-sama", result.DisplayName);
        Assert.Equal(string.Empty, result.UserId);
    }

    [Fact]
    public void ParseUserInfo_with_id_extracts_and_sanitizes_user_id()
    {
        using var harness = new LogWatcherTestHarness();

        var result = harness.ParseUserInfo("Happy User (usr_0323!83a7-748c-4fb2-94e4-bcb928e5de6b??)");

        Assert.Equal("Happy User", result.DisplayName);
        Assert.Equal("usr_032383a7-748c-4fb2-94e4-bcb928e5de6b", result.UserId);
    }

    [Fact]
    public void ParseUserInfo_keeps_supported_special_characters_in_id()
    {
        using var harness = new LogWatcherTestHarness();

        var result = harness.ParseUserInfo("Display Name (usr_test~:()-123)");

        Assert.Equal("Display Name", result.DisplayName);
        Assert.Equal("usr_test~:()-123", result.UserId);
    }

    [Fact]
    public void ConvertLogTimeToIso_formats_valid_timestamp_using_utc()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "2023.10.05 14:30:45 Log        -  anything";

        var expected = DateTime.ParseExact(
                line.Substring(0, 19),
                "yyyy.MM.dd HH:mm:ss",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None)
            .ToUniversalTime()
            .ToString("yyyy'-'MM'-'dd'T'HH':'mm':'ss'.'fff'Z'", CultureInfo.InvariantCulture);

        var result = harness.ConvertLogTimeToIso(line);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void ConvertLogTimeToIso_invalid_timestamp_falls_back_near_current_utc_time()
    {
        using var harness = new LogWatcherTestHarness();
        const string line = "xxxxxxxxxxxxxxxxxxx definitely not a timestamp";
        var before = DateTime.UtcNow.AddSeconds(-1);

        var result = harness.ConvertLogTimeToIso(line);

        var after = DateTime.UtcNow.AddSeconds(1);
        var parsed = harness.ParseIsoAsUtc(result);
        Assert.InRange(parsed, before, after);
    }
}

