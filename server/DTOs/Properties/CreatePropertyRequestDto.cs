namespace server.DTOs.Properties;

public class CreatePropertyRequestDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal PricePerNight { get; set; }

    public string Location { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public List<string> ImageUrls { get; set; } = [];

    public string PropertyCategory { get; set; } = string.Empty;

    public string? PlaceType { get; set; }

    public string? Address { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public string? AddressLine { get; set; }

    public string? City { get; set; }

    public string? State { get; set; }

    public string? PostalCode { get; set; }

    public string? Country { get; set; }

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
