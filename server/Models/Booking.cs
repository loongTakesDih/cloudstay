namespace server.Models;

public class Booking
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User? User { get; set; }

    public int PropertyId { get; set; }

    public Property? Property { get; set; }

    public DateTime CheckInDate { get; set; }

    public DateTime CheckOutDate { get; set; }

    public string Status { get; set; } = "Pending";
}