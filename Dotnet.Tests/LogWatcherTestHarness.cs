using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading;

namespace VRCX.Tests;

internal sealed class LogWatcherTestHarness : IDisposable
{
    private const BindingFlags InstanceFlags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
    private const BindingFlags StaticFlags = BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;
    private const BindingFlags ContextFieldFlags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic;
    private static readonly Type WatcherType = typeof(LogWatcher);
    private static readonly Type ContextType = WatcherType.GetNestedType("LogContext", BindingFlags.NonPublic)!;
    private readonly string tempDirectory;

    public LogWatcher Watcher { get; }
    public object LogContext { get; }
    public FileInfo FileInfo { get; }

    public LogWatcherTestHarness()
    {
        tempDirectory = Path.Combine(Path.GetTempPath(), "VRCX.LogWatcher.Tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDirectory);

        Watcher = new LogWatcher();
        LogContext = CreateLogContext();
        FileInfo = new FileInfo(Path.Combine(tempDirectory, "output_log_test.txt"));

        SetField("m_LogListLock", new ReaderWriterLockSlim());
        SetField("m_LogList", new List<string[]>());
        SetField("m_LogContextMap", Activator.CreateInstance(typeof(Dictionary<,>).MakeGenericType(typeof(string), ContextType))!);
        SetField("m_LogDirectoryInfo", new DirectoryInfo(tempDirectory));
        SetField("m_FirstRun", true);
        SetField("tillDate", DateTime.MinValue);
    }

    public string TempDirectory => tempDirectory;

    public object CreateLogContext()
    {
        return Activator.CreateInstance(ContextType)!;
    }

    public (string DisplayName, string UserId) ParseUserInfo(string userInfo)
    {
        var method = WatcherType.GetMethod("ParseUserInfo", StaticFlags)!;
        return ((string DisplayName, string UserId))method.Invoke(null, new object?[] { userInfo })!;
    }

    public string ConvertLogTimeToIso(string line)
    {
        var method = WatcherType.GetMethod("ConvertLogTimeToISO8601", InstanceFlags)!;
        return (string)method.Invoke(Watcher, new object?[] { line })!;
    }

    public bool InvokeParser(string methodName, string line, int offset = 34, FileInfo? fileInfo = null, object? logContext = null)
    {
        var method = WatcherType.GetMethod(methodName, InstanceFlags)!;
        var parameterCount = method.GetParameters().Length;

        return parameterCount switch
        {
            2 => (bool)method.Invoke(Watcher, new object?[] { fileInfo ?? FileInfo, line })!,
            4 => (bool)method.Invoke(Watcher, new object?[] { fileInfo ?? FileInfo, logContext ?? LogContext, line, offset })!,
            _ => throw new InvalidOperationException($"Unexpected parameter count for {methodName}: {parameterCount}")
        };
    }

    public void InvokeParseLog(FileInfo fileInfo, object? logContext = null)
    {
        var method = WatcherType.GetMethod("ParseLog", InstanceFlags)!;
        method.Invoke(Watcher, new object?[] { fileInfo, logContext ?? LogContext });
    }

    public void InvokeUpdate()
    {
        var method = WatcherType.GetMethod("Update", InstanceFlags)!;
        method.Invoke(Watcher, null);
    }

    public IReadOnlyList<string[]> GetLogItems()
    {
        return GetField<List<string[]>>("m_LogList").Select(item => item.ToArray()).ToList();
    }

    public void ClearLogItems()
    {
        GetField<List<string[]>>("m_LogList").Clear();
    }

    public void AddLogItem(params string[] item)
    {
        GetField<List<string[]>>("m_LogList").Add(item);
    }

    public List<string> DrainQueuedLines()
    {
        return Watcher.GetLogLines();
    }

    public string[][] GetBufferedItems()
    {
        return Watcher.Get();
    }

    public void SetFirstRun(bool value)
    {
        SetField("m_FirstRun", value);
    }

    public void SetTillDate(DateTime value)
    {
        SetField("tillDate", value);
    }

    public T GetContextField<T>(string fieldName)
    {
        return (T)ContextType.GetField(fieldName, ContextFieldFlags)!.GetValue(LogContext)!;
    }

    public void SetContextField(string fieldName, object? value)
    {
        ContextType.GetField(fieldName, ContextFieldFlags)!.SetValue(LogContext, value);
    }

    public int GetContextMapCount()
    {
        var map = (ICollection)GetField<object>("m_LogContextMap");
        return map.Count;
    }

    public DateTime ParseIsoAsUtc(string value)
    {
        return DateTime.ParseExact(
            value,
            "yyyy-MM-ddTHH:mm:ss.fffZ",
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
    }

    private T GetField<T>(string fieldName)
    {
        return (T)WatcherType.GetField(fieldName, InstanceFlags)!.GetValue(Watcher)!;
    }

    private void SetField(string fieldName, object? value)
    {
        WatcherType.GetField(fieldName, InstanceFlags)!.SetValue(Watcher, value);
    }

    public void Dispose()
    {
        GetField<ReaderWriterLockSlim>("m_LogListLock").Dispose();

        if (Directory.Exists(tempDirectory))
            Directory.Delete(tempDirectory, recursive: true);
    }
}

