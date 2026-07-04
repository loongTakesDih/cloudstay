using Microsoft.AspNetCore.SignalR;
using server.Hubs;

namespace server.Services;

public class RealtimeNotifier
{
    private readonly IHubContext<CloudStayHub> _hub;

    public RealtimeNotifier(IHubContext<CloudStayHub> hub)
    {
        _hub = hub;
    }

    public Task NotifyUsersAsync(IEnumerable<int> userIds, object change)
    {
        var groups = userIds
            .Distinct()
            .Select(CloudStayHub.UserGroup)
            .ToList();

        return groups.Count == 0
            ? Task.CompletedTask
            : _hub.Clients.Groups(groups).SendAsync("DataChanged", change);
    }

    public Task NotifyAllAsync(object change) =>
        _hub.Clients.All.SendAsync("DataChanged", change);
}
