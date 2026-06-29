using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models;

public class Booking
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int GuestId { get; set; }

    // Navigation property for Entity Framework
    [ForeignKey("GuestId")]
    public User? Guest { get; set; }

    [Required]
    public int PropertyId { get; set; }

    // Navigation property for Entity Framework
    [ForeignKey("PropertyId")]
    public Property? Property { get; set; }

    [Required]
    public DateTime CheckIn { get; set; }

    [Required]
    public DateTime CheckOut { get; set; }

    [Required]
    public string Status { get; set; } = "Pending";

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}