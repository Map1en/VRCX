using System.Text.Json.Serialization;

namespace VRCX.Overlay.Native.Models;

public class HudFeedEntry
{
    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; }

    [JsonPropertyName("text")]
    public string Text { get; set; }

    [JsonPropertyName("userId")]
    public string UserId { get; set; }

    [JsonPropertyName("colour")]
    public string Colour { get; set; }

    // Runtime fields (not from JSON)
    public long Time { get; set; }
    public int Combo { get; set; } = 1;
}

public class HudTimeoutEntry
{
    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; }

    [JsonPropertyName("time")]
    public string Time { get; set; }
}
