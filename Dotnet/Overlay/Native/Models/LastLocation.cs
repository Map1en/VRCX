using System.Text.Json;
using System.Text.Json.Serialization;

namespace VRCX.Overlay.Native.Models;

public class LastLocation
{
    [JsonPropertyName("date")]
    public long? Date { get; set; }

    [JsonPropertyName("location")]
    public string Location { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("playerList")]
    public JsonElement[] PlayerList { get; set; } = [];

    [JsonPropertyName("friendList")]
    public JsonElement[] FriendList { get; set; } = [];

    [JsonPropertyName("progressPie")]
    public bool ProgressPie { get; set; }

    [JsonPropertyName("onlineFor")]
    public long? OnlineFor { get; set; }
}
