using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using server.Data;
using server.Models;

namespace server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BookingsController(AppDbContext context)
    {
        _context = context;
    }

// POST: api/bookings
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] BookingRequestDto request)
    {
        try
        {
            // 1. Get the logged-in Guest's User ID from the JWT Token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized(new { message = "User not recognized." });
            
            int guestId = int.Parse(userIdClaim);

            // 🚨 THE FIX: Force dates into strict UTC so PostgreSQL accepts them
            var checkInUtc = request.CheckIn.ToUniversalTime();
            var checkOutUtc = request.CheckOut.ToUniversalTime();

            // 2. Validate dates
            if (checkInUtc >= checkOutUtc)
            {
                return BadRequest(new { message = "Check-out date must be after the check-in date." });
            }

            // 3. Check if the property exists
            var property = await _context.Properties.FindAsync(request.PropertyId);
            if (property == null) return NotFound(new { message = "Property not found." });

            // 4. Prevent double-booking
            var isOverlapping = await _context.Bookings
                .AnyAsync(b => b.PropertyId == request.PropertyId &&
                               checkInUtc < b.CheckOut && 
                               checkOutUtc > b.CheckIn);

            if (isOverlapping)
            {
                return BadRequest(new { message = "This property is already booked for the selected dates." });
            }

            // 5. Calculate total price
            int totalNights = (checkOutUtc - checkInUtc).Days;
            
            // Safety check: ensure totalNights is at least 1 just in case
            if (totalNights < 1) totalNights = 1; 
            
            decimal totalPrice = totalNights * property.PricePerNight;

            // 6. Create the Booking entity
            var booking = new Booking
            {
                PropertyId = request.PropertyId,
                GuestId = guestId,
                CheckIn = checkInUtc,
                CheckOut = checkOutUtc,
                TotalPrice = totalPrice,
                Status = "Confirmed",
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok(booking);
        }
        catch (Exception ex)
        {
            // If it crashes, send the ACTUAL backend error text to the frontend box!
            var actualError = ex.InnerException?.Message ?? ex.Message;
            return BadRequest(new { message = $"Backend Error: {actualError}" });
        }
    }

    // GET: api/bookings/my-trips
    [HttpGet("my-trips")]
    public async Task<IActionResult> GetMyTrips()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        int guestId = int.Parse(userIdClaim);

        var trips = await _context.Bookings
            .Where(b => b.GuestId == guestId)
            .Include(b => b.Property) // Include property details like title/images
            .OrderByDescending(b => b.CheckIn)
            .ToListAsync();

        return Ok(trips);
    }
}

// Data Transfer Object for incoming requests
public class BookingRequestDto
{
    public int PropertyId { get; set; }
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
}