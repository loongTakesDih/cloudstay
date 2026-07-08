using Microsoft.AspNetCore.SignalR;
using server.Hubs;

namespace server.Services;

public class RealtimeNotifier
{
    private readonly IHubContext<CloudStayHub> _hub;
    private readonly ILogger<RealtimeNotifier> _logger;

    public RealtimeNotifier(
        IHubContext<CloudStayHub> hub,
        ILogger<RealtimeNotifier> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public Task NotifyUsersAsync(IEnumerable<int> userIds, object change)
    {
        var groups = userIds
            .Distinct()
            .Select(CloudStayHub.UserGroup)
            .ToList();

        if (groups.Count > 0)
        {
            _ = SendAndLogFailuresAsync(
                _hub.Clients.Groups(groups).SendAsync("DataChanged", change),
                "users");
        }

        return Task.CompletedTask;
    }

    public Task NotifyAllAsync(object change)
    {
        _ = SendAndLogFailuresAsync(
            _hub.Clients.All.SendAsync("DataChanged", change),
            "all clients");

        return Task.CompletedTask;
    }

    private async Task SendAndLogFailuresAsync(Task sendTask, string target)
    {
        try
        {
            await sendTask;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Realtime notification delivery failed for {Target}.",
                target);
        }
    }
}
