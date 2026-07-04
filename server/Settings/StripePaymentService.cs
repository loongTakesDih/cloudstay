using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

public class StripePaymentService
{
    private readonly StripeSettings _stripeSettings;
    private readonly IConfiguration _configuration;

    public StripePaymentService(
        IOptions<StripeSettings> stripeOptions,
        IConfiguration configuration)
    {
        _stripeSettings = stripeOptions.Value;
        _configuration = configuration;

        StripeConfiguration.ApiKey = _stripeSettings.SecretKey;
    }

    public async Task<Session> CreateCheckoutSessionAsync(
        string bookingId,
        string propertyTitle,
        long amountInSen,
        string currency = "myr")
    {
        var clientUrl = _configuration["ClientUrl"] ?? "http://localhost:5173";

        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string>
            {
                "card"
            },
            Mode = "payment",
            SuccessUrl = $"{clientUrl}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{clientUrl}/payment-cancel",
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        Currency = currency,
                        UnitAmount = amountInSen,
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = propertyTitle
                        }
                    }
                }
            },
            Metadata = new Dictionary<string, string>
            {
                { "bookingId", bookingId }
            }
        };

        var service = new SessionService();
        return await service.CreateAsync(options);
    }
}