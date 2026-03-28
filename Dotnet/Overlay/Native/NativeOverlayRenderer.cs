using System;
using System.Collections.Generic;
using System.Globalization;
using System.Runtime.InteropServices;
using NLog;
using Silk.NET.Core.Native;
using Silk.NET.Direct2D;
using Silk.NET.Direct3D11;
using Silk.NET.DirectWrite;
using Silk.NET.DXGI;
using Silk.NET.Maths;
using VRCX.Overlay.Native.Models;
using D2DTextFormat = Silk.NET.Direct2D.IDWriteTextFormat;
using DWFactory = Silk.NET.DirectWrite.IDWriteFactory;
using DWTextFormat = Silk.NET.DirectWrite.IDWriteTextFormat;
using DWTextLayout = Silk.NET.DirectWrite.IDWriteTextLayout;

using D2D = Silk.NET.Direct2D.D2D;

namespace VRCX.Overlay.Native;

/// <summary>
/// Renders the VR overlay content using Direct2D and DirectWrite onto a D3D11 texture.
/// </summary>
public unsafe class NativeOverlayRenderer : IDisposable
{
    private static readonly Logger logger = LogManager.GetCurrentClassLogger();

    private const int WRIST_WIDTH = 512;
    private const int WRIST_HEIGHT = 512;
    private const int HMD_WIDTH = 1024;
    private const int HMD_HEIGHT = 1024;
    private const int TOTAL_WIDTH = 1024;
    private const int TOTAL_HEIGHT = 1536; // WRIST (512) + HMD (1024)

    private const float FEED_ITEM_HEIGHT = 26f;
    private const float FEED_FONT_SIZE = 16f;
    private const float FEED_TIME_WIDTH = 50f;
    private const float FEED_ICON_SIZE = 16f;
    private const float FEED_LEFT_PADDING = 8f;
    private const float BOTTOM_BAR_HEIGHT = 52f;
    private const float DEVICE_ROW_HEIGHT = 32f;
    private const float NOW_PLAYING_HEIGHT = 24f;

    private const float NOTY_FONT_SIZE = 22f;
    private const float NOTY_HEIGHT = 54f;
    private const float NOTY_PADDING = 12f;
    private const float NOTY_GAP = 6f;
    private const float NOTY_START_Y = 20f;
    private const float NOTY_MARGIN_X = 128f;
    private const int NOTY_ANIM_MS = 200;

    private const float HUD_FONT_SIZE = 24f;
    private const float TIMEOUT_FONT_SIZE = 30f;

    // D2D1 resources
    private D2D _d2d;
    private ComPtr<ID2D1Factory> _d2dFactory;
    private ComPtr<ID2D1RenderTarget> _renderTarget;

    // Brushes
    private ComPtr<ID2D1SolidColorBrush> _brushWhite;
    private ComPtr<ID2D1SolidColorBrush> _brushBg;
    private ComPtr<ID2D1SolidColorBrush> _brushText;
    private ComPtr<ID2D1SolidColorBrush> _brushTextSecondary;
    private ComPtr<ID2D1SolidColorBrush> _brushTextMuted;
    private ComPtr<ID2D1SolidColorBrush> _brushFavorite;
    private ComPtr<ID2D1SolidColorBrush> _brushOnline;
    private ComPtr<ID2D1SolidColorBrush> _brushJoinMe;
    private ComPtr<ID2D1SolidColorBrush> _brushAskMe;
    private ComPtr<ID2D1SolidColorBrush> _brushBusy;
    private ComPtr<ID2D1SolidColorBrush> _brushBorder;
    private ComPtr<ID2D1SolidColorBrush> _brushNotyBg;
    private ComPtr<ID2D1SolidColorBrush> _brushRed;
    private ComPtr<ID2D1SolidColorBrush> _brushDynamic; // for reusable color

    // DirectWrite resources
    private Silk.NET.DirectWrite.DWrite _dwrite;
    private ComPtr<DWFactory> _dwFactory;
    private ComPtr<DWTextFormat> _feedFont;
    private ComPtr<DWTextFormat> _feedFontBold;
    private ComPtr<DWTextFormat> _bottomFont;
    private ComPtr<DWTextFormat> _notyFont;
    private ComPtr<DWTextFormat> _hudFont;
    private ComPtr<DWTextFormat> _timeoutFont;
    private ComPtr<DWTextFormat> _iconFont;
    private ComPtr<DWTextFormat> _regionFont;

    private bool _initialized;
    private int _renderCount;

