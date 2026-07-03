namespace server.DTOs.Uploads;

public class CreateImageUploadUrlResponseDto
{
    public string UploadUrl { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

    public string ObjectKey { get; set; } = string.Empty;
}
