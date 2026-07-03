using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs.Properties;
using server.Models;
using System.Security.Claims;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PropertiesController : ControllerBase
{
    private readonly AppDbContext _context;

    public PropertiesController(AppDbContext context)
    {
        _context = context;
    }
    
    [HttpGet]
        public async Task<ActionResult<IEnumerable<PropertyResponseDto>>> GetPublicProperties()
        {
            var properties = await _context.Properties
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

        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            _context.PropertyImages.Add(new PropertyImage
            {
                ImageUrl = request.ImageUrl.Trim(),
                PropertyId = property.Id
            });

            await _context.SaveChangesAsync();
        }

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
        await _context.SaveChangesAsync();

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

        property.IsListed = isListed;
        property.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

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
        var imageUrl = await _context.PropertyImages
            .Where(image => image.PropertyId == property.Id)
            .Select(image => image.ImageUrl)
            .FirstOrDefaultAsync();

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

        return MapProperty(property, imageUrl, host, currentUserId);
    }

    private async Task<List<PropertyResponseDto>> MapPropertiesAsync(
        List<Property> properties,
        int? currentUserId = null)
    {
        var propertyIds = properties.Select(property => property.Id).ToList();
        var hostIds = properties.Select(property => property.HostId).Distinct().ToList();
        var images = await _context.PropertyImages
            .Where(image => propertyIds.Contains(image.PropertyId))
            .GroupBy(image => image.PropertyId)
            .Select(group => new
            {
                PropertyId = group.Key,
                ImageUrl = group.Select(image => image.ImageUrl).FirstOrDefault()
            })
            .ToDictionaryAsync(image => image.PropertyId, image => image.ImageUrl);

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
                images.TryGetValue(property.Id, out var imageUrl);
                hosts.TryGetValue(property.HostId, out var host);
                return MapProperty(property, imageUrl, host, currentUserId);
            })
            .ToList();
    }

internal static PropertyResponseDto MapProperty(
        Property property,
        string? imageUrl = null,
        PropertyHostSummaryDto? host = null,
        int? currentUserId = null)
    {
        // 1. Calculate the values first
        var createdAt = property.CreatedAt ?? DateTime.UtcNow;
        var updatedAt = property.UpdatedAt ?? DateTime.UtcNow;

        // 2. Then create the object
        return new PropertyResponseDto
        {
            Id = property.Id,
            Title = property.Title,
            Description = property.Description,
            PricePerNight = property.PricePerNight,
            Location = property.Location,
            HostId = property.HostId,
            ImageUrl = imageUrl,
            PropertyCategory = property.PropertyCategory,
            PlaceType = property.PlaceType,
            Address = property.Address,
            Latitude = property.Latitude,
            Longitude = property.Longitude,
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
            CreatedAt = createdAt, // Use the calculated value
            UpdatedAt = updatedAt, // Use the calculated value
            IsOwner = currentUserId != null && property.HostId == currentUserId.Value,
            Host = host
        };
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
