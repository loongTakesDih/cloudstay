using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs.Bookings;
using server.Models;
using System.Security.Claims;


namespace server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BookingsController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult> RequestBooking(CreateBookingDto request)
    {
        // 1. Get the current logged-in guest's ID
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int guestId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        // 2. Validate the dates
        var checkInDate = request.CheckIn.Date;
        var checkOutDate = request.CheckOut.Date;

        if (checkInDate >= checkOutDate)
        {
            return BadRequest(new { message = "Check-out date must be after check-in date." });
        }

        if (checkInDate < DateTime.UtcNow.Date)
        {
            return BadRequest(new { message = "Cannot book dates in the past." });
        }

        // 3. Verify the property exists and is available
        var property = await _context.Properties.FindAsync(request.PropertyId);
        
        if (property == null || !property.IsListed || !property.IsAvailable)
        {
            return NotFound(new { message = "Property is unavailable for booking." });
        }

        if (property.HostId == guestId)
        {
            return BadRequest(new { message = "Hosts cannot book their own property." });
        }

        // 4. Securely calculate the Total Price
        var totalNights = (checkOutDate - checkInDate).Days;
        var calculatedPrice = totalNights * property.PricePerNight;

        // 5. Create the pending booking
        var booking = new Booking
        {
            GuestId = guestId,
            PropertyId = request.PropertyId,
            // Convert to UTC to match PostgreSQL's TIMESTAMP WITH TIME ZONE
            CheckIn = checkInDate.ToUniversalTime(), 
            CheckOut = checkOutDate.ToUniversalTime(),
            TotalPrice = calculatedPrice,
            Status = "Pending", // Status defaults to Pending for Host review
            CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        return Ok(new 
        { 
            message = "Booking request sent successfully.", 
            bookingId = booking.Id 
        });
    }
[Authorize]
[HttpGet("{id}")]
public async Task<ActionResult<Booking>> GetBooking(int id) 
{
    var booking = await _context.Bookings
        .Include(b => b.Property)
        .Include(b => b.Guest)
        .FirstOrDefaultAsync(b => b.Id == id);
    return booking != null ? Ok(booking) : NotFound();
}

[Authorize]
[HttpPut("{id}/status")]
public async Task<ActionResult> UpdateStatus(int id, [FromBody] StatusDto statusDto)
{
    var booking = await _context.Bookings.FindAsync(id);
    if (booking == null) return NotFound();
    
    booking.Status = statusDto.Status;
    await _context.SaveChangesAsync();
    return Ok();
}

    [Authorize]
[HttpGet("host/requests")]
public async Task<ActionResult<IEnumerable<Booking>>> GetHostBookingRequests()
{
    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!int.TryParse(userIdString, out int hostId))
    {
        return Unauthorized();
    }

    // This query finds all bookings for properties owned by this host
    var requests = await _context.Bookings
        .Include(b => b.Property)
        .Include(b => b.Guest)
        .Where(b => b.Property.HostId == hostId && b.Status == "Pending")
        .OrderByDescending(b => b.CreatedAt)
        .ToListAsync();

    return Ok(requests);
}

[Authorize]
[HttpGet("my-trips")]
public async Task<ActionResult<IEnumerable<Booking>>> GetMyBookings()
{
    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!int.TryParse(userIdString, out int guestId))
    {
        return Unauthorized();
    }

    var bookings = await _context.Bookings
        .Include(b => b.Property)
        .Where(b => b.GuestId == guestId)
        .OrderByDescending(b => b.CreatedAt)
        .ToListAsync();

    return Ok(bookings);
}
}