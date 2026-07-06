using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using server.Data;
using server.Services;
using Stripe;
using Stripe.Checkout;

namespace server.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly StripeSettings _stripeSettings;
    private readonly RealtimeNotifier _realtime;

    public PaymentsController(
        AppDbContext context,
        IOptions<StripeSettings> stripeOptions,
        RealtimeNotifier realtime)
    {
        _context = context;
        _stripeSettings = stripeOptions.Value;
        _realtime = realtime;
    }

    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        if (string.IsNullOrWhiteSpace(_stripeSettings.WebhookSecret) ||
            string.Equals(
                _stripeSettings.WebhookSecret,
                "not_set_yet",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Stripe webhook secret is not configured." });
        }

        using var reader = new StreamReader(Request.Body);
        var requestBody = await reader.ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].ToString();

        if (string.IsNullOrWhiteSpace(signature))
        {
            return BadRequest(new { message = "Stripe-Signature header is missing." });
        }

        Event stripeEvent;

        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                requestBody,
                signature,
                _stripeSettings.WebhookSecret);
        }
        catch (StripeException)
        {
            return BadRequest(new { message = "Stripe webhook signature is invalid." });
        }

        if (!string.Equals(
                stripeEvent.Type,
                "checkout.session.completed",
                StringComparison.Ordinal))
        {
            return Ok(new { message = "Stripe event ignored." });
        }

        if (stripeEvent.Data.Object is not Session session)
        {
            return BadRequest(new { message = "Stripe Checkout Session data is missing." });
        }

        var booking = await _context.Bookings
            .FirstOrDefaultAsync(item => item.StripeSessionId == session.Id);

        if (booking == null)
        {
            return Ok(new { message = "No booking matches this Stripe Checkout Session." });
        }

        if (string.Equals(
                booking.PaymentStatus,
                "Refunded",
                StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new { message = "Booking payment was already refunded." });
        }

        if (string.Equals(
                booking.PaymentStatus,
                "Paid",
                StringComparison.OrdinalIgnoreCase) &&
            !string.IsNullOrWhiteSpace(booking.StripePaymentIntentId))
        {
            return Ok(new { message = "Booking payment was already recorded." });
        }

        booking.PaymentStatus = "Paid";
        booking.StripePaymentIntentId = session.PaymentIntentId;
        booking.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        var hostId = await _context.Properties
            .Where(property => property.Id == booking.PropertyId)
            .Select(property => property.HostId)
            .FirstOrDefaultAsync();
        await _realtime.NotifyUsersAsync(
            [booking.GuestId, hostId],
            new
            {
                Entity = "booking",
                Action = "payment-completed",
                BookingId = booking.Id,
                booking.PropertyId,
                booking.Status,
                booking.PaymentStatus
            });

        return Ok(new { message = "Booking paid and waiting for host approval." });
    }
}
