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
public async Task<ActionResult> GetBooking(int id) 
{
    var bookingAccess = await _context.Bookings
        .Select(b => new
        {
            b.Id,
            b.GuestId,
            PropertyHostId = b.Property != null ? b.Property.HostId : (int?)null
        })
        .FirstOrDefaultAsync(b => b.Id == id);

    if (bookingAccess == null)
    {
        return NotFound();
    }

    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!int.TryParse(userIdString, out int userId))
    {
        return Unauthorized();
    }

    var canAccess = bookingAccess.GuestId == userId || bookingAccess.PropertyHostId == userId;
    if (!canAccess)
    {
        return Forbid();
    }

    var booking = await _context.Bookings
        .Where(b => b.Id == id)
        .Select(b => new
        {
            b.Id,
            b.GuestId,
            b.PropertyId,
            b.CheckIn,
            b.CheckOut,
            b.Status,
            b.TotalPrice,
            b.CreatedAt,
            Property = b.Property == null
                ? null
                : new
                {
                    b.Property.Id,
                    b.Property.Title,
                    b.Property.Location
                },
            Guest = b.Guest == null
                ? null
                : new
                {
                    b.Guest.Id,
                    b.Guest.Username,
                    b.Guest.Email
                }
        })
        .FirstOrDefaultAsync();

    return Ok(booking);
}

[Authorize]
[HttpPut("{id}/status")]
public async Task<ActionResult> UpdateStatus(int id, [FromBody] StatusDto statusDto)
{
    var booking = await _context.Bookings
        .Include(b => b.Property)
        .FirstOrDefaultAsync(b => b.Id == id);

    if (booking == null) return NotFound();

    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!int.TryParse(userIdString, out int userId))
    {
        return Unauthorized();
    }

    if (booking.Property?.HostId != userId)
    {
        return Forbid();
    }

    booking.Status = statusDto.Status;
    await _context.SaveChangesAsync();
    return Ok();
}

    [Authorize]
[HttpGet("host/requests")]
public async Task<ActionResult> GetHostBookingRequests()
{
    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!int.TryParse(userIdString, out int hostId))
    {
        return Unauthorized();
    }

    var hostPropertyIds = await _context.Properties
        .Where(property => property.HostId == hostId)
        .Select(property => property.Id)
        .ToListAsync();

    var requests = await _context.Bookings
        .Where(b => hostPropertyIds.Contains(b.PropertyId))
        .OrderByDescending(b => b.CreatedAt)
        .Select(b => new
        {
            b.Id,
            b.GuestId,
            b.PropertyId,
            b.CheckIn,
            b.CheckOut,
            b.Status,
            b.TotalPrice,
            b.CreatedAt,
            Property = b.Property == null
                ? null
                : new
                {
                    b.Property.Id,
                    b.Property.Title,
                    b.Property.Location
                },
            Guest = b.Guest == null
                ? null
                : new
                {
                    b.Guest.Id,
                    b.Guest.Username,
                    b.Guest.Email
                }
        })
        .ToListAsync();

    return Ok(requests);
}

[Authorize]
[HttpGet("my-trips")]
public async Task<ActionResult> GetMyBookings()
{
    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!int.TryParse(userIdString, out int guestId))
    {
        return Unauthorized();
    }

    var bookings = await _context.Bookings
        .Where(b => b.GuestId == guestId)
        .OrderByDescending(b => b.CreatedAt)
        .Select(b => new
        {
            b.Id,
            b.GuestId,
            b.PropertyId,
            b.CheckIn,
            b.CheckOut,
            b.Status,
            b.TotalPrice,
            b.CreatedAt,
            Property = b.Property == null
                ? null
                : new
                {
                    b.Property.Id,
                    b.Property.Title,
                    b.Property.Location
                }
        })
        .ToListAsync();

    return Ok(bookings);
}
}
