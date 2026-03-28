using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using NLog;
using VRCX.Overlay.Native.Models;

namespace VRCX.Overlay.Native;

/// <summary>
/// Thread-safe state container for the native VR overlay.
/// Updated from the main thread via ExecuteVrOverlayFunction; read by the VR render thread.
/// </summary>
public class NativeOverlayState
{
    private static readonly Logger logger = LogManager.GetCurrentClassLogger();
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly object _lock = new();

    public OverlayConfig Config { get; private set; } = new();
    public List<FeedItem> WristFeed { get; private set; } = [];
    public LastLocation LastLocation { get; private set; } = new();
    public NowPlaying NowPlaying { get; private set; } = new();
    public int OnlineFriendCount { get; private set; }
    public ConcurrentQueue<NotificationItem> NotificationQueue { get; } = new();
    public List<HudFeedEntry> HudFeed { get; private set; } = [];
    public List<HudTimeoutEntry> HudTimeout { get; private set; } = [];

    // System stats (updated by VR thread directly)
    public float CpuUsage;
    public double Uptime;
    public bool CpuUsageEnabled;
    public bool PcUptimeEnabled;

    /// <summary>
    /// Whether any state has changed since the last render.
    /// </summary>
    public volatile bool IsDirty = true;

    /// <summary>
    /// Process an overlay function call from the main thread.
    /// This replaces the old WebSocket → CEF → $vr.xxx(json) pipeline.
    /// </summary>
    public void ProcessFunction(string function, string json)
    {
        try
        {
            lock (_lock)
            {
                switch (function)
                {
                    case "configUpdate":
                        Config = JsonSerializer.Deserialize<OverlayConfig>(json, JsonOptions) ?? new OverlayConfig();
                        CpuUsageEnabled = Config.VrOverlayCpuUsage;
                        PcUptimeEnabled = Config.PcUptimeOnFeed;
                        logger.Info("Native overlay config updated");
                        break;

                    case "wristFeedUpdate":
                        WristFeed = JsonSerializer.Deserialize<List<FeedItem>>(json, JsonOptions) ?? [];
                        break;

                    case "lastLocationUpdate":
                        LastLocation = JsonSerializer.Deserialize<LastLocation>(json, JsonOptions) ?? new LastLocation();
                        break;

                    case "nowPlayingUpdate":
                        NowPlaying = JsonSerializer.Deserialize<NowPlaying>(json, JsonOptions) ?? new NowPlaying();
                        break;

                    case "updateOnlineFriendCount":
                        if (int.TryParse(json, out var count))
                            OnlineFriendCount = count;
                        break;

                    case "playNoty":
                        EnqueueNotification(json);
                        break;

                    case "notyClear":
                        while (NotificationQueue.TryDequeue(out _)) { }
                        break;

                    case "addEntryHudFeed":
                        AddHudFeed(json);
                        break;

                    case "updateHudFeedTag":
                        UpdateHudFeedTag(json);
                        break;

                    case "updateHudTimeout":
                        HudTimeout = JsonSerializer.Deserialize<List<HudTimeoutEntry>>(json, JsonOptions) ?? [];
                        break;

                    // Functions that existed in the CEF overlay but are no longer needed:
                    // refreshCustomScript, setDatetimeFormat, setAppLanguage, statusClass,
                    // trackingResultToClass, updateFeedLength, updateStatsLoop, etc.
                    // These are handled natively now.
                    default:
                        logger.Trace("Unhandled overlay function: {0}", function);
                        break;
                }
            }

            IsDirty = true;
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error processing overlay function: {0}", function);
        }
    }

    /// <summary>
    /// Get a snapshot of the current state for rendering under the lock.
    /// </summary>
    public StateSnapshot GetSnapshot()
    {
        lock (_lock)
        {
            return new StateSnapshot
            {
                Config = Config,
                WristFeed = new List<FeedItem>(WristFeed),
                LastLocation = LastLocation,
                NowPlaying = NowPlaying,
                OnlineFriendCount = OnlineFriendCount,
                HudFeed = new List<HudFeedEntry>(HudFeed),
                HudTimeout = new List<HudTimeoutEntry>(HudTimeout),
                CpuUsage = CpuUsage,
                Uptime = Uptime
            };
        }
    }

    private void EnqueueNotification(string json)
    {
        try
        {
            var payload = JsonSerializer.Deserialize<NotificationPayload>(json, JsonOptions);
            if (payload?.Noty == null) return;

            var text = BuildNotificationText(payload);
            if (string.IsNullOrEmpty(text)) return;

            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var item = new NotificationItem
            {
                Text = text,
                CreatedAt = now,
                Timeout = Config.NotificationTimeout,
                Alpha = 0f,
                Phase = 0,
                PhaseStartTime = now
            };
            NotificationQueue.Enqueue(item);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error enqueuing notification");
        }
    }

    private static string BuildNotificationText(NotificationPayload payload)
    {
        var n = payload.Noty;
        var msg = payload.Message ?? "";
        return n.Type switch
        {
            "OnPlayerJoined" => $"{n.DisplayName} has joined",
            "OnPlayerLeft" => $"{n.DisplayName} has left",
            "OnPlayerJoining" => $"{n.DisplayName} is joining",
            "GPS" => $"{n.DisplayName} is in {n.WorldName ?? n.Location}",
            "Online" => $"{n.DisplayName} has logged in" + (string.IsNullOrEmpty(n.WorldName) ? "" : $" to {n.WorldName}"),
            "Offline" => $"{n.DisplayName} has logged out",
            "Status" => $"{n.DisplayName} status is now {n.Status} {n.StatusDescription}",
            "invite" => $"{n.SenderUsername} has invited you to {n.Details?.WorldName ?? ""}{msg}",
            "requestInvite" => $"{n.SenderUsername} has requested an invite {msg}",
            "inviteResponse" => $"{n.SenderUsername} has responded to your invite {msg}",
            "requestInviteResponse" => $"{n.SenderUsername} has responded to your invite request {msg}",
            "friendRequest" => $"{n.SenderUsername} has sent you a friend request",
            "Friend" => $"{n.DisplayName} is now your friend",
            "Unfriend" => $"{n.DisplayName} is no longer your friend",
            "TrustLevel" => $"{n.DisplayName} trust level is now {n.TrustLevel}",
            "DisplayName" => $"{n.PreviousDisplayName} changed their name to {n.DisplayName}",
            "boop" => n.NotyMessage ?? "",
            "groupChange" => $"{n.SenderUsername} {n.NotyMessage}",
            "group.announcement" or "group.informative" or "group.invite" or
            "group.joinRequest" or "group.transfer" or "group.queueReady" or
            "instance.closed" => n.NotyMessage ?? "",
            "PortalSpawn" => string.IsNullOrEmpty(n.DisplayName)
                ? "User has spawned a portal"
                : $"{n.DisplayName} has spawned a portal to {n.WorldName ?? ""}",
            "AvatarChange" => $"{n.DisplayName} changed into avatar {n.Name}",
            "ChatBoxMessage" => $"{n.DisplayName} said {n.Text}",
            "Event" => n.Data ?? "",
            "External" => n.NotyMessage ?? "",
            "VideoPlay" => $"Now playing: {n.NotyName}",
            "BlockedOnPlayerJoined" => $"Blocked user {n.DisplayName} has joined",
            "BlockedOnPlayerLeft" => $"Blocked user {n.DisplayName} has left",
            "MutedOnPlayerJoined" => $"Muted user {n.DisplayName} has joined",
            "MutedOnPlayerLeft" => $"Muted user {n.DisplayName} has left",
            "Blocked" => $"{n.DisplayName} has blocked you",
            "Unblocked" => $"{n.DisplayName} has unblocked you",
            "Muted" => $"{n.DisplayName} has muted you",
            "Unmuted" => $"{n.DisplayName} has unmuted you",
            _ => ""
        };
    }

    private void AddHudFeed(string json)
    {
        try
        {
            var entry = JsonSerializer.Deserialize<HudFeedEntry>(json, JsonOptions);
            if (entry == null) return;

            int combo = 1;
            HudFeed.RemoveAll(item =>
            {
                if (item.DisplayName == entry.DisplayName && item.Text == entry.Text)
                {
                    combo = item.Combo + 1;
                    return true;
                }
                return false;
            });

            entry.Time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            entry.Combo = combo;
            HudFeed.Insert(0, entry);

            CleanHudFeed();
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error adding HUD feed entry");
        }
    }

    private void UpdateHudFeedTag(string json)
    {
        try
        {
            var tagRef = JsonSerializer.Deserialize<HudFeedEntry>(json, JsonOptions);
            if (tagRef == null) return;
            foreach (var item in HudFeed)
            {
                if (item.UserId == tagRef.UserId)
                    item.Colour = tagRef.Colour;
            }
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error updating HUD feed tag");
        }
    }

    /// <summary>
    /// Clean expired HUD feed entries. Called from the VR thread periodically.
    /// </summary>
    public void CleanHudFeed()
    {
        lock (_lock)
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var timeout = Config.PhotonOverlayMessageTimeout;
            HudFeed.RemoveAll(item => item.Time + timeout < now);
            if (HudFeed.Count > 10)
                HudFeed.RemoveRange(10, HudFeed.Count - 10);
        }
    }
}

/// <summary>
/// Immutable snapshot of the overlay state for rendering.
/// </summary>
public class StateSnapshot
{
    public OverlayConfig Config { get; init; }
    public List<FeedItem> WristFeed { get; init; }
    public LastLocation LastLocation { get; init; }
    public NowPlaying NowPlaying { get; init; }
    public int OnlineFriendCount { get; init; }
    public List<HudFeedEntry> HudFeed { get; init; }
    public List<HudTimeoutEntry> HudTimeout { get; init; }
    public float CpuUsage { get; init; }
    public double Uptime { get; init; }
}
