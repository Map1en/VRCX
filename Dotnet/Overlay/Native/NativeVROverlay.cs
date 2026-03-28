using NLog;
using VRCX.Overlay.Native;

namespace VRCX;

/// <summary>
/// Manages the native VR overlay lifecycle.
/// Everything runs in-process.
/// </summary>
public class NativeVROverlay
{
    private static readonly Logger logger = LogManager.GetCurrentClassLogger();
    public static readonly NativeVROverlay Instance = new();
    private readonly object _lock = new();

    private NativeOverlayState _state;
    private VRCXVRNative _vrInterface;

    /// <summary>
    /// Gets the VR interface for external access (e.g. device queries from AppApi).
    /// </summary>
    public VRCXVRNative VRInterface => _vrInterface;

    public void Init()
    {
        _state = new NativeOverlayState();
        logger.Info("NativeVROverlay initialized");
    }

    public void Exit()
    {
        lock (_lock)
        {
            _vrInterface?.Exit();
            _vrInterface = null;
            _state = null;
            logger.Info("NativeVROverlay exited");
        }
    }

    /// <summary>
    /// Called by AppApiCef.SetVR to update overlay activation state.
    /// </summary>
    public void SetActive(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand)
    {
        lock (_lock)
        {
            if (active)
            {
                if (_vrInterface == null && _state != null)
                {
                    _vrInterface = new VRCXVRNative(_state);
                    _vrInterface.Init();
                    logger.Info("NativeVROverlay started native overlay");
                }

                _vrInterface?.SetActive(true, hmdOverlay, wristOverlay, menuButton, overlayHand);
                return;
            }

            if (_vrInterface == null)
                return;

            _vrInterface.SetActive(false, hmdOverlay, wristOverlay, menuButton, overlayHand);
            _vrInterface.Exit();
            _vrInterface = null;
            logger.Info("NativeVROverlay stopped native overlay");
        }
    }

    /// <summary>
    /// Called by AppApiCef.ExecuteVrOverlayFunction.
    /// Routes the function call directly to the state manager (no IPC).
    /// </summary>
    public void ExecuteVrOverlayFunction(string function, string json)
    {
        if (_vrInterface != null)
        {
            _vrInterface.ExecuteVrOverlayFunction(function, json);
            return;
        }

        _state?.ProcessFunction(function, json);
    }

    /// <summary>
    /// Get the HMD AFK state.
    /// </summary>
    public bool IsHmdAfk => _vrInterface?.IsHmdAfk ?? false;

    /// <summary>
    /// Get VR devices list.
    /// </summary>
    public string[][] GetDevices()
    {
        return _vrInterface?.GetDevices() ?? [];
    }

    /// <summary>
    /// Whether VR is currently active.
    /// </summary>
    public bool IsActive => _vrInterface?.IsActive() ?? false;

    /// <summary>
    /// Refresh the overlay.
    /// </summary>
    public void Refresh()
    {
        _vrInterface?.Refresh();
    }
}
