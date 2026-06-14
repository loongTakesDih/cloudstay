namespace server.Models;

public class Property
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal PricePerNight { get; set; }

    public string Location { get; set; } = string.Empty;

    public int HostId { get; set; }

    public User? Host { get; set; }

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

    public bool IsListed { get; set; } = false;

    public bool IsAvailable { get; set; } = true;

    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
