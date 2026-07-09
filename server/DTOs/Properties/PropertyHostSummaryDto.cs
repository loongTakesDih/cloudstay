namespace server.DTOs.Properties;

public class PropertyHostSummaryDto
{
    public int HostId { get; set; }

    public string Username { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? HostSince { get; set; }

    public bool IsHost { get; set; }

    public string? ProfilePictureUrl { get; set; }

    public string? AboutMe { get; set; }

    public string? Work { get; set; }

    public string? LivesIn { get; set; }

    public string? Languages { get; set; }

    public string? Interests { get; set; }

    public int ListingsCount { get; set; }

    public int ReviewCount { get; set; }

    public double? AverageRating { get; set; }
}