    public bool Initialize(ComPtr<ID3D11Texture2D> texture)
    {
        try
        {
            _d2d = D2D.GetApi();
            _dwrite = Silk.NET.DirectWrite.DWrite.GetApi();

            // Create D2D1 factory
            SilkMarshal.ThrowHResult(
                _d2d.D2D1CreateFactory(
                    Silk.NET.Direct2D.FactoryType.SingleThreaded,
                    SilkMarshal.GuidPtrOf<ID2D1Factory>(),
                    null,
                    (void**)_d2dFactory.GetAddressOf()
                )
            );

            // Create DWrite factory
            SilkMarshal.ThrowHResult(
                _dwrite.DWriteCreateFactory(
                    Silk.NET.DirectWrite.FactoryType.Shared,
                    SilkMarshal.GuidPtrOf<DWFactory>(),
                    (IUnknown**)_dwFactory.GetAddressOf()
                )
            );

            // Get DXGI surface from D3D11 texture
            ComPtr<IDXGISurface> surface = default;
            SilkMarshal.ThrowHResult(
                texture.QueryInterface(SilkMarshal.GuidPtrOf<IDXGISurface>(), (void**)surface.GetAddressOf())
            );

            // Create D2D1 render target from DXGI surface
            var rtProps = new RenderTargetProperties
            {
                Type = RenderTargetType.Default,
                PixelFormat = new Silk.NET.Direct2D.PixelFormat
                {
                    Format = Silk.NET.DXGI.Format.FormatB8G8R8A8Unorm,
                    AlphaMode = Silk.NET.Direct2D.AlphaMode.Premultiplied
                },
                DpiX = 96f,
                DpiY = 96f,
                Usage = RenderTargetUsage.None,
                MinLevel = FeatureLevel.LevelDefault
            };

            SilkMarshal.ThrowHResult(
                _d2dFactory.CreateDxgiSurfaceRenderTarget(
                    surface,
                    &rtProps,
                    _renderTarget.GetAddressOf()
                )
            );
            surface.Dispose();
            // Create brushes
            CreateBrush(ref _brushWhite, 1f, 1f, 1f, 1f);
            CreateBrush(ref _brushBg, 0.094f, 0.094f, 0.106f, 1f);       // #18181b
            CreateBrush(ref _brushText, 0.894f, 0.894f, 0.906f, 1f);     // #e4e4e7
            CreateBrush(ref _brushTextSecondary, 0.631f, 0.631f, 0.667f, 1f); // #a1a1aa
            CreateBrush(ref _brushTextMuted, 0.443f, 0.443f, 0.478f, 1f); // #71717a
            CreateBrush(ref _brushFavorite, 0.984f, 0.749f, 0.141f, 1f);  // #fbbf24
            CreateBrush(ref _brushOnline, 0.404f, 0.761f, 0.227f, 1f);    // #67c23a
            CreateBrush(ref _brushJoinMe, 0f, 0.722f, 1f, 1f);            // #00b8ff
            CreateBrush(ref _brushAskMe, 1f, 0.584f, 0f, 1f);             // #ff9500
            CreateBrush(ref _brushBusy, 1f, 0.173f, 0.173f, 1f);          // #ff2c2c
            CreateBrush(ref _brushBorder, 1f, 1f, 1f, 0.12f);
            CreateBrush(ref _brushNotyBg, 0.027f, 0.231f, 0.298f, 0.92f); // #073b4c with alpha
            CreateBrush(ref _brushRed, 0.929f, 0.106f, 0.141f, 1f);       // #ed1b24
            CreateBrush(ref _brushDynamic, 1f, 1f, 1f, 1f);

            // Create text formats
            _feedFont = CreateTextFormat("Segoe UI", FEED_FONT_SIZE, FontWeight.Normal);
            _feedFontBold = CreateTextFormat("Segoe UI", FEED_FONT_SIZE, FontWeight.SemiBold);
            _bottomFont = CreateTextFormat("Segoe UI", 14f, FontWeight.Normal);
            _notyFont = CreateTextFormat("Segoe UI", NOTY_FONT_SIZE, FontWeight.Normal);
            _hudFont = CreateTextFormat("Segoe UI", HUD_FONT_SIZE, FontWeight.Normal);
            _timeoutFont = CreateTextFormat("Segoe UI", TIMEOUT_FONT_SIZE, FontWeight.Bold);
            _iconFont = CreateTextFormat("Segoe UI Symbol", 14f, FontWeight.Normal);
            _regionFont = CreateTextFormat("Segoe UI", 11f, FontWeight.Bold);

            // Configure text trimming for ellipsis
            ConfigureTextTrimming(_feedFont);
            ConfigureTextTrimming(_feedFontBold);
            ConfigureTextTrimming(_notyFont);

            _initialized = true;
            logger.Info("NativeOverlayRenderer initialized successfully");
            return true;
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Failed to initialize NativeOverlayRenderer");
            return false;
        }
    }

    /// <summary>
    /// Render all overlay content onto the shared texture.
    /// Called from the VR thread.
    /// </summary>
    public void Render(StateSnapshot state, List<NotificationItem> activeNotifications)
    {
        if (!_initialized) return;

        _renderCount++;
        _renderTarget.BeginDraw();

        // Clear entire texture to transparent
        var clearColor = new D3Dcolorvalue(0, 0, 0, 0);
        _renderTarget.Clear(&clearColor);

        // Render wrist overlay (top-left 512x512)
        RenderWristOverlay(state);

        // Render HMD overlay (bottom 1024x1024)
        RenderHmdOverlay(state, activeNotifications);

        _renderTarget.EndDraw((ulong*)null, (ulong*)null);

    }

    #region Wrist Overlay

