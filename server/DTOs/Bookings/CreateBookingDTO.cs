using System;
using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Bookings;

public class CreateBookingDto
{
    [Required]
    public int PropertyId { get; set; }

    [Required]
    public DateTime CheckIn { get; set; }

    [Required]
    public DateTime CheckOut { get; set; }

    [Range(1, int.MaxValue)]
    public int Adults { get; set; } = 1;

    [Range(0, int.MaxValue)]
    public int Children { get; set; }

    [Range(0, int.MaxValue)]
    public int Infants { get; set; }
}
