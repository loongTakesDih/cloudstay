namespace server.DTOs.Properties;

public class CreatePropertyRequestDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal PricePerNight { get; set; }

    public string Location { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string? PropertyCategory { get; set; }

    public string? PlaceType { get; set; }

    public string? Address { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public int? GuestCount { get; set; }

    public int? BedroomCount { get; set; }

    public int? BedCount { get; set; }

    public int? BathroomCount { get; set; }

    public List<string>? UnitFeatures { get; set; }

    public List<string>? PropertyFacilities { get; set; }

    public List<string>? SafetyFeatures { get; set; }

    public DateTime? AvailableFrom { get; set; }

    public DateTime? AvailableTo { get; set; }

    public bool IsAvailable { get; set; }
}
