using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Numerics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using CefSharp;
using NLog;
using Silk.NET.Core.Native;
using Silk.NET.Direct3D11;
using Silk.NET.DXGI;
using Valve.VR;
using VRCX.Overlay.Native.Models;

namespace VRCX.Overlay.Native;

/// <summary>
/// Runs entirely in-process on a background thread (no subprocess).
/// </summary>
public class VRCXVRNative : VRCXVRInterface
{
    private static readonly Logger logger = LogManager.GetCurrentClassLogger();
    private static readonly float[] _rotation = { 0f, 0f, 0f };
    private static readonly float[] _translation = { 0f, 0f, 0f };
    private static readonly float[] _translationLeft = { -7f / 100f, -5f / 100f, 6f / 100f };
    private static readonly float[] _translationRight = { 7f / 100f, -5f / 100f, 6f / 100f };
    private static readonly float[] _rotationLeft = { 90f * (float)(Math.PI / 180f), 90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f) };
    private static readonly float[] _rotationRight = { -90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f), -90f * (float)(Math.PI / 180f) };

    private readonly NativeOverlayState _state;
    private readonly NativeOverlayRenderer _renderer;
    private readonly SystemMonitorNative _systemMonitor;
    private readonly List<NotificationItem> _activeNotifications = [];

    private readonly List<string[]> _deviceList = [];
    private readonly ReaderWriterLockSlim _deviceListLock = new();

    private bool _active;
    private bool _menuButton;
    private int _overlayHand;
    private Thread _thread;
    private DateTime _nextOverlayUpdate;

    private ulong _hmdOverlayHandle;
    private bool _hmdOverlayActive;
    private bool _hmdOverlayWasActive;

    private ulong _wristOverlayHandle;
    private bool _wristOverlayActive;
    private bool _wristOverlayWasActive;

    private const int HMD_HEIGHT = 1024;
    private const int WRIST_SIZE = 512;
    private const int TOTAL_WIDTH = 1024;
    private const int TOTAL_HEIGHT = HMD_HEIGHT + WRIST_SIZE; // 1536

    private DXGI _dxgi;
    private D3D11 _d3d11;
    private ComPtr<IDXGIFactory2> _factory;
    private ComPtr<IDXGIAdapter> _adapter;
    private ComPtr<ID3D11Device> _device;
    private ComPtr<ID3D11Multithread> _multithread;
    private ComPtr<ID3D11DeviceContext> _deviceContext;
    private ComPtr<ID3D11Texture2D> _sharedTexture;
    public VRCXVRNative(NativeOverlayState state)
    {
        _state = state;
        _renderer = new NativeOverlayRenderer();
        _systemMonitor = SystemMonitorNative.Instance;
        _thread = new Thread(ThreadLoop)
        {
            IsBackground = true,
            Name = "VRNativeOverlay"
        };
    }

    public override void Init()
    {
        _thread.Start();
    }

    public override void Exit()
    {
        logger.Info("Native overlay exiting");
        var thread = _thread;
        _thread = null;
        thread?.Interrupt();
        thread?.Join();
    }

    public override void Restart()
    {
        // For native rendering, restart by recreating the thread
        Exit();
        _thread = new Thread(ThreadLoop) { IsBackground = true, Name = "VRNativeOverlay" };
        Init();
    }

    public override void Refresh()
    {
        // Force re-render
        _state.IsDirty = true;
    }

    public override void SetActive(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand)
    {
        _active = active;
        _hmdOverlayActive = hmdOverlay;
        _wristOverlayActive = wristOverlay;
        _menuButton = menuButton;
        _overlayHand = overlayHand;

        if (_hmdOverlayActive != _hmdOverlayWasActive && _hmdOverlayHandle != 0)
        {
            OpenVR.Overlay?.DestroyOverlay(_hmdOverlayHandle);
            _hmdOverlayHandle = 0;
        }
        _hmdOverlayWasActive = _hmdOverlayActive;

        if (_wristOverlayActive != _wristOverlayWasActive && _wristOverlayHandle != 0)
        {
            OpenVR.Overlay?.DestroyOverlay(_wristOverlayHandle);
            _wristOverlayHandle = 0;
        }
        _wristOverlayWasActive = _wristOverlayActive;

        // Toggle system monitor for CPU/uptime
        _systemMonitor.Start(_state.CpuUsageEnabled || _state.PcUptimeEnabled);
    }

    public override bool IsActive()
    {
        return _active;
    }

    public override string[][] GetDevices()
    {
        _deviceListLock.EnterReadLock();
        try
        {
            return _deviceList.ToArray();
        }
        finally
        {
            _deviceListLock.ExitReadLock();
        }
    }

    public override void ExecuteVrOverlayFunction(string function, string json)
    {
        // Direct in-process routing: no WebSocket, no IPC
        _state.ProcessFunction(function, json);

        // Handle system monitor toggle from config updates
        if (function == "configUpdate")
        {
            _systemMonitor.Start(_state.CpuUsageEnabled || _state.PcUptimeEnabled);
        }
    }

    public override ConcurrentQueue<KeyValuePair<string, string>> GetExecuteVrOverlayFunctionQueue()
    {
        // Not used in native mode (no queue polling needed)
        throw new NotImplementedException("Native overlay uses direct function calls, not queues");
    }

    private unsafe void SetupTextures()
    {
        _dxgi?.Dispose();
        _dxgi = DXGI.GetApi(null);
        _d3d11?.Dispose();
        _d3d11 = D3D11.GetApi(null);

        _factory.Dispose();
        SilkMarshal.ThrowHResult(_dxgi.CreateDXGIFactory<IDXGIFactory2>(out _factory));
        _adapter.Dispose();
        SilkMarshal.ThrowHResult(_factory.EnumAdapters((uint)OpenVR.System.GetD3D9AdapterIndex(), ref _adapter));

        _device.Dispose();
        _deviceContext.Dispose();

        SilkMarshal.ThrowHResult(
            _d3d11.CreateDevice(
                _adapter,
                D3DDriverType.Unknown,
                Software: default,
                (uint)(CreateDeviceFlag.BgraSupport | (Program.LaunchDebug ? CreateDeviceFlag.Debug : 0)),
                null,
                0,
                D3D11.SdkVersion,
                ref _device,
                null,
                ref _deviceContext
            )
        );

        if ((IntPtr)_sharedTexture.Handle != IntPtr.Zero)
            _sharedTexture.Dispose();

            SilkMarshal.ThrowHResult(
                _device.CreateTexture2D(new Texture2DDesc
                {
                    Width = TOTAL_WIDTH,
                    Height = TOTAL_HEIGHT,
                MipLevels = 1,
                ArraySize = 1,
                Format = Format.FormatB8G8R8A8Unorm,
                SampleDesc = new SampleDesc { Count = 1, Quality = 0 },
                    BindFlags = (uint)(BindFlag.ShaderResource | BindFlag.RenderTarget),
                    CPUAccessFlags = (uint)CpuAccessFlag.None,
                    Usage = Usage.Default
                }, null, ref _sharedTexture)
            );
        _multithread = _device.QueryInterface<ID3D11Multithread>();
        _multithread.SetMultithreadProtected(true);

        if (Program.LaunchDebug)
            _device.SetInfoQueueCallback(msg => logger.Info(SilkMarshal.PtrToString((nint)msg.PDescription)!));

        // Initialize D2D renderer on the shared texture
        if (!_renderer.Initialize(_sharedTexture))
        {
            logger.Error("Failed to initialize native overlay renderer");
        }
        else
        {
            logger.Info("Native overlay renderer initialized");
        }
    }

    private void ThreadLoop()
    {
        var active = false;
        var e = new VREvent_t();
        var nextInit = DateTime.MinValue;
        var nextDeviceUpdate = DateTime.MinValue;
        var nextRender = DateTime.MinValue;
        var nextHudClean = DateTime.MinValue;
        _nextOverlayUpdate = DateTime.MinValue;
        var overlayIndex = OpenVR.k_unTrackedDeviceIndexInvalid;
        var overlayVisible1 = false;
        var overlayVisible2 = false;

        while (_thread != null)
        {
            try
            {
                Thread.Sleep(32); // ~30 FPS
            }
            catch (ThreadInterruptedException)
            {
            }

            if (_active)
            {
                var system = OpenVR.System;
                if (system == null)
                {
                    if (DateTime.UtcNow.CompareTo(nextInit) <= 0)
                        continue;

                    var _err = EVRInitError.None;
                    system = OpenVR.Init(ref _err, EVRApplicationType.VRApplication_Background);
                    nextInit = DateTime.UtcNow.AddSeconds(5);
                    if (system == null)
                        continue;

                    active = true;
                    SetupTextures();
                }

                while (system.PollNextEvent(ref e, (uint)Marshal.SizeOf(e)))
                {
                    var type = (EVREventType)e.eventType;
                    if (type == EVREventType.VREvent_Quit)
                    {
                        active = false;
                        IsHmdAfk = false;
                        OpenVR.Shutdown();
                        nextInit = DateTime.UtcNow.AddSeconds(10);
                        system = null;

                        _wristOverlayHandle = 0;
                        _hmdOverlayHandle = 0;
                        break;
                    }
                }

                if (system != null)
                {
                    // Update device list
                    if (DateTime.UtcNow.CompareTo(nextDeviceUpdate) >= 0)
                    {
                        overlayIndex = OpenVR.k_unTrackedDeviceIndexInvalid;
                        UpdateDevices(system, ref overlayIndex);
                        if (overlayIndex != OpenVR.k_unTrackedDeviceIndexInvalid)
                            _nextOverlayUpdate = DateTime.UtcNow.AddSeconds(10);
                        nextDeviceUpdate = DateTime.UtcNow.AddSeconds(0.1);
                    }

                    // Update system stats
                    _state.CpuUsage = _systemMonitor.CpuUsage;
                    _state.Uptime = _systemMonitor.UpTime;

                    // Clean HUD feed periodically
                    if (DateTime.UtcNow.CompareTo(nextHudClean) >= 0)
                    {
                        _state.CleanHudFeed();
                        nextHudClean = DateTime.UtcNow.AddMilliseconds(500);
                    }

                    // Update notification list
                    UpdateNotifications();

                    // Render
                    if (_state.IsDirty || DateTime.UtcNow.CompareTo(nextRender) >= 0)
                    {
                        var snapshot = _state.GetSnapshot();
                        _renderer.Render(snapshot, _activeNotifications);
                        _state.IsDirty = false;
                        nextRender = DateTime.UtcNow.AddMilliseconds(500); // Render at least every 500ms for time updates
                    }

                    // Process overlays
                    var overlay = OpenVR.Overlay;
                    if (overlay != null)
                    {
                        var dashboardVisible = overlay.IsDashboardVisible();

                        if (_wristOverlayActive)
                        {
                            var err = ProcessOverlay1(overlay, ref _wristOverlayHandle, ref overlayVisible1,
                                dashboardVisible, overlayIndex);
                            if (err != EVROverlayError.None && _wristOverlayHandle != 0)
                            {
                                overlay.DestroyOverlay(_wristOverlayHandle);
                                _wristOverlayHandle = 0;
                                logger.Error(err);
                            }
                        }

                        if (_hmdOverlayActive)
                        {
                            var err = ProcessOverlay2(overlay, ref _hmdOverlayHandle, ref overlayVisible2,
                                dashboardVisible);
                            if (err != EVROverlayError.None && _hmdOverlayHandle != 0)
                            {
                                overlay.DestroyOverlay(_hmdOverlayHandle);
                                _hmdOverlayHandle = 0;
                                logger.Error(err);
                            }
                        }
                    }
                }
            }
            else if (active)
            {
                active = false;
                IsHmdAfk = false;
                OpenVR.Shutdown();
                _deviceListLock.EnterWriteLock();
                try { _deviceList.Clear(); }
                finally { _deviceListLock.ExitWriteLock(); }
            }
        }

        // Cleanup
        _renderer.Dispose();
        _device.Dispose();
        _adapter.Dispose();
        _factory.Dispose();
        _sharedTexture.Dispose();
        _sharedTexture = default;
        _deviceContext.Dispose();
        _multithread.Dispose();
        _dxgi?.Dispose();
        _d3d11?.Dispose();
        logger.Info("Native overlay exited");
    }

    private void UpdateNotifications()
    {
        // Move from queue to active list
        while (_state.NotificationQueue.TryDequeue(out var noty))
        {
            _activeNotifications.Add(noty);
            _state.IsDirty = true;
        }

        // Remove completed notifications
        _activeNotifications.RemoveAll(n => n.Phase >= 3);

        // Any active notification means we need continuous re-render
        if (_activeNotifications.Count > 0)
            _state.IsDirty = true;
    }

    private void UpdateDevices(CVRSystem system, ref uint overlayIndex)
    {
        _deviceListLock.EnterWriteLock();
        try { _deviceList.Clear(); }
        finally { _deviceListLock.ExitWriteLock(); }

        var sb = new StringBuilder(256);
        var state = new VRControllerState_t();
        var poses = new TrackedDevicePose_t[OpenVR.k_unMaxTrackedDeviceCount];
        system.GetDeviceToAbsoluteTrackingPose(ETrackingUniverseOrigin.TrackingUniverseStanding, 0, poses);

        for (var i = 0u; i < OpenVR.k_unMaxTrackedDeviceCount; ++i)
        {
            var devClass = system.GetTrackedDeviceClass(i);
            switch (devClass)
            {
                case ETrackedDeviceClass.HMD:
                {
                    var success = system.GetControllerState(i, ref state, (uint)Marshal.SizeOf(state));
                    if (!success) break;

                    var prox = state.ulButtonPressed & (1UL << (int)EVRButtonId.k_EButton_ProximitySensor);
                    var isHmdAfk = prox == 0;
                    if (isHmdAfk != IsHmdAfk)
                    {
                        IsHmdAfk = isHmdAfk;
                        // Notify main thread via browser ExecuteScript
                        NotifyHmdAfk(isHmdAfk);
                    }

                    var headsetErr = ETrackedPropertyError.TrackedProp_Success;
                    var headsetBattery = system.GetFloatTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_DeviceBatteryPercentage_Float, ref headsetErr);
                    if (headsetErr != ETrackedPropertyError.TrackedProp_Success) break;

                    var headset = new[]
                    {
                        "headset",
                        system.IsTrackedDeviceConnected(i) ? "connected" : "disconnected",
                        "discharging",
                        (headsetBattery * 100).ToString(),
                        poses[i].eTrackingResult.ToString()
                    };
                    _deviceListLock.EnterWriteLock();
                    try { _deviceList.Add(headset); }
                    finally { _deviceListLock.ExitWriteLock(); }
                    break;
                }
                case ETrackedDeviceClass.Controller:
                case ETrackedDeviceClass.GenericTracker:
                case ETrackedDeviceClass.TrackingReference:
                {
                    var err = ETrackedPropertyError.TrackedProp_Success;
                    var battery = system.GetFloatTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_DeviceBatteryPercentage_Float, ref err);
                    if (err != ETrackedPropertyError.TrackedProp_Success) battery = 1f;

                    err = ETrackedPropertyError.TrackedProp_Success;
                    var isCharging = system.GetBoolTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_DeviceIsCharging_Bool, ref err);
                    if (err != ETrackedPropertyError.TrackedProp_Success) isCharging = false;

                    sb.Clear();
                    system.GetStringTrackedDeviceProperty(i, ETrackedDeviceProperty.Prop_TrackingSystemName_String, sb, (uint)sb.Capacity, ref err);
                    var isOculus = sb.ToString().IndexOf("oculus", StringComparison.OrdinalIgnoreCase) >= 0;

                    var role = system.GetControllerRoleForTrackedDeviceIndex(i);
                    if (role == ETrackedControllerRole.LeftHand || role == ETrackedControllerRole.RightHand)
                    {
                        if (_overlayHand == 0 ||
                            (_overlayHand == 1 && role == ETrackedControllerRole.LeftHand) ||
                            (_overlayHand == 2 && role == ETrackedControllerRole.RightHand))
                        {
                            if (system.GetControllerState(i, ref state, (uint)Marshal.SizeOf(state)) &&
                                (state.ulButtonPressed & (_menuButton ? 2u : isOculus ? 128u : 4u)) != 0)
                            {
                                _nextOverlayUpdate = DateTime.MinValue;
                                if (role == ETrackedControllerRole.LeftHand)
                                {
                                    Array.Copy(_translationLeft, _translation, 3);
                                    Array.Copy(_rotationLeft, _rotation, 3);
                                }
                                else
                                {
                                    Array.Copy(_translationRight, _translation, 3);
                                    Array.Copy(_rotationRight, _rotation, 3);
                                }
                                overlayIndex = i;
                            }
                        }
                    }

                    var type = devClass switch
                    {
                        ETrackedDeviceClass.Controller => role switch
                        {
                            ETrackedControllerRole.LeftHand => "leftController",
                            ETrackedControllerRole.RightHand => "rightController",
                            _ => "controller"
                        },
                        ETrackedDeviceClass.GenericTracker => "tracker",
                        ETrackedDeviceClass.TrackingReference => "base",
                        _ => ""
                    };

                    var item = new[]
                    {
                        type,
                        system.IsTrackedDeviceConnected(i) ? "connected" : "disconnected",
                        isCharging ? "charging" : "discharging",
                        (battery * 100).ToString(),
                        poses[i].eTrackingResult.ToString()
                    };
                    _deviceListLock.EnterWriteLock();
                    try { _deviceList.Add(item); }
                    finally { _deviceListLock.ExitWriteLock(); }
                    break;
                }
            }
        }
    }

    /// <summary>
    /// Notify the main window browser about HMD AFK state change.
    /// This replaces the WebSocket OverlayClient → OverlayServer → MainForm path.
    /// </summary>
    private void NotifyHmdAfk(bool isHmdAfk)
    {
        try
        {
            if (MainForm.Instance?.Browser != null &&
                !MainForm.Instance.Browser.IsLoading &&
                MainForm.Instance.Browser.CanExecuteJavascriptInMainFrame)
            {
                MainForm.Instance.Browser.ExecuteScriptAsync("window?.$pinia?.game.updateIsHmdAfk", isHmdAfk);
            }
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error notifying HMD AFK state");
        }
    }

    #region OpenVR Overlay Processing (ported from VRCXVRCef)

    internal unsafe EVROverlayError ProcessOverlay1(CVROverlay overlay, ref ulong overlayHandle, ref bool overlayVisible,
        bool dashboardVisible, uint overlayIndex)
    {
        var err = EVROverlayError.None;

        if (overlayHandle == 0)
        {
            err = overlay.FindOverlay("VRCX1", ref overlayHandle);
            if (err != EVROverlayError.None)
            {
                if (err != EVROverlayError.UnknownOverlay) return err;
                overlayVisible = false;
                err = overlay.CreateOverlay("VRCX1", "VRCX1", ref overlayHandle);
                if (err != EVROverlayError.None) return err;

                err = overlay.SetOverlayAlpha(overlayHandle, 0.9f);
                if (err != EVROverlayError.None) return err;

                err = overlay.SetOverlayWidthInMeters(overlayHandle, 1f);
                if (err != EVROverlayError.None) return err;

                err = overlay.SetOverlayInputMethod(overlayHandle, VROverlayInputMethod.None);
                if (err != EVROverlayError.None) return err;
            }
        }

        if (overlayIndex != OpenVR.k_unTrackedDeviceIndexInvalid)
        {
            var m = Matrix4x4.CreateScale(0.25f);
            m *= Matrix4x4.CreateRotationX(_rotation[0]);
            m *= Matrix4x4.CreateRotationY(_rotation[1]);
            m *= Matrix4x4.CreateRotationZ(_rotation[2]);
            m *= Matrix4x4.CreateTranslation(new Vector3(_translation[0], _translation[1], _translation[2]));
            var hm34 = new HmdMatrix34_t
            {
                m0 = m.M11, m1 = m.M21, m2 = m.M31, m3 = m.M41,
                m4 = m.M12, m5 = m.M22, m6 = m.M32, m7 = m.M42,
                m8 = m.M13, m9 = m.M23, m10 = m.M33, m11 = m.M43
            };
            err = overlay.SetOverlayTransformTrackedDeviceRelative(overlayHandle, overlayIndex, ref hm34);
            if (err != EVROverlayError.None) return err;
        }

        if (!dashboardVisible && DateTime.UtcNow.CompareTo(_nextOverlayUpdate) <= 0)
        {
            var texture = new Texture_t
            {
                handle = (IntPtr)_sharedTexture.Handle,
                eType = ETextureType.DirectX,
                eColorSpace = EColorSpace.Auto
            };
            err = overlay.SetOverlayTexture(overlayHandle, ref texture);

            var bounds = new VRTextureBounds_t
            {
                uMin = 0f, uMax = 0.5f,
                vMin = 0f, vMax = (float)WRIST_SIZE / TOTAL_HEIGHT
            };
            overlay.SetOverlayTextureBounds(overlayHandle, ref bounds);

            if (!overlayVisible)
            {
                err = overlay.ShowOverlay(overlayHandle);
                overlayVisible = true;
            }
        }
        else if (overlayVisible)
        {
            err = overlay.HideOverlay(overlayHandle);
            if (err != EVROverlayError.None) return err;
            overlayVisible = false;
        }

        return err;
    }

    internal unsafe EVROverlayError ProcessOverlay2(CVROverlay overlay, ref ulong overlayHandle, ref bool overlayVisible,
        bool dashboardVisible)
    {
        var err = EVROverlayError.None;

        if (overlayHandle == 0)
        {
            err = overlay.FindOverlay("VRCX2", ref overlayHandle);
            if (err != EVROverlayError.None)
            {
                if (err != EVROverlayError.UnknownOverlay) return err;
                overlayVisible = false;
                err = overlay.CreateOverlay("VRCX2", "VRCX2", ref overlayHandle);
                if (err != EVROverlayError.None) return err;

                err = overlay.SetOverlayAlpha(overlayHandle, 0.9f);
                if (err != EVROverlayError.None) return err;

                err = overlay.SetOverlayWidthInMeters(overlayHandle, 1f);
                if (err != EVROverlayError.None) return err;

                err = overlay.SetOverlayInputMethod(overlayHandle, VROverlayInputMethod.None);
                if (err != EVROverlayError.None) return err;

                var m = Matrix4x4.CreateScale(1f);
                m *= Matrix4x4.CreateTranslation(0, -0.3f, -1.5f);
                var hm34 = new HmdMatrix34_t
                {
                    m0 = m.M11, m1 = m.M21, m2 = m.M31, m3 = m.M41,
                    m4 = m.M12, m5 = m.M22, m6 = m.M32, m7 = m.M42,
                    m8 = m.M13, m9 = m.M23, m10 = m.M33, m11 = m.M43
                };
                err = overlay.SetOverlayTransformTrackedDeviceRelative(overlayHandle, OpenVR.k_unTrackedDeviceIndex_Hmd, ref hm34);
                if (err != EVROverlayError.None) return err;
            }
        }

        if (!dashboardVisible)
        {
            var texture = new Texture_t
            {
                handle = (IntPtr)_sharedTexture.Handle,
                eType = ETextureType.DirectX,
                eColorSpace = EColorSpace.Auto
            };
            err = overlay.SetOverlayTexture(overlayHandle, ref texture);

            var bounds = new VRTextureBounds_t
            {
                uMin = 0f, uMax = 1f,
                vMin = (float)(TOTAL_HEIGHT - HMD_HEIGHT) / TOTAL_HEIGHT,
                vMax = 1f
            };
            overlay.SetOverlayTextureBounds(overlayHandle, ref bounds);

            if (!overlayVisible)
            {
                err = overlay.ShowOverlay(overlayHandle);
                overlayVisible = true;
            }
        }
        else if (overlayVisible)
        {
            err = overlay.HideOverlay(overlayHandle);
            if (err != EVROverlayError.None) return err;
            overlayVisible = false;
        }

        return err;
    }

    #endregion
}
