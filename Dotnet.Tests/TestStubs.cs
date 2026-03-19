using System.IO;

namespace VRCX;

internal static class Program
{
	public static TestAppApi AppApiInstance { get; } = new();
}

internal sealed class TestAppApi
{
	public string GetVRChatAppDataLocation()
	{
		return Path.GetTempPath();
	}
}

