using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models;

public class Conversation
{
    [Key]
    public int Id { get; set; }

    public int? BookingId { get; set; }

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

    [Required]
    public int HostId { get; set; }

    [ForeignKey(nameof(HostId))]
    public User? Host { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
