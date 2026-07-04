using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Reviews;

public class CreateReviewDto
{
    [Required]
    public int BookingId { get; set; }

    [Range(1, 5)]
    public int OverallRating { get; set; }

    [Range(1, 5)]
    public int CleanlinessRating { get; set; }

    [Range(1, 5)]
    public int AccuracyRating { get; set; }

    [Range(1, 5)]
    public int CheckInRating { get; set; }

    [Range(1, 5)]
    public int CommunicationRating { get; set; }

    [Range(1, 5)]
    public int LocationRating { get; set; }

    [Range(1, 5)]
    public int ValueRating { get; set; }

    [Required]
    [StringLength(2000, MinimumLength = 10)]
    public string Comment { get; set; } = string.Empty;
}
