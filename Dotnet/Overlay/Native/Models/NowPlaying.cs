using System.Text.Json.Serialization;

namespace VRCX.Overlay.Native.Models;

public class NowPlaying
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("length")]
    public double Length { get; set; }

    [JsonPropertyName("startTime")]
    public double StartTime { get; set; }

    [JsonPropertyName("elapsed")]
    public double Elapsed { get; set; }

    [JsonPropertyName("percentage")]
    public double Percentage { get; set; }

    [JsonPropertyName("remainingText")]
    public string RemainingText { get; set; } = "";

    [JsonPropertyName("playing")]
    public bool Playing { get; set; }
}
