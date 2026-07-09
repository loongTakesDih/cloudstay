using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs.Reviews;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly RealtimeNotifier _realtime;

    public ReviewsController(
        AppDbContext context,
        IWebHostEnvironment environment,
        RealtimeNotifier realtime)
    {
        _context = context;
        _environment = environment;
        _realtime = realtime;
    }

    [HttpGet("property/{propertyId:int}")]
    public async Task<ActionResult> GetPropertyReviews(int propertyId)
    {
        var propertyExists = await _context.Properties.AnyAsync(property => property.Id == propertyId);
        if (!propertyExists)
        {
            return NotFound(new { message = "Listing not found." });
        }

        var reviews = await _context.Reviews
            .Where(review => review.PropertyId == propertyId)
            .OrderByDescending(review => review.CreatedAt)
            .Select(review => new
            {
                review.Id,
                review.OverallRating,
                review.CleanlinessRating,
                review.AccuracyRating,
                review.CheckInRating,
                review.CommunicationRating,
                review.LocationRating,
                review.ValueRating,
                review.Comment,
                review.CreatedAt,
                GuestName = review.Guest != null ? review.Guest.Username : "Guest",
                StayDate = review.Booking != null ? review.Booking.CheckOut : (DateTime?)null
            })
            .ToListAsync();

        return Ok(new
        {
            ReviewCount = reviews.Count,
            OverallRating = reviews.Count == 0
                ? 0
                : Math.Round(reviews.Average(review => review.OverallRating), 1),
            Categories = new
            {
                Cleanliness = reviews.Count == 0 ? 0 : Math.Round(reviews.Average(review => review.CleanlinessRating), 1),
                Accuracy = reviews.Count == 0 ? 0 : Math.Round(reviews.Average(review => review.AccuracyRating), 1),
                CheckIn = reviews.Count == 0 ? 0 : Math.Round(reviews.Average(review => review.CheckInRating), 1),
                Communication = reviews.Count == 0 ? 0 : Math.Round(reviews.Average(review => review.CommunicationRating), 1),
                Location = reviews.Count == 0 ? 0 : Math.Round(reviews.Average(review => review.LocationRating), 1),
                Value = reviews.Count == 0 ? 0 : Math.Round(reviews.Average(review => review.ValueRating), 1)
            },
            RatingDistribution = Enumerable.Range(1, 5)
                .OrderByDescending(rating => rating)
                .Select(rating => new
                {
                    Rating = rating,
                    Count = reviews.Count(review => review.OverallRating == rating)
                }),
            Reviews = reviews
        });
    }

    [Authorize]
    [HttpGet("eligibility/{bookingId:int}")]
    public async Task<ActionResult> GetEligibility(int bookingId)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var booking = await _context.Bookings
            .Where(item => item.Id == bookingId && item.GuestId == userId)
            .Select(item => new
            {
                item.Id,
                item.Status,
                item.CheckOut,
                HasReview = _context.Reviews.Any(review => review.BookingId == item.Id)
            })
            .FirstOrDefaultAsync();

        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        var result = GetEligibilityResult(
            booking.Status,
            booking.CheckOut,
            booking.HasReview,
            _environment.IsDevelopment());
        return Ok(result);
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult> GetMyReviews()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var reviews = await _context.Reviews
            .Where(review => review.GuestId == userId)
            .OrderByDescending(review => review.CreatedAt)
            .Select(review => new
            {
                review.Id,
                review.BookingId,
                review.PropertyId,
                review.OverallRating,
                review.Comment,
                review.CreatedAt,
                PropertyTitle = review.Property != null
                    ? review.Property.Title
                    : "CloudStay property"
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult> CreateReview(CreateReviewDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var booking = await _context.Bookings
            .Include(item => item.Property)
            .FirstOrDefaultAsync(item => item.Id == request.BookingId && item.GuestId == userId);

        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        var hasReview = await _context.Reviews.AnyAsync(review => review.BookingId == booking.Id);
        var eligibility = GetEligibilityResult(
            booking.Status,
            booking.CheckOut,
            hasReview,
            _environment.IsDevelopment());
        if (!eligibility.CanReview)
        {
            return BadRequest(new { message = eligibility.Reason });
        }

        if (booking.Property?.HostId == userId)
        {
            return BadRequest(new { message = "You cannot review yourself as a host." });
        }

        var review = new Review
        {
            BookingId = booking.Id,
            PropertyId = booking.PropertyId,
            GuestId = userId,
            OverallRating = request.OverallRating,
            CleanlinessRating = request.CleanlinessRating,
            AccuracyRating = request.AccuracyRating,
            CheckInRating = request.CheckInRating,
            CommunicationRating = request.CommunicationRating,
            LocationRating = request.LocationRating,
            ValueRating = request.ValueRating,
            Comment = request.Comment.Trim(),
            HostRating = request.HostRating,
            HostReviewComment = EmptyToNull(request.HostReviewComment),
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        await _realtime.NotifyAllAsync(new
        {
            Entity = "review",
            Action = "created",
            ReviewId = review.Id,
            review.PropertyId,
            review.BookingId
        });

        return Ok(new { review.Id, message = "Your review has been published." });
    }

    private static ReviewEligibility GetEligibilityResult(
        string status,
        DateTime checkOut,
        bool hasReview,
        bool allowBeforeCheckout)
    {
        if (hasReview)
        {
            return new(false, "You have already reviewed this stay.", null);
        }

        var hasCompletedStay =
            string.Equals(status, "Accepted", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "CheckedOut", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "Completed", StringComparison.OrdinalIgnoreCase);
        if (!hasCompletedStay)
        {
            return new(false, "Only completed stays can be reviewed.", null);
        }

        var today = DateTime.UtcNow.Date;
        var checkOutDate = checkOut.Date;
        var deadline = checkOutDate.AddDays(14);

        var checkedOutManually =
            string.Equals(status, "CheckedOut", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "Completed", StringComparison.OrdinalIgnoreCase);
        if (today < checkOutDate && !checkedOutManually)
        {
            if (allowBeforeCheckout)
            {
                return new(
                    true,
                    "Development testing mode: this accepted stay can be reviewed before checkout.",
                    deadline);
            }

            return new(
                false,
                $"You can review this stay after checkout on {checkOutDate:dd MMM yyyy}.",
                deadline);
        }

        if (today > deadline)
        {
            return new(false, "The 14-day review period has ended.", deadline);
        }

        return new(true, "Your stay is ready to review.", deadline);
    }

    private bool TryGetUserId(out int userId)
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out userId);
    }

    private static string? EmptyToNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private record ReviewEligibility(bool CanReview, string Reason, DateTime? ReviewDeadline);
}
