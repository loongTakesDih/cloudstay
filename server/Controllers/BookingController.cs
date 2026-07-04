using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs.Bookings;
using server.Models;
using server.Services;
using System.Security.Claims;


namespace server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly RealtimeNotifier _realtime;
    private readonly StripePaymentService _stripePaymentService;

    public BookingsController(
        AppDbContext context,
        RealtimeNotifier realtime,
        StripePaymentService stripePaymentService)
    {
        _context = context;
        _realtime = realtime;
        _stripePaymentService = stripePaymentService;
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
        // Booking dates are calendar dates, not local timestamps. Normalizing them
        // to UTC preserves the selected day and keeps Npgsql timestamptz comparisons valid.
        var checkInDate = DateTime.SpecifyKind(request.CheckIn.Date, DateTimeKind.Utc);
        var checkOutDate = DateTime.SpecifyKind(request.CheckOut.Date, DateTimeKind.Utc);

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

        if ((property.AvailableFrom.HasValue && checkInDate < property.AvailableFrom.Value.Date) ||
            (property.AvailableTo.HasValue && checkOutDate > property.AvailableTo.Value.Date))
        {
            return BadRequest(new { message = "The selected dates are outside this listing's availability." });
        }

        var requestedGuests = request.Adults + request.Children;
        if (request.Adults < 1 || request.Children < 0 || request.Infants < 0)
        {
            return BadRequest(new { message = "Guest counts are invalid." });
        }

        if (requestedGuests > (property.GuestCount ?? 0))
        {
            return BadRequest(new { message = $"This listing allows a maximum of {property.GuestCount ?? 0} guests, excluding infants." });
        }

        var overlapsAcceptedBooking = await _context.Bookings.AnyAsync(booking =>
            booking.PropertyId == request.PropertyId &&
            booking.Status == "Accepted" &&
            booking.CheckIn < checkOutDate &&
            booking.CheckOut > checkInDate);

        if (overlapsAcceptedBooking)
        {
            return Conflict(new { message = "This property is already booked for the selected dates." });
        }

        // 4. Securely calculate the Total Price
        var totalNights = (checkOutDate - checkInDate).Days;
        var calculatedPrice = totalNights * property.PricePerNight;

        // 5. Create the pending booking
        var booking = new Booking
        {
            GuestId = guestId,
            PropertyId = request.PropertyId,
            CheckIn = checkInDate,
            CheckOut = checkOutDate,
            Adults = request.Adults,
            Children = request.Children,
            Infants = request.Infants,
            TotalPrice = calculatedPrice,
            Status = "Pending", // Status defaults to Pending for Host review
            CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();
        await _realtime.NotifyUsersAsync(
            [guestId, property.HostId],
            new
            {
                Entity = "booking",
                Action = "created",
                BookingId = booking.Id,
                booking.PropertyId
            });

        return Ok(new 
        { 
            message = "Booking request sent successfully.", 
            bookingId = booking.Id 
        });
    }

    [Authorize]
    [HttpPost("{id}/create-payment-session")]
    public async Task<ActionResult> CreatePaymentSession(int id)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdString, out int guestId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var booking = await _context.Bookings
            .Include(item => item.Property)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        if (booking.GuestId != guestId)
        {
            return Forbid();
        }

        if (!string.Equals(booking.Status, "Accepted", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Only accepted bookings can be paid." });
        }

        if (string.Equals(booking.PaymentStatus, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "This booking has already been paid." });
        }

        if (booking.TotalPrice <= 0)
        {
            return BadRequest(new { message = "The booking total must be greater than zero." });
        }

        var amountInSen = decimal.ToInt64(booking.TotalPrice * 100m);
        var session = await _stripePaymentService.CreateCheckoutSessionAsync(
            booking.Id.ToString(),
            booking.Property!.Title,
            amountInSen,
            "myr");

        booking.StripeSessionId = session.Id;
        booking.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            checkoutUrl = session.Url,
            sessionId = session.Id
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
            b.Adults,
            b.Children,
            b.Infants,
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

    var currentStatus = booking.Status.Trim().ToLowerInvariant();
    var nextStatus = statusDto.Status?.Trim();
    var normalizedNextStatus = nextStatus?.ToLowerInvariant();
    var isValidTransition =
        currentStatus == "pending" &&
        (normalizedNextStatus == "accepted" || normalizedNextStatus == "declined") ||
        currentStatus == "accepted" &&
        normalizedNextStatus == "completed" &&
        booking.CheckOut.Date <= DateTime.UtcNow.Date;

    if (!isValidTransition)
    {
        return BadRequest(new
        {
            message = currentStatus == "accepted" && normalizedNextStatus == "completed"
                ? "Checkout can only be completed on or after the checkout date."
                : "This booking status change is not allowed."
        });
    }

    if (normalizedNextStatus == "accepted")
    {
        var hasAcceptedConflict = await _context.Bookings.AnyAsync(other =>
            other.Id != booking.Id &&
            other.PropertyId == booking.PropertyId &&
            other.Status == "Accepted" &&
            other.CheckIn < booking.CheckOut &&
            other.CheckOut > booking.CheckIn);

        if (hasAcceptedConflict)
        {
            return Conflict(new
            {
                message = "Another accepted booking already occupies these dates."
            });
        }
    }

    booking.Status = normalizedNextStatus switch
    {
        "accepted" => "Accepted",
        "declined" => "Declined",
        "completed" => "Completed",
        _ => booking.Status
    };
    await _context.SaveChangesAsync();
    await _realtime.NotifyUsersAsync(
        [booking.GuestId, userId],
        new
        {
            Entity = "booking",
            Action = "status-changed",
            BookingId = booking.Id,
            booking.PropertyId,
            booking.Status
        });
    if (normalizedNextStatus == "accepted")
    {
        await _realtime.NotifyAllAsync(new
        {
            Entity = "property",
            Action = "availability-changed",
            booking.PropertyId
        });
    }
    return Ok();
}

