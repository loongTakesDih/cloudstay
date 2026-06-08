namespace server.DTOs.Properties;

public class CreatePropertyRequestDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal PricePerNight { get; set; }

    public string Location { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
}
