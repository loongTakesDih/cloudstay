namespace server.DTOs.Properties;

public class PropertyResponseDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal PricePerNight { get; set; }

    public string Location { get; set; } = string.Empty;

    public int HostId { get; set; }

    public string? ImageUrl { get; set; }

    public string? PropertyCategory { get; set; }

    public string? PlaceType { get; set; }

    public string? Address { get; set; }

    public int? GuestCount { get; set; }

    public int? BedroomCount { get; set; }

    public int? BedCount { get; set; }

    public int? BathroomCount { get; set; }

    public string? UnitFeatures { get; set; }

    public string? PropertyFacilities { get; set; }

    public string? SafetyFeatures { get; set; }

    public DateTime? AvailableFrom { get; set; }

    public DateTime? AvailableTo { get; set; }

    public bool IsListed { get; set; }

    public bool IsAvailable { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public bool IsOwner { get; set; }

    public PropertyHostSummaryDto? Host { get; set; }
}

public class PropertyHostSummaryDto
{
    public int HostId { get; set; }

    public string Username { get; set; } = string.Empty;

    public DateTime? CreatedAt { get; set; }

    public bool IsHost { get; set; }
}
