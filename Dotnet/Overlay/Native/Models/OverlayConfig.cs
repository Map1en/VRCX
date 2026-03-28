namespace VRCX.Overlay.Native.Models;

public class OverlayConfig
{
    public bool OverlayNotifications { get; set; }
    public bool HideDevicesFromFeed { get; set; }
    public bool VrOverlayCpuUsage { get; set; }
    public bool MinimalFeed { get; set; }
    public string NotificationPosition { get; set; } = "topRight";
    public int NotificationTimeout { get; set; } = 6000;
    public int PhotonOverlayMessageTimeout { get; set; } = 60000;
    public string NotificationTheme { get; set; } = "relax";
    public bool BackgroundEnabled { get; set; }
    public bool DtHour12 { get; set; }
    public bool PcUptimeOnFeed { get; set; }
    public string AppLanguage { get; set; } = "en";
    public int NotificationOpacity { get; set; } = 100;
    public bool IsWristDisabled { get; set; }
}
