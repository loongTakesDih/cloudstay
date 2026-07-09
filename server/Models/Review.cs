using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models;

public class Review
{
    public int Id { get; set; }

    [Required]
    public int BookingId { get; set; }

    [ForeignKey(nameof(BookingId))]
    public Booking? Booking { get; set; }

    [Required]
    public int PropertyId { get; set; }

    [ForeignKey(nameof(PropertyId))]
    public Property? Property { get; set; }

    [Required]
    public int GuestId { get; set; }

    [ForeignKey(nameof(GuestId))]
    public User? Guest { get; set; }

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
    [MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;

    [Range(1, 5)]
    public int? HostRating { get; set; }

    [MaxLength(2000)]
    public string? HostReviewComment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