    private void RenderWristOverlay(StateSnapshot state)
    {
        var config = state.Config;

        // Background
        if (config.BackgroundEnabled)
        {
            var bgRect = new Box2D<float>(0, 0, WRIST_WIDTH, WRIST_HEIGHT);
            _renderTarget.FillRectangle(&bgRect, _brushBg);
        }

        float y = 4f;

        // Feed items
        var maxFeedItems = CalculateMaxFeedItems(state);
        var feedItems = state.WristFeed;
        var feedCount = Math.Min(feedItems.Count, maxFeedItems);
        for (int i = 0; i < feedCount; i++)
        {
            var feed = feedItems[i];
            RenderFeedItem(feed, FEED_LEFT_PADDING, ref y, config.MinimalFeed);
        }

        // Now Playing
        if (state.NowPlaying.Playing)
        {
            RenderNowPlaying(state.NowPlaying, ref y);
        }

        // Devices row
        if (!config.HideDevicesFromFeed)
        {
            RenderDevices(state, ref y);
        }

        // Bottom info bar
        RenderBottomBar(state, y);
    }

    private int CalculateMaxFeedItems(StateSnapshot state)
    {
        float availableHeight = WRIST_HEIGHT - BOTTOM_BAR_HEIGHT;
        if (state.NowPlaying.Playing) availableHeight -= NOW_PLAYING_HEIGHT;
        if (!state.Config.HideDevicesFromFeed) availableHeight -= DEVICE_ROW_HEIGHT;
        return Math.Max(1, (int)(availableHeight / FEED_ITEM_HEIGHT));
    }

    private void RenderFeedItem(FeedItem feed, float x, ref float y, bool minimal)
    {
        float startY = y;
        float textX = x;

        // Alternating row background
        int rowIndex = (int)(y / FEED_ITEM_HEIGHT);
        if (rowIndex % 2 == 0)
        {
            var rowBg = new Box2D<float>(0, y, WRIST_WIDTH, y + FEED_ITEM_HEIGHT);
            SetBrushColor(_brushDynamic, 1f, 1f, 1f, 0.015f);
            _renderTarget.FillRectangle(&rowBg, _brushDynamic);
        }

        float textY = y + (FEED_ITEM_HEIGHT - FEED_FONT_SIZE) / 2f;

        // Time
        if (feed.CreatedAt != null)
        {
            var time = FormatTime(feed.CreatedAt);
            DrawText(time, _feedFont, _brushTextMuted, textX, textY, FEED_TIME_WIDTH, FEED_ITEM_HEIGHT);
            textX += FEED_TIME_WIDTH;
        }

        // Icon (using unicode symbols)
        var icon = GetFeedIcon(feed.Type);
        if (!string.IsNullOrEmpty(icon))
        {
            var iconBrush = GetIconBrush(feed.Type);
            DrawText(icon, _iconFont, iconBrush, textX, textY - 1f, FEED_ICON_SIZE + 4f, FEED_ITEM_HEIGHT);
            textX += FEED_ICON_SIZE + 6f;
        }

        // Name brush
        var nameBrush = feed.IsFavorite ? _brushFavorite : feed.IsFriend ? _brushWhite : _brushText;
        if (feed.TagColour != null)
        {
            SetBrushFromHex(_brushDynamic, feed.TagColour);
            nameBrush = _brushDynamic;
        }

        float remaining = WRIST_WIDTH - textX - 4f;

        if (minimal)
            RenderMinimalFeedContent(feed, nameBrush, textX, textY, remaining);
        else
            RenderFullFeedContent(feed, nameBrush, textX, textY, remaining);

        y += FEED_ITEM_HEIGHT;
    }

