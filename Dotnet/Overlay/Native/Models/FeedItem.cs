using System.Text.Json.Serialization;

namespace VRCX.Overlay.Native.Models;

/// <summary>
/// Represents a single wrist feed entry. Fields are optional depending on the feed type.
/// JSON property names use camelCase to match the JS payload.
/// </summary>
public class FeedItem
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; }

    [JsonPropertyName("created_at")]
    public string CreatedAt { get; set; }

    [JsonPropertyName("isFriend")]
    public bool IsFriend { get; set; }

    [JsonPropertyName("isFavorite")]
    public bool IsFavorite { get; set; }

    [JsonPropertyName("location")]
    public string Location { get; set; }

    [JsonPropertyName("worldName")]
    public string WorldName { get; set; }

    [JsonPropertyName("groupName")]
    public string GroupName { get; set; }

    [JsonPropertyName("instanceDisplayName")]
    public string InstanceDisplayName { get; set; }

    [JsonPropertyName("isTraveling")]
    public bool IsTraveling { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; }

    [JsonPropertyName("previousStatus")]
    public string PreviousStatus { get; set; }

    [JsonPropertyName("statusDescription")]
    public string StatusDescription { get; set; }

    [JsonPropertyName("previousStatusDescription")]
    public string PreviousStatusDescription { get; set; }

    [JsonPropertyName("tagColour")]
    public string TagColour { get; set; }

    [JsonPropertyName("senderUsername")]
    public string SenderUsername { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; }

    [JsonPropertyName("data")]
    public string Data { get; set; }

    [JsonPropertyName("text")]
    public string Text { get; set; }

    [JsonPropertyName("previousDisplayName")]
    public string PreviousDisplayName { get; set; }

    [JsonPropertyName("trustLevel")]
    public string TrustLevel { get; set; }

    [JsonPropertyName("previousTrustLevel")]
    public string PreviousTrustLevel { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; }

    [JsonPropertyName("releaseStatus")]
    public string ReleaseStatus { get; set; }

    [JsonPropertyName("videoName")]
    public string VideoName { get; set; }

    [JsonPropertyName("videoUrl")]
    public string VideoUrl { get; set; }

    [JsonPropertyName("instanceId")]
    public string InstanceId { get; set; }

    // Nested details for invite-type notifications
    [JsonPropertyName("details")]
    public FeedItemDetails Details { get; set; }
}

public class FeedItemDetails
{
    [JsonPropertyName("worldId")]
    public string WorldId { get; set; }

    [JsonPropertyName("worldName")]
    public string WorldName { get; set; }

    [JsonPropertyName("inviteMessage")]
    public string InviteMessage { get; set; }

    [JsonPropertyName("requestMessage")]
    public string RequestMessage { get; set; }

    [JsonPropertyName("responseMessage")]
    public string ResponseMessage { get; set; }
}
