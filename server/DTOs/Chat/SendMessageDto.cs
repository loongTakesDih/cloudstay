using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Chat;

public class SendMessageDto
{
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Body { get; set; } = string.Empty;
}
