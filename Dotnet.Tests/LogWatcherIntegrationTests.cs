using System;
using System.IO;
using Xunit;

namespace VRCX.Tests;

public class LogWatcherIntegrationTests
{
    [Fact]
    public void ParseLog_reads_supported_entries_from_a_file_and_updates_position()
    {
        using var harness = new LogWatcherTestHarness();
        var filePath = Path.Combine(harness.TempDirectory, "output_log_parse.txt");
        File.WriteAllText(
            filePath,
            string.Join(
                Environment.NewLine,
                "2021.06.23 12:02:56 Log        -  [Behaviour] Entering Room: VRChat Home",
                "2021.06.23 12:03:00 Log        -  [Behaviour] Joining wrld_abc:1~private(usr_123)",
                "2023.02.08 12:31:35 Log        -  [VRC Camera] Took screenshot to: C:\\Users\\Tea\\Pictures\\VRChat\\shot.png") + Environment.NewLine);

        var fileInfo = new FileInfo(filePath);

        harness.InvokeParseLog(fileInfo);

        var items = harness.GetLogItems();
        Assert.Equal(2, items.Count);
        Assert.Equal("location", items[0][2]);
        Assert.Equal("screenshot", items[1][2]);
        Assert.Equal(fileInfo.Length, harness.GetContextField<long>("Position"));
    }

    [Fact]
    public void ParseLog_skips_entries_older_than_till_date()
    {
        using var harness = new LogWatcherTestHarness();
        harness.SetTillDate(DateTime.MaxValue);
        var filePath = Path.Combine(harness.TempDirectory, "output_log_old.txt");
        File.WriteAllText(filePath, "2021.06.23 12:03:00 Log        -  [Behaviour] Joining wrld_abc:1~private(usr_123)" + Environment.NewLine);

        harness.InvokeParseLog(new FileInfo(filePath));

        Assert.Empty(harness.GetLogItems());
        Assert.Equal(new FileInfo(filePath).Length, harness.GetContextField<long>("Position"));
    }

    [Fact]
    public void ParseLog_resumes_from_previous_position_and_only_processes_new_lines()
    {
        using var harness = new LogWatcherTestHarness();
        var filePath = Path.Combine(harness.TempDirectory, "output_log_resume.txt");
        File.WriteAllText(filePath, "2023.02.08 12:31:35 Log        -  [VRC Camera] Took screenshot to: C:\\Users\\Tea\\Pictures\\VRChat\\first.png" + Environment.NewLine);

        var fileInfo = new FileInfo(filePath);
        harness.InvokeParseLog(fileInfo);
        var firstPosition = harness.GetContextField<long>("Position");
        harness.ClearLogItems();

        File.AppendAllText(filePath, "2023.02.08 12:31:36 Log        -  [VRC Camera] Took screenshot to: C:\\Users\\Tea\\Pictures\\VRChat\\second.png" + Environment.NewLine);
        fileInfo.Refresh();

        harness.InvokeParseLog(fileInfo);

        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal("screenshot", item[2]);
        Assert.Equal(@"C:\Users\Tea\Pictures\VRChat\second.png", item[3]);
        Assert.True(harness.GetContextField<long>("Position") > firstPosition);
    }

    [Fact]
    public void Update_parses_matching_output_logs_and_removes_deleted_contexts()
    {
        using var harness = new LogWatcherTestHarness();
        var filePath = Path.Combine(harness.TempDirectory, "output_log_2024-01-01.txt");
        File.WriteAllText(filePath, "2023.02.08 12:31:35 Log        -  [VRC Camera] Took screenshot to: C:\\Users\\Tea\\Pictures\\VRChat\\shot.png" + Environment.NewLine);

        harness.InvokeUpdate();

        var item = Assert.Single(harness.GetLogItems());
        Assert.Equal("screenshot", item[2]);
        Assert.Equal(1, harness.GetContextMapCount());

        File.Delete(filePath);
        harness.InvokeUpdate();

        Assert.Equal(0, harness.GetContextMapCount());
    }
}