[Authorize]
[HttpPost("{id}/checkout")]
public async Task<ActionResult> Checkout(int id)
{
    var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!int.TryParse(userIdString, out int guestId))
    {
        return Unauthorized(new { message = "Invalid user session." });
    }

    var booking = await _context.Bookings
        .Include(item => item.Property)
        .FirstOrDefaultAsync(item => item.Id == id && item.GuestId == guestId);

    if (booking == null)
    {
        return NotFound(new { message = "Booking not found." });
    }

    if (!string.Equals(booking.Status, "Accepted", StringComparison.OrdinalIgnoreCase))
    {
        return BadRequest(new { message = "Only an accepted stay can be checked out." });
    }

    booking.Status = "CheckedOut";
    if (booking.Property != null)
    {
        booking.Property.IsAvailable = false;
        booking.Property.IsListed = false;
        booking.Property.UpdatedAt = DateTime.UtcNow;
    }

    await _context.SaveChangesAsync();
    await _realtime.NotifyUsersAsync(
        booking.Property == null
            ? [guestId]
            : [guestId, booking.Property.HostId],
        new
        {
            Entity = "booking",
            Action = "checked-out",
            BookingId = booking.Id,
            booking.PropertyId,
            booking.Status
        });
    await _realtime.NotifyAllAsync(new
    {
        Entity = "property",
        Action = "unlisted-after-checkout",
        booking.PropertyId
    });
    return Ok(new
    {
        booking.Id,
        booking.Status,
        message = "You have checked out. The host will inspect and relist the property when it is ready."
    });
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
            b.Adults,
            b.Children,
            b.Infants,
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
            b.Adults,
            b.Children,
            b.Infants,
            b.Status,
            b.PaymentStatus,
            b.TotalPrice,
            b.CreatedAt,
            Property = b.Property == null
                ? null
                : new
                {
                    b.Property.Id,
                    b.Property.Title,
                    b.Property.Location,
                    b.Property.HostId,
                    Host = b.Property.Host == null
                        ? null
                        : new
                        {
                            b.Property.Host.Id,
                            b.Property.Host.Username,
                            b.Property.Host.CreatedAt
                        }
                }
        })
        .ToListAsync();

    return Ok(bookings);
}
}
