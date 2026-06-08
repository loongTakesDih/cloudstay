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
}
