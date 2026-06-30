namespace server.DTOs.Uploads;

public class CreateImageUploadUrlRequestDto
{
    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;
}