    private void RenderMinimalFeedContent(FeedItem feed, ComPtr<ID2D1SolidColorBrush> nameBrush, float x, float y, float maxWidth)
    {
        float cx = x;
        switch (feed.Type)
        {
            case "GPS":
                cx += DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                cx += 4f;
                var locText = BuildLocationText(feed.WorldName, feed.Location, feed.GroupName);
                DrawText(locText, _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                DrawRegionTag(feed.Location, cx + MeasureText(locText, _feedFont, maxWidth - (cx - x)), y);
                break;
            case "Online":
                cx += DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                cx += 4f;
                if (!string.IsNullOrEmpty(feed.WorldName))
                {
                    var loc = BuildLocationText(feed.WorldName, feed.Location, feed.GroupName);
                    DrawText(loc, _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                }
                break;
            case "Offline":
                DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
            case "Status":
                cx += DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                cx += 4f;
                RenderStatusDot(feed.Status, cx, y + FEED_FONT_SIZE / 2f - 4f);
                cx += 12f;
                if (!string.IsNullOrEmpty(feed.StatusDescription) && feed.StatusDescription != feed.PreviousStatusDescription)
                    DrawText(feed.StatusDescription, _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "OnPlayerJoined":
            case "OnPlayerJoining":
                DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
            case "OnPlayerLeft":
                DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
            case "Location":
                var lt = BuildLocationText(feed.WorldName, feed.Location, feed.GroupName);
                DrawText(lt, _feedFont, _brushTextSecondary, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
            case "VideoPlay":
                if (feed.DisplayName != null)
                {
                    cx += DrawText(feed.DisplayName, _feedFontBold, nameBrush, cx, y, maxWidth * 0.4f, FEED_ITEM_HEIGHT);
                    cx += 4f;
                }
                DrawText(feed.VideoName ?? feed.VideoUrl ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "invite":
                cx += DrawText(feed.SenderUsername ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.4f, FEED_ITEM_HEIGHT);
                cx += 4f;
                DrawText(feed.Details?.WorldName ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "requestInvite":
                cx += DrawText(feed.SenderUsername ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.4f, FEED_ITEM_HEIGHT);
                cx += 4f;
                DrawText(feed.Details?.RequestMessage ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "inviteResponse" or "requestInviteResponse":
                cx += DrawText(feed.SenderUsername ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.4f, FEED_ITEM_HEIGHT);
                cx += 4f;
                DrawText(feed.Details?.ResponseMessage ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "friendRequest":
                DrawText(feed.SenderUsername ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
            case "Friend" or "Unfriend":
                DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
            case "DisplayName":
                cx += DrawText(feed.PreviousDisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.4f, FEED_ITEM_HEIGHT);
                cx += DrawText(" → ", _feedFont, _brushTextMuted, cx, y, 30f, FEED_ITEM_HEIGHT);
                DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "TrustLevel":
                cx += DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.3f, FEED_ITEM_HEIGHT);
                cx += 4f;
                DrawText($"{feed.PreviousTrustLevel} → {feed.TrustLevel}", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "boop":
                cx += DrawText(feed.SenderUsername ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.4f, FEED_ITEM_HEIGHT);
                cx += 4f;
                DrawText(feed.Message ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "groupChange":
                cx += DrawText(feed.SenderUsername ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.4f, FEED_ITEM_HEIGHT);
                cx += 4f;
                DrawText(feed.Message ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "group.announcement" or "group.informative" or "group.invite" or
                 "group.joinRequest" or "group.transfer" or "group.queueReady" or "instance.closed":
                DrawText(feed.Message ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
            case "PortalSpawn":
                if (!string.IsNullOrEmpty(feed.DisplayName))
                {
                    cx += DrawText(feed.DisplayName, _feedFontBold, nameBrush, cx, y, maxWidth * 0.4f, FEED_ITEM_HEIGHT);
                    cx += 4f;
                    var portalLoc = BuildLocationText(feed.WorldName, feed.InstanceId, feed.GroupName);
                    DrawText(portalLoc, _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                }
                else
                {
                    DrawText("Portal spawned", _feedFont, _brushTextSecondary, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                }
                break;
            case "AvatarChange":
                cx += DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.3f, FEED_ITEM_HEIGHT);
                cx += 4f;
                DrawText(feed.Name ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "ChatBoxMessage":
                cx += DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth * 0.3f, FEED_ITEM_HEIGHT);
                cx += 4f;
                DrawText(feed.Text ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            case "Event":
                DrawText(feed.Data ?? "", _feedFontBold, _brushText, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
            case "External":
                if (!string.IsNullOrEmpty(feed.DisplayName))
                {
                    cx += DrawText(feed.DisplayName, _feedFontBold, nameBrush, cx, y, maxWidth * 0.3f, FEED_ITEM_HEIGHT);
                    cx += 4f;
                }
                DrawText(feed.Message ?? "", _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
                break;
            default: // Blocked/Muted/Unblocked/Unmuted etc
                DrawText(feed.DisplayName ?? "", _feedFontBold, nameBrush, cx, y, maxWidth, FEED_ITEM_HEIGHT);
                break;
        }
    }

    private void RenderFullFeedContent(FeedItem feed, ComPtr<ID2D1SolidColorBrush> nameBrush, float x, float y, float maxWidth)
    {
        // Full feed is the same as minimal but with descriptive text appended
        float cx = x;
        string suffix = feed.Type switch
        {
            "GPS" => feed.IsTraveling ? " is traveling to " : " is in ",
            "Online" => " has logged in",
            "Offline" => " has logged out",
            "OnPlayerJoined" => " has joined",
            "OnPlayerLeft" => " has left",
            "OnPlayerJoining" => " is joining",
            "Friend" => " is now your friend",
            "Unfriend" => " is no longer your friend",
            "friendRequest" => " sent a friend request",
            "invite" => " invited you to ",
            "requestInvite" => " requests invite ",
            "AvatarChange" => " → ",
            "ChatBoxMessage" => ": ",
            _ => null
        };

        var name = feed.DisplayName ?? feed.SenderUsername ?? "";
        cx += DrawText(name, _feedFontBold, nameBrush, cx, y, maxWidth * 0.45f, FEED_ITEM_HEIGHT);

        if (suffix != null)
        {
            cx += DrawText(suffix, _feedFont, _brushTextSecondary, cx, y, maxWidth * 0.25f, FEED_ITEM_HEIGHT);
        }

        // Extra content after suffix
        string extra = feed.Type switch
        {
            "GPS" or "Online" => BuildLocationText(feed.WorldName, feed.Location, feed.GroupName),
            "invite" => feed.Details?.WorldName ?? "",
            "requestInvite" => feed.Details?.RequestMessage ?? "",
            "AvatarChange" => feed.Name ?? "",
            "ChatBoxMessage" => feed.Text ?? "",
            "Status" => $"{feed.Status} {feed.StatusDescription}",
            "DisplayName" => $"→ {feed.DisplayName}",
            "TrustLevel" => $"{feed.PreviousTrustLevel} → {feed.TrustLevel}",
            "VideoPlay" => feed.VideoName ?? feed.VideoUrl ?? "",
            "boop" or "groupChange" => feed.Message ?? "",
            "Event" => feed.Data ?? "",
            "External" => feed.Message ?? "",
            _ => null
        };

        if (extra != null)
        {
            DrawText(extra, _feedFont, _brushTextSecondary, cx, y, maxWidth - (cx - x), FEED_ITEM_HEIGHT);
        }
    }

    private void RenderNowPlaying(NowPlaying np, ref float y)
    {
        // Separator
        var sepRect = new Box2D<float>(8f, y, WRIST_WIDTH - 8f, y + 1f);
        _renderTarget.FillRectangle(&sepRect, _brushBorder);
        y += 2f;

        float textY = y + 2f;
        float cx = FEED_LEFT_PADDING;
        cx += DrawText("♪ ", _iconFont, _brushTextMuted, cx, textY, 20f, NOW_PLAYING_HEIGHT);
        DrawText(np.Name, _feedFont, _brushText, cx, textY, WRIST_WIDTH - cx - 8f, NOW_PLAYING_HEIGHT);

        // Progress bar
        if (np.Percentage > 0)
        {
            float barY = y + NOW_PLAYING_HEIGHT - 3f;
            var barBg = new Box2D<float>(FEED_LEFT_PADDING, barY, WRIST_WIDTH - 8f, barY + 2f);
            SetBrushColor(_brushDynamic, 1f, 1f, 1f, 0.15f);
            _renderTarget.FillRectangle(&barBg, _brushDynamic);
            float barWidth = (WRIST_WIDTH - 16f) * (float)(np.Percentage / 100.0);
            var barFg = new Box2D<float>(FEED_LEFT_PADDING, barY, FEED_LEFT_PADDING + barWidth, barY + 2f);
            SetBrushColor(_brushDynamic, 1f, 1f, 1f, 0.7f);
            _renderTarget.FillRectangle(&barFg, _brushDynamic);
        }

        y += NOW_PLAYING_HEIGHT;
    }

    private void RenderDevices(StateSnapshot state, ref float y)
    {
        // This would be populated by the VR thread with device info
        // For now, devices are read directly from VRCXVRNative
        y += DEVICE_ROW_HEIGHT;
    }

    private void RenderBottomBar(StateSnapshot state, float startY)
    {
        float y = WRIST_HEIGHT - BOTTOM_BAR_HEIGHT;
        if (y < startY) y = startY;

        // Top border
        var borderRect = new Box2D<float>(0, y, WRIST_WIDTH, y + 1f);
        _renderTarget.FillRectangle(&borderRect, _brushBorder);
        y += 2f;

        // Row 1: Location name · timer · friend count
        float cx = FEED_LEFT_PADDING;
        var loc = state.LastLocation;
        if (!string.IsNullOrEmpty(loc.Name))
        {
            cx += DrawText(loc.Name, _feedFontBold, _brushText, cx, y, WRIST_WIDTH * 0.5f, 22f);
            cx += DrawText(" · ", _feedFont, _brushTextMuted, cx, y, 20f, 22f);
        }

        // Instance timer
        if (loc.Date.HasValue && loc.Date.Value > 0)
        {
            var elapsed = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - loc.Date.Value;
            var timerText = FormatDuration(elapsed);
            cx += DrawText(timerText, _feedFont, _brushTextSecondary, cx, y, 80f, 22f);
            cx += DrawText(" · ", _feedFont, _brushTextMuted, cx, y, 20f, 22f);
        }

        // Region tag for location
        DrawRegionTag(loc.Location, cx, y);

        // Right-aligned: friend count + player count
        var friendCountText = $"♦ {state.OnlineFriendCount}";
        var playerCount = loc.PlayerList?.Length ?? 0;
        if (playerCount > 0)
            friendCountText += $" | {playerCount}p";
        DrawTextRight(friendCountText, _bottomFont, _brushTextSecondary, WRIST_WIDTH - 8f, y, 120f, 22f);

        y += 22f;

        // Row 2: Time · CPU · Uptime
        cx = FEED_LEFT_PADDING;
        var currentTime = DateTime.Now.ToString(state.Config.DtHour12 ? "hh:mm:ss tt" : "HH:mm:ss");
        cx += DrawText(currentTime, _feedFont, _brushText, cx, y, 100f, 22f);

        if (state.Config.VrOverlayCpuUsage)
        {
            cx += DrawText(" · CPU ", _feedFont, _brushTextMuted, cx, y, 60f, 22f);
            cx += DrawText($"{state.CpuUsage:F0}%", _feedFont, _brushTextSecondary, cx, y, 40f, 22f);
        }

        if (state.Config.PcUptimeOnFeed && state.Uptime > 0)
        {
            cx += DrawText(" · ↑", _feedFont, _brushTextMuted, cx, y, 30f, 22f);
            cx += DrawText(FormatDuration(state.Uptime), _feedFont, _brushTextSecondary, cx, y, 80f, 22f);
        }

        // Online for timer (right aligned)
        if (loc.OnlineFor.HasValue && loc.OnlineFor.Value > 0)
        {
            var onlineElapsed = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() - loc.OnlineFor.Value;
            var onlineText = "⏱ " + FormatDuration(onlineElapsed);
            DrawTextRight(onlineText, _bottomFont, _brushTextSecondary, WRIST_WIDTH - 8f, y, 100f, 22f);
        }
    }

    #endregion

    #region HMD Overlay

    private void RenderHmdOverlay(StateSnapshot state, List<NotificationItem> activeNotifications)
    {
        float baseY = WRIST_HEIGHT; // HMD starts at y=512

        // Notifications (top area)
        RenderNotifications(activeNotifications, baseY);

        // HUD Feed (right-aligned text list)
        if (state.HudFeed.Count > 0)
        {
            float hudY = baseY + 40f;
            foreach (var entry in state.HudFeed)
            {
                var text = entry.DisplayName != null ? $"{entry.DisplayName}: {entry.Text}" : entry.Text ?? "";
                if (entry.Combo > 1)
                    text += $" ×{entry.Combo}";
                DrawTextRight(text, _hudFont, _brushWhite, TOTAL_WIDTH - 20f, hudY, HMD_WIDTH * 0.5f, 30f);
                hudY += 32f;
                if (hudY > baseY + HMD_HEIGHT - 200f) break;
            }
        }

        // HUD Timeout (bottom right)
        if (state.HudTimeout.Count > 0)
        {
            float timeoutY = baseY + HMD_HEIGHT - 60f;
            for (int i = state.HudTimeout.Count - 1; i >= 0; i--)
            {
                var entry = state.HudTimeout[i];
                var text = $"{entry.DisplayName}: {entry.Time}";
                DrawTextRight(text, _timeoutFont, _brushRed, TOTAL_WIDTH - 20f, timeoutY, HMD_WIDTH * 0.5f, 40f);
                timeoutY -= 44f;
            }
        }
    }

    private void RenderNotifications(List<NotificationItem> notifications, float baseY)
    {
        var config = new OverlayConfig(); // default position
        float startX = NOTY_MARGIN_X;
        float notyWidth = TOTAL_WIDTH - NOTY_MARGIN_X * 2f;
        float y = baseY + NOTY_START_Y;

        foreach (var noty in notifications)
        {
            if (noty.Phase >= 3) continue;

            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var phaseElapsed = now - noty.PhaseStartTime;

            // Update animation phase
            switch (noty.Phase)
            {
                case 0: // Entering
                    noty.Alpha = Math.Clamp((float)phaseElapsed / NOTY_ANIM_MS, 0f, 1f);
                    if (phaseElapsed >= NOTY_ANIM_MS)
                    {
                        noty.Phase = 1;
                        noty.PhaseStartTime = now;
                        noty.Alpha = 1f;
                    }
                    break;
                case 1: // Visible
                    if (phaseElapsed >= noty.Timeout)
                    {
                        noty.Phase = 2;
                        noty.PhaseStartTime = now;
                    }
                    break;
                case 2: // Exiting
                    noty.Alpha = 1f - Math.Clamp((float)phaseElapsed / NOTY_ANIM_MS, 0f, 1f);
                    if (phaseElapsed >= NOTY_ANIM_MS)
                    {
                        noty.Phase = 3;
                        noty.Alpha = 0f;
                    }
                    break;
            }

            if (noty.Alpha <= 0.01f) continue;

            // Draw notification background
            float offsetY = noty.Phase == 0 ? (1f - noty.Alpha) * 15f : 0f;
            var notyRect = new Box2D<float>(startX, y + offsetY, startX + notyWidth, y + offsetY + NOTY_HEIGHT);
            SetBrushColor(_brushDynamic, 0.027f, 0.231f, 0.298f, 0.88f * noty.Alpha);
            var roundedRect = new RoundedRect { Rect = notyRect, RadiusX = 8f, RadiusY = 8f };
            _renderTarget.FillRoundedRectangle(&roundedRect, _brushDynamic);

            // Draw notification text
            SetBrushColor(_brushDynamic, 1f, 1f, 1f, noty.Alpha);
            DrawText(noty.Text, _notyFont, _brushDynamic, startX + NOTY_PADDING, y + offsetY + NOTY_PADDING,
                notyWidth - NOTY_PADDING * 2, NOTY_HEIGHT - NOTY_PADDING * 2);

            y += NOTY_HEIGHT + NOTY_GAP;
        }
    }

    #endregion

    #region Drawing Helpers

    private void CreateBrush(ref ComPtr<ID2D1SolidColorBrush> brush, float r, float g, float b, float a)
    {
        var color = new D3Dcolorvalue(r, g, b, a);
        SilkMarshal.ThrowHResult(
            _renderTarget.CreateSolidColorBrush(&color, (BrushProperties*)null, brush.GetAddressOf())
        );
    }

    private void SetBrushColor(ComPtr<ID2D1SolidColorBrush> brush, float r, float g, float b, float a)
    {
        var color = new D3Dcolorvalue(r, g, b, a);
        brush.SetColor(&color);
    }

    private void SetBrushFromHex(ComPtr<ID2D1SolidColorBrush> brush, string hex)
    {
        if (string.IsNullOrEmpty(hex)) return;
        hex = hex.TrimStart('#');
        if (hex.Length >= 6)
        {
            float r = int.Parse(hex[..2], NumberStyles.HexNumber) / 255f;
            float g = int.Parse(hex[2..4], NumberStyles.HexNumber) / 255f;
            float b = int.Parse(hex[4..6], NumberStyles.HexNumber) / 255f;
            SetBrushColor(brush, r, g, b, 1f);
        }
    }

    private ComPtr<DWTextFormat> CreateTextFormat(string fontFamily, float size, FontWeight weight)
    {
        ComPtr<DWTextFormat> format = default;
        var localePtr = (char*)SilkMarshal.StringToPtr("en-us", NativeStringEncoding.LPWStr);
        try
        {
            fixed (char* pFamily = fontFamily)
            {
                var hr = _dwFactory.CreateTextFormat(
                    pFamily,
                    (IDWriteFontCollection*)null,
                    weight,
                    Silk.NET.DirectWrite.FontStyle.Normal,
                    FontStretch.Normal,
                    size,
                    localePtr,
                    format.GetAddressOf()
                );
                if (hr < 0)
                {
                    logger.Error(
                        "CreateTextFormat failed: hr=0x{0:X8}, fontFamily={1}, size={2}, weight={3}",
                        hr,
                        fontFamily,
                        size,
                        weight
                    );
                    SilkMarshal.ThrowHResult(hr);
                }
            }
        }
        finally
        {
            SilkMarshal.Free((nint)localePtr);
        }
        format.SetWordWrapping(WordWrapping.NoWrap);
        return format;
    }

    private void ConfigureTextTrimming(ComPtr<DWTextFormat> format)
    {
        var trimming = new Trimming
        {
            Granularity = TrimmingGranularity.Character,
            Delimiter = 0,
            DelimiterCount = 0
        };
        format.SetTrimming(&trimming, (IDWriteInlineObject*)null);
    }

    /// <summary>
    /// Draw text and return the approximate width used.
    /// </summary>
    private float DrawText(string text, ComPtr<DWTextFormat> format, ComPtr<ID2D1SolidColorBrush> brush,
        float x, float y, float maxWidth, float maxHeight)
    {
        if (string.IsNullOrEmpty(text)) return 0f;
        var rect = new Box2D<float>(x, y, x + maxWidth, y + maxHeight);
        fixed (char* pText = text)
        {
            _renderTarget.DrawTextA(
                pText,
                (uint)text.Length,
                (D2DTextFormat*)format.Handle,
                &rect,
                (ID2D1Brush*)brush.Handle,
                DrawTextOptions.Clip | DrawTextOptions.EnableColorFont,
                DwriteMeasuringMode.Natural);
        }
        return MeasureText(text, format, maxWidth);
    }

    private void DrawTextRight(string text, ComPtr<DWTextFormat> format, ComPtr<ID2D1SolidColorBrush> brush,
        float rightX, float y, float maxWidth, float height)
    {
        if (string.IsNullOrEmpty(text)) return;
        float textWidth = MeasureText(text, format, maxWidth);
        float x = rightX - textWidth;
        DrawText(text, format, brush, x, y, maxWidth, height);
    }

    private float MeasureText(string text, ComPtr<DWTextFormat> format, float maxWidth)
    {
        if (string.IsNullOrEmpty(text)) return 0f;

        ComPtr<DWTextLayout> layout = default;
        var hr = _dwFactory.CreateTextLayout(text, (uint)text.Length, format, maxWidth, 100f, ref layout);
        if (hr < 0) return Math.Min(text.Length * 8f, maxWidth);
        TextMetrics metrics;
        layout.GetMetrics(&metrics);
        float width = metrics.Width;
        layout.Dispose();
        return Math.Min(width, maxWidth);
    }

    private void RenderStatusDot(string status, float x, float centerY)
    {
        var brush = status switch
        {
            "active" => _brushOnline,
            "join me" => _brushJoinMe,
            "ask me" => _brushAskMe,
            "busy" => _brushBusy,
            _ => _brushTextMuted
        };
        var ellipse = new Ellipse { Point = new Vector2D<float>(x + 4f, centerY + 4f), RadiusX = 4f, RadiusY = 4f };
        _renderTarget.FillEllipse(&ellipse, brush);
    }

    private void DrawRegionTag(string location, float x, float y)
    {
        if (string.IsNullOrEmpty(location)) return;
        var region = ParseRegion(location);
        if (string.IsNullOrEmpty(region)) return;

        // Draw region as uppercase text tag (e.g. "US", "JP", "EU")
        var tag = region.ToUpperInvariant();
        float tagX = x + 6f;

        // Tag background
        float tagWidth = tag.Length * 8f + 8f;
        var tagRect = new Box2D<float>(tagX, y + 2f, tagX + tagWidth, y + 16f);
        SetBrushColor(_brushDynamic, 1f, 1f, 1f, 0.1f);
        var roundedTag = new RoundedRect { Rect = tagRect, RadiusX = 3f, RadiusY = 3f };
        _renderTarget.FillRoundedRectangle(&roundedTag, _brushDynamic);

        // Tag text
        SetBrushColor(_brushDynamic, 1f, 1f, 1f, 0.7f);
        DrawText(tag, _regionFont, _brushDynamic, tagX + 4f, y + 1f, tagWidth, 16f);
    }

    /// <summary>
    /// Parse region code from a VRChat location string.
    /// Port of the JS parseLocation() region extraction.
    /// </summary>
    private static string ParseRegion(string location)
    {
        if (string.IsNullOrEmpty(location)) return null;
        var sep = location.IndexOf(':');
        if (sep < 0) return null;
        var instancePart = location[(sep + 1)..];
        var parts = instancePart.Split('~');
        foreach (var part in parts)
        {
            if (part.StartsWith("region(") && part.EndsWith(")"))
            {
                return part[7..^1]; // extract value between "region(" and ")"
            }
        }
        // Default to US if there's an instance but no explicit region
        return parts.Length > 0 ? "us" : null;
    }

    private static string BuildLocationText(string worldName, string location, string groupName)
    {
        var name = worldName ?? "";
        if (!string.IsNullOrEmpty(groupName))
            name += $" ({groupName})";
        return name;
    }

    private static string GetFeedIcon(string type)
    {
        return type switch
        {
            "GPS" => "●",
            "Online" => "✓",
            "Offline" => "✕",
            "OnPlayerJoined" => "▶",
            "OnPlayerLeft" => "◀",
            "OnPlayerJoining" => "▷",
            "Status" => "◉",
            "Location" => "◆",
            "VideoPlay" => "▶▶",
            "invite" or "requestInvite" or "inviteResponse" or "requestInviteResponse" or "group.queueReady" => "➤",
            "friendRequest" => "♥+",
            "Friend" => "♥",
            "Unfriend" => "↓",
            "DisplayName" => "✎",
            "TrustLevel" => "★",
            "boop" => "☆",
            "groupChange" or "group.invite" or "group.joinRequest" or "group.transfer" => "▣",
            "group.announcement" or "group.informative" => "📢",
            "instance.closed" => "⊗",
            "PortalSpawn" => "◎",
            "AvatarChange" => "👤",
            "ChatBoxMessage" => "💬",
            "Event" => "⚠",
            "External" => "ℹ",
            "BlockedOnPlayerJoined" or "BlockedOnPlayerLeft" or "Blocked" or "Unblocked" => "⊘",
            "MutedOnPlayerJoined" or "MutedOnPlayerLeft" or "Muted" or "Unmuted" => "🔇",
            _ => "·"
        };
    }

    private ComPtr<ID2D1SolidColorBrush> GetIconBrush(string type)
    {
        return type switch
        {
            "Online" or "Friend" => _brushOnline,
            "Offline" or "Unfriend" => _brushBusy,
            "OnPlayerJoined" or "OnPlayerJoining" => _brushJoinMe,
            "OnPlayerLeft" => _brushAskMe,
            "invite" or "group.queueReady" => _brushJoinMe,
            "Event" or "BlockedOnPlayerJoined" or "BlockedOnPlayerLeft" or "Blocked" => _brushBusy,
            _ => _brushTextMuted
        };
    }

    private static string FormatTime(string isoDate)
    {
        if (DateTime.TryParse(isoDate, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var dt))
        {
            return dt.ToLocalTime().ToString("HH:mm");
        }
        return "";
    }

    private static string FormatDuration(double ms)
    {
        var ts = TimeSpan.FromMilliseconds(ms);
        if (ts.TotalHours >= 1)
            return $"{(int)ts.TotalHours}:{ts.Minutes:D2}:{ts.Seconds:D2}";
        return $"{ts.Minutes}:{ts.Seconds:D2}";
    }

    #endregion

    public void Dispose()
    {
        _feedFont.Dispose();
        _feedFontBold.Dispose();
        _bottomFont.Dispose();
        _notyFont.Dispose();
        _hudFont.Dispose();
        _timeoutFont.Dispose();
        _iconFont.Dispose();
        _regionFont.Dispose();

        _brushWhite.Dispose();
        _brushBg.Dispose();
        _brushText.Dispose();
        _brushTextSecondary.Dispose();
        _brushTextMuted.Dispose();
        _brushFavorite.Dispose();
        _brushOnline.Dispose();
        _brushJoinMe.Dispose();
        _brushAskMe.Dispose();
        _brushBusy.Dispose();
        _brushBorder.Dispose();
        _brushNotyBg.Dispose();
        _brushRed.Dispose();
        _brushDynamic.Dispose();

        _renderTarget.Dispose();
        _d2dFactory.Dispose();
        _dwFactory.Dispose();
        _d2d?.Dispose();
        _dwrite?.Dispose();

        _initialized = false;
    }
}
