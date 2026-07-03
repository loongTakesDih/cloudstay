using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs.Properties;
using server.Models;
using server.Services;
using System.Security.Claims;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly RealtimeNotifier _realtime;

    public PropertiesController(AppDbContext context, RealtimeNotifier realtime)
    {
        _context = context;
        _realtime = realtime;
    }
    
    [HttpGet]
        public async Task<ActionResult<IEnumerable<PropertyResponseDto>>> GetPublicProperties()
        {
            var properties = await _context.Properties
                .Where(property =>
                    property.IsListed &&
                    property.IsAvailable &&
                    (property.AvailableTo == null ||
                     property.AvailableTo > DateTime.UtcNow.Date) &&
                    !_context.Bookings.Any(booking =>
                        booking.PropertyId == property.Id &&
                        booking.Status == "Accepted"))
                .OrderByDescending(property => property.CreatedAt)
                .ToListAsync();

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = null;

            if (int.TryParse(userIdString, out int parsedId)) 
            {
                userId = parsedId;
            }

            return Ok(await MapPropertiesAsync(properties, userId));
        }


    [HttpGet("{id:int}")]
    public async Task<ActionResult<PropertyResponseDto>> GetProperty(int id)
    {
        var property = await _context.Properties.FindAsync(id);

        if (property == null)
        {
            return NotFound(new
            {
                message = "Listing not found."
            });
        }

        // Security block successfully removed from here!

        return Ok(await MapPropertyAsync(property, GetCurrentUserId()));
    }

    [HttpGet("{id:int}/availability")]
    public async Task<ActionResult> GetPropertyAvailability(int id)
    {
        var property = await _context.Properties
            .Where(item => item.Id == id)
            .Select(item => new
            {
                item.Id,
                item.AvailableFrom,
                item.AvailableTo,
                item.IsAvailable
            })
            .FirstOrDefaultAsync();

        if (property == null)
        {
            return NotFound(new { message = "Listing not found." });
        }

        var blockedRanges = await _context.Bookings
            .Where(booking =>
                booking.PropertyId == id &&
                booking.Status.ToLower() == "accepted")
            .OrderBy(booking => booking.CheckIn)
            .Select(booking => new
            {
                booking.CheckIn,
                booking.CheckOut
            })
            .ToListAsync();

        return Ok(new
        {
            property.Id,
            property.AvailableFrom,
            property.AvailableTo,
            property.IsAvailable,
            BlockedRanges = blockedRanges
        });
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<PropertyResponseDto>> CreateProperty(
        CreatePropertyRequestDto request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var host = await _context.Users.FindAsync(userId.Value);

        if (host == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        if (!host.IsHost)
        {
            return Forbid();
        }

        var validationError = ValidateFullListing(request);

        if (validationError != null)
        {
            return BadRequest(new
            {
                message = validationError
            });
        }

        var property = BuildProperty(request, userId.Value, isListed: false);
        property.IsAvailable = true;

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        AddPropertyImages(property.Id, request);
        await _context.SaveChangesAsync();
        await _realtime.NotifyAllAsync(new
        {
            Entity = "property",
            Action = "created",
            PropertyId = property.Id
        });

        return Created($"/api/properties/{property.Id}", await MapPropertyAsync(property, userId.Value));
    }

    [Authorize]
    [HttpGet("my")]
    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<PropertyResponseDto>>> GetMyProperties()
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var properties = await _context.Properties
            .Where(property => property.HostId == userId.Value)
            .OrderByDescending(property => property.CreatedAt)
            .ToListAsync();

        return Ok(await MapPropertiesAsync(properties, userId.Value));
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<PropertyResponseDto>> UpdateProperty(
        int id,
        CreatePropertyRequestDto request)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var property = await _context.Properties.FindAsync(id);

        if (property == null)
        {
            return NotFound(new
            {
                message = "Listing not found."
            });
        }

        if (property.HostId != userId.Value)
        {
            return Forbid();
        }

        var validationError = ValidateFullListing(request);

        if (validationError != null)
        {
            return BadRequest(new
            {
                message = validationError
            });
        }

        ApplyPropertyChanges(property, request);
        ReplacePropertyImages(property.Id, request);
        await _context.SaveChangesAsync();
        await _realtime.NotifyAllAsync(new
        {
            Entity = "property",
            Action = "updated",
            PropertyId = property.Id
        });

        return Ok(await MapPropertyAsync(property, userId.Value));
    }

    [Authorize]
    [HttpPatch("{id:int}/publish")]
    public async Task<ActionResult<PropertyResponseDto>> PublishProperty(int id)
    {
        return await SetPublishState(id, isListed: true);
    }

    [Authorize]
    [HttpPatch("{id:int}/unpublish")]
    public async Task<ActionResult<PropertyResponseDto>> UnpublishProperty(int id)
    {
        return await SetPublishState(id, isListed: false);
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProperty(int id)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var property = await _context.Properties.FindAsync(id);

        if (property == null)
        {
            return NotFound(new
            {
                message = "Listing not found."
            });
        }

        if (property.HostId != userId.Value)
        {
            return Forbid();
        }

        var hasBookings = await _context.Bookings
            .AnyAsync(booking => booking.PropertyId == id);

        if (hasBookings)
        {
            return Conflict(new
            {
                message = "This listing has bookings and cannot be deleted."
            });
        }

        var images = await _context.PropertyImages
            .Where(image => image.PropertyId == id)
            .ToListAsync();

        _context.PropertyImages.RemoveRange(images);
        _context.Properties.Remove(property);
        await _context.SaveChangesAsync();
        await _realtime.NotifyAllAsync(new
        {
            Entity = "property",
            Action = "deleted",
            PropertyId = property.Id
        });

        return NoContent();
    }

    private async Task<ActionResult<PropertyResponseDto>> SetPublishState(
        int id,
        bool isListed)
    {
        var userId = GetCurrentUserId();

        if (userId == null)
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var property = await _context.Properties.FindAsync(id);

        if (property == null)
        {
            return NotFound(new
            {
                message = "Listing not found."
            });
        }

        if (property.HostId != userId.Value)
        {
            return Forbid();
        }

        if (isListed)
        {
            if (!property.IsAvailable)
            {
                var checkedOutBooking = await _context.Bookings
                    .Where(booking =>
                        booking.PropertyId == property.Id &&
                        booking.Status == "CheckedOut")
                    .OrderByDescending(booking => booking.CreatedAt)
                    .FirstOrDefaultAsync();

                if (checkedOutBooking == null)
                {
                    return BadRequest(new
                    {
                        message = "Mark this listing as available before publishing it."
                    });
                }

                // Publishing after checkout is the host's confirmation that inspection
                // and preparation are complete.
                checkedOutBooking.Status = "Completed";
                property.IsAvailable = true;
            }

            if (property.AvailableFrom == null || property.AvailableTo == null)
            {
                return BadRequest(new
                {
                    message = "Set an availability date range before publishing this listing."
                });
            }

            if (property.AvailableTo.Value.Date <= DateTime.UtcNow.Date)
            {
                return BadRequest(new
                {
                    message = "This listing's availability has ended. Edit the availability dates before publishing it."
                });
            }
        }

        property.IsListed = isListed;
        property.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _realtime.NotifyAllAsync(new
        {
            Entity = "property",
            Action = isListed ? "published" : "unpublished",
            PropertyId = property.Id
        });

        return Ok(await MapPropertyAsync(property, userId.Value));
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    internal static string? ValidateFullListing(CreatePropertyRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PropertyCategory))
        {
            return "Property category is required.";
        }

        if (string.IsNullOrWhiteSpace(request.PlaceType))
        {
            return "Place type is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Address) &&
            string.IsNullOrWhiteSpace(request.Location))
        {
            return "Address or location is required.";
        }

        if (request.Latitude.HasValue != request.Longitude.HasValue)
        {
            return "Select a complete location on the map.";
        }

        if (request.Latitude is < -90 or > 90 ||
            request.Longitude is < -180 or > 180)
        {
            return "The selected map location is invalid.";
        }

        var hasAnyStructuredLocation =
            !string.IsNullOrWhiteSpace(request.AddressLine) ||
            !string.IsNullOrWhiteSpace(request.City) ||
            !string.IsNullOrWhiteSpace(request.State) ||
            !string.IsNullOrWhiteSpace(request.Country);

        if (hasAnyStructuredLocation &&
            (string.IsNullOrWhiteSpace(request.AddressLine) ||
             string.IsNullOrWhiteSpace(request.City) ||
             string.IsNullOrWhiteSpace(request.State) ||
             string.IsNullOrWhiteSpace(request.Country)))
        {
            return "Street address, city, state, and country are required.";
        }

        if (request.GuestCount < 1)
        {
            return "Guest count must be at least 1.";
        }

        if (request.BedroomCount < 0 ||
            request.BedCount < 0 ||
            request.BathroomCount < 0)
        {
            return "Bedroom, bed, and bathroom counts cannot be negative.";
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return "Listing title is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return "Listing description is required.";
        }

        if (request.PricePerNight <= 0)
        {
            return "A valid nightly price is required.";
        }

        if (request.AvailableFrom == null || request.AvailableTo == null)
        {
            return "Availability dates are required.";
        }

        if (request.AvailableTo.Value.Date < request.AvailableFrom.Value.Date)
        {
            return "Available To cannot be earlier than Available From.";
        }

        return null;
    }

    internal static Property BuildProperty(
        CreatePropertyRequestDto request,
        int hostId,
        bool isListed)
    {
        var property = new Property
        {
            HostId = hostId,
            IsListed = isListed,
            CreatedAt = DateTime.UtcNow
        };

        ApplyPropertyChanges(property, request);

        return property;
    }

    internal static void ApplyPropertyChanges(
        Property property,
        CreatePropertyRequestDto request)
    {
        // 1. String Fixes: Added ?.Trim() ?? string.Empty to handle null strings safely
        var address = request.Address?.Trim() ?? string.Empty;
        var location = request.Location?.Trim() ?? string.Empty;

        property.Title = request.Title?.Trim() ?? string.Empty;
        property.Description = request.Description?.Trim() ?? string.Empty;
        property.PricePerNight = request.PricePerNight;
        property.Location = string.IsNullOrWhiteSpace(location) ? address : location;
        
        // 2. EmptyToNull Fixes: Ensure we don't pass null into the helper method
        property.PropertyCategory = EmptyToNull(request.PropertyCategory ?? string.Empty);
        property.PlaceType = EmptyToNull(request.PlaceType ?? string.Empty);
        property.Address = string.IsNullOrWhiteSpace(address) ? property.Location : address;
        property.Latitude = request.Latitude;
        property.Longitude = request.Longitude;
        property.AddressLine = EmptyToNull(request.AddressLine ?? string.Empty);
        property.City = EmptyToNull(request.City ?? string.Empty);
        property.State = EmptyToNull(request.State ?? string.Empty);
        property.PostalCode = EmptyToNull(request.PostalCode ?? string.Empty);
        property.Country = EmptyToNull(request.Country ?? string.Empty);
        
        // 3. Integer Fixes: Added ?? 0 to safely convert 'int?' to 'int'
        property.GuestCount = request.GuestCount ?? 0;
        property.BedroomCount = request.BedroomCount ?? 0;
        property.BedCount = request.BedCount ?? 0;
        property.BathroomCount = request.BathroomCount ?? 0;
        
        property.UnitFeatures = JoinSelections(request.UnitFeatures);
        property.PropertyFacilities = JoinSelections(request.PropertyFacilities);
        property.SafetyFeatures = JoinSelections(request.SafetyFeatures);
        property.AvailableFrom = ToUtcDate(request.AvailableFrom);
        property.AvailableTo = ToUtcDate(request.AvailableTo);
        property.IsAvailable = request.IsAvailable;
        property.UpdatedAt = DateTime.UtcNow;
    }

    internal async Task<PropertyResponseDto> MapPropertyAsync(
        Property property,
        int? currentUserId = null)
    {
        var imageUrls = await _context.PropertyImages
            .Where(image => image.PropertyId == property.Id)
            .OrderBy(image => image.Id)
            .Select(image => image.ImageUrl)
            .ToListAsync();

        var host = await _context.Users
            .Where(user => user.Id == property.HostId)
            .Select(user => new PropertyHostSummaryDto
            {
                HostId = user.Id,
                Username = user.Username,
                CreatedAt = user.CreatedAt,
                IsHost = user.IsHost
            })
            .FirstOrDefaultAsync();

        return MapProperty(property, imageUrls, host, currentUserId);
    }

    private async Task<List<PropertyResponseDto>> MapPropertiesAsync(
        List<Property> properties,
        int? currentUserId = null)
    {
        var propertyIds = properties.Select(property => property.Id).ToList();
        var hostIds = properties.Select(property => property.HostId).Distinct().ToList();
        var images = await _context.PropertyImages
            .Where(image => propertyIds.Contains(image.PropertyId))
            .OrderBy(image => image.Id)
            .ToListAsync();

        var imagesByPropertyId = images
            .GroupBy(image => image.PropertyId)
            .ToDictionary(
                group => group.Key,
                group => group.Select(image => image.ImageUrl).ToList());

        var hosts = await _context.Users
            .Where(user => hostIds.Contains(user.Id))
            .Select(user => new PropertyHostSummaryDto
            {
                HostId = user.Id,
                Username = user.Username,
                CreatedAt = user.CreatedAt,
                IsHost = user.IsHost
            })
            .ToDictionaryAsync(host => host.HostId);

        return properties
            .Select(property =>
            {
                imagesByPropertyId.TryGetValue(property.Id, out var imageUrls);
                hosts.TryGetValue(property.HostId, out var host);
                return MapProperty(property, imageUrls ?? [], host, currentUserId);
            })
            .ToList();
    }

