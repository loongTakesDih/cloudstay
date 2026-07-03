using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs.Reviews;
using server.Models;

namespace server.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public ReviewsController(
        AppDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
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
    [HttpPost]
    public async Task<ActionResult> CreateReview(CreateReviewDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var booking = await _context.Bookings
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
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

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

        if (!string.Equals(status, "Accepted", StringComparison.OrdinalIgnoreCase))
        {
            return new(false, "Only accepted bookings can be reviewed.", null);
        }

        var today = DateTime.UtcNow.Date;
        var checkOutDate = checkOut.Date;
        var deadline = checkOutDate.AddDays(14);

        if (today < checkOutDate)
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

    private record ReviewEligibility(bool CanReview, string Reason, DateTime? ReviewDeadline);
}
