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
}