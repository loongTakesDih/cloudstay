using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace server.Models;

public class Booking
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PropertyId { get; set; }
    
    // Links this booking to the actual Property in the database
    [ForeignKey("PropertyId")]
    public Property? Property { get; set; }

    [Required]
    public int GuestId { get; set; }

    [Required]
    public DateTime CheckIn { get; set; }

    [Required]
    public DateTime CheckOut { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,2)")] // Good practice for money values in databases
    public decimal TotalPrice { get; set; }

    public string Status { get; set; } = "Confirmed";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}