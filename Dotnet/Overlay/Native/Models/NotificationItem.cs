using System.Text.Json.Serialization;

namespace VRCX.Overlay.Native.Models;

/// <summary>
/// Represents a notification (Noty) queued for the HMD overlay.
/// This is the deserialized payload from playNoty calls.
/// The 'noty' field contains the actual notification data, 'message' and 'image' are extra display hints.
/// </summary>
public class NotificationPayload
{
    [JsonPropertyName("noty")]
    public NotyData Noty { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; }

    [JsonPropertyName("image")]
    public string Image { get; set; }
}

public class NotyData
{
    [JsonPropertyName("type")]
    public string Type { get; set; }

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; }

    [JsonPropertyName("senderUsername")]
    public string SenderUsername { get; set; }

    [JsonPropertyName("location")]
    public string Location { get; set; }

    [JsonPropertyName("worldName")]
    public string WorldName { get; set; }

    [JsonPropertyName("groupName")]
    public string GroupName { get; set; }

    [JsonPropertyName("instanceId")]
    public string InstanceId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; }

    [JsonPropertyName("statusDescription")]
    public string StatusDescription { get; set; }

    [JsonPropertyName("previousDisplayName")]
    public string PreviousDisplayName { get; set; }

    [JsonPropertyName("trustLevel")]
    public string TrustLevel { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("notyName")]
    public string NotyName { get; set; }

    [JsonPropertyName("message")]
    public string NotyMessage { get; set; }

    [JsonPropertyName("text")]
    public string Text { get; set; }

    [JsonPropertyName("data")]
    public string Data { get; set; }

    [JsonPropertyName("details")]
    public NotyDetails Details { get; set; }
}

public class NotyDetails
{
    [JsonPropertyName("worldId")]
    public string WorldId { get; set; }

    [JsonPropertyName("worldName")]
    public string WorldName { get; set; }
}

/// <summary>
/// Internal notification with render state (timing, animation alpha).
/// </summary>
public class NotificationItem
{
    public string Text { get; set; }
    public long CreatedAt { get; set; }
    public int Timeout { get; set; }
    public float Alpha { get; set; } = 1f;

    /// <summary>Animation phase: 0=entering, 1=visible, 2=exiting, 3=done</summary>
    public int Phase { get; set; }
    public long PhaseStartTime { get; set; }
}
