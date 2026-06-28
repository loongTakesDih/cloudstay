namespace server.DTOs.Properties;

public class PropertyHostSummaryDto
{
    public int HostId { get; set; }

    public string Username { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public bool IsHost { get; set; }
}