internal static PropertyResponseDto MapProperty(
        Property property,
        List<string>? imageUrls = null,
        PropertyHostSummaryDto? host = null,
        int? currentUserId = null)
    {
        imageUrls ??= [];
        var createdAt = property.CreatedAt ?? DateTime.UtcNow;
        var updatedAt = property.UpdatedAt ?? createdAt;

        return new PropertyResponseDto
        {
            Id = property.Id,
            Title = property.Title,
            Description = property.Description,
            PricePerNight = property.PricePerNight,
            Location = property.Location,
            HostId = property.HostId,
            ImageUrl = imageUrls.FirstOrDefault(),
            ImageUrls = imageUrls,
            PropertyCategory = property.PropertyCategory,
            PlaceType = property.PlaceType,
            Address = property.Address,
            Latitude = property.Latitude,
            Longitude = property.Longitude,
            AddressLine = property.AddressLine,
            City = property.City,
            State = property.State,
            PostalCode = property.PostalCode,
            Country = property.Country,
            GuestCount = property.GuestCount,
            BedroomCount = property.BedroomCount,
            BedCount = property.BedCount,
            BathroomCount = property.BathroomCount,
            UnitFeatures = property.UnitFeatures,
            PropertyFacilities = property.PropertyFacilities,
            SafetyFeatures = property.SafetyFeatures,
            AvailableFrom = property.AvailableFrom,
            AvailableTo = property.AvailableTo,
            IsListed = property.IsListed,
            IsAvailable = property.IsAvailable,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
            IsOwner = currentUserId != null && property.HostId == currentUserId.Value,
            Host = host
        };
    }

    internal static List<string> NormalizeImageUrls(CreatePropertyRequestDto request)
    {
        var imageUrls = request.ImageUrls
            .Append(request.ImageUrl)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(10)
            .ToList();

        return imageUrls;
    }

    private void AddPropertyImages(int propertyId, CreatePropertyRequestDto request)
    {
        var images = NormalizeImageUrls(request)
            .Select(imageUrl => new PropertyImage
            {
                ImageUrl = imageUrl,
                PropertyId = propertyId
            });

        _context.PropertyImages.AddRange(images);
    }

    private void ReplacePropertyImages(int propertyId, CreatePropertyRequestDto request)
    {
        var existingImages = _context.PropertyImages
            .Where(image => image.PropertyId == propertyId);

        _context.PropertyImages.RemoveRange(existingImages);
        AddPropertyImages(propertyId, request);
    }

    private static string? JoinSelections(List<string>? values)
    {
        if (values == null)
        {
            return null;
        }

        var cleanValues = values
            .Select(value => value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        var result = string.Join(", ", cleanValues);

        return string.IsNullOrWhiteSpace(result) ? null : result;
    }

    private static string? EmptyToNull(string value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static DateTime? ToUtcDate(DateTime? value)
    {
        if (value == null)
        {
            return null;
        }

        return DateTime.SpecifyKind(value.Value.Date, DateTimeKind.Utc);
    }
}
