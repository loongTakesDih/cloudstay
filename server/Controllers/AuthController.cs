using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs.Auth;
using server.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly AppDbContext _context;

    public AuthController(AuthService authService, AppDbContext context)
    {
        _authService = authService;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto request)
    {
        var result = await _authService.RegisterAsync(request);

        if (result == null)
        {
            return BadRequest(new
            {
                message = "Email is already registered."
            });
        }

        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);

        if (result == null)
        {
            return Unauthorized(new
            {
                message = "Invalid email or password."
            });
        }

        return Ok(result);
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin(
        GoogleLoginRequestDto request)
    {
        try
        {
            var result = await _authService.GoogleLoginAsync(request);

            if (result == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid Google sign-in token."
                });
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = ex.Message
            });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponseDto>> Me()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var result = await _authService.GetCurrentUserAsync(userId);

        if (result == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(result);
    }

    [Authorize]
    [HttpPut("me/profile")]
    public async Task<ActionResult<AuthResponseDto>> UpdateProfile(
        UpdateProfileRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var result = await _authService.UpdateProfileAsync(userId, request);

        if (result == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(result);
    }

    [Authorize]
    [HttpGet("me/host-profile")]
    public async Task<ActionResult<HostProfileResponseDto>> GetHostProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var result = await BuildHostProfileAsync(userId, includePrivateListings: true);

        if (result == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(result);
    }

    [HttpGet("hosts/{hostId:int}/profile")]
    public async Task<ActionResult<HostProfileResponseDto>> GetPublicHostProfile(int hostId)
    {
        var result = await BuildHostProfileAsync(hostId, includePrivateListings: false);

        if (result == null)
        {
            return NotFound(new
            {
                message = "Host profile not found."
            });
        }

        return Ok(result);
    }

    [Authorize]
    [HttpGet("users/{userId:int}/profile")]
    public async Task<ActionResult<PublicUserProfileResponseDto>> GetPublicUserProfile(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Where(item => item.Id == userId)
            .Select(item => new
            {
                item.Id,
                item.Username,
                item.IsHost,
                item.CreatedAt,
                item.HostSince,
                item.ProfilePictureUrl,
                item.AboutMe,
                item.Work,
                item.Languages,
                item.LivesIn,
                item.DreamDestination,
                item.UselessSkill,
                item.Pets,
                item.BirthDecade,
                item.School,
                item.SpendTooMuchTime,
                item.FunFact,
                item.FavoriteHighSchoolSong,
                item.BiographyTitle,
                item.ObsessedWith
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(new PublicUserProfileResponseDto
        {
            UserId = user.Id,
            Username = user.Username,
            IsHost = user.IsHost,
            CreatedAt = user.CreatedAt,
            HostSince = user.HostSince,
            ProfilePictureUrl = user.ProfilePictureUrl,
            AboutMe = user.AboutMe,
            Work = user.Work,
            Languages = user.Languages,
            LivesIn = user.LivesIn,
            ProfileDetails = BuildProfileDetails(
                user.DreamDestination,
                user.Work,
                user.UselessSkill,
                user.Pets,
                user.BirthDecade,
                user.School,
                user.SpendTooMuchTime,
                user.FunFact,
                user.FavoriteHighSchoolSong,
                user.BiographyTitle,
                user.ObsessedWith,
                user.Languages,
                user.LivesIn)
        });
    }

    private async Task<HostProfileResponseDto?> BuildHostProfileAsync(
        int hostId,
        bool includePrivateListings)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Where(item => item.Id == hostId)
            .Select(item => new
            {
                item.Id,
                item.Username,
                item.IsHost,
                item.CreatedAt,
                item.HostSince,
                item.ProfilePictureUrl,
                item.AboutMe,
                item.Work,
                item.Languages,
                item.LivesIn,
                item.DreamDestination,
                item.UselessSkill,
                item.Pets,
                item.BirthDecade,
                item.School,
                item.SpendTooMuchTime,
                item.FunFact,
                item.FavoriteHighSchoolSong,
                item.BiographyTitle,
                item.ObsessedWith
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return null;
        }

        if (!user.IsHost)
        {
            return null;
        }

        var hostReviews = await _context.Reviews
            .AsNoTracking()
            .Where(review =>
                review.HostRating != null &&
                review.Property != null &&
                review.Property.HostId == hostId)
            .OrderByDescending(review => review.CreatedAt)
            .Select(review => new HostReviewItemDto
            {
                Id = review.Id,
                Rating = review.HostRating ?? 0,
                Comment = review.HostReviewComment,
                CreatedAt = review.CreatedAt,
                StayDate = review.Booking != null ? review.Booking.CheckOut : null,
                GuestId = review.GuestId,
                GuestName = review.Guest != null ? review.Guest.Username : "Guest",
                PropertyTitle = review.Property != null ? review.Property.Title : "CloudStay property"
            })
            .ToListAsync();

        var listings = await _context.Properties
            .AsNoTracking()
            .Where(property =>
                property.HostId == hostId &&
                (includePrivateListings || property.IsListed))
            .OrderByDescending(property => property.CreatedAt)
            .Select(property => new HostListingItemDto
            {
                Id = property.Id,
                Title = property.Title,
                Location = property.Location,
                PricePerNight = property.PricePerNight,
                IsListed = property.IsListed,
                IsAvailable = property.IsAvailable
            })
            .ToListAsync();

        var listingIds = listings.Select(listing => listing.Id).ToList();
        var imageRows = await _context.PropertyImages
            .AsNoTracking()
            .Where(image => listingIds.Contains(image.PropertyId))
            .OrderBy(image => image.Id)
            .Select(image => new
            {
                image.PropertyId,
                image.ImageUrl
            })
            .ToListAsync();

        var images = imageRows
            .GroupBy(image => image.PropertyId)
            .ToDictionary(
                group => group.Key,
                group => group.Select(image => image.ImageUrl).FirstOrDefault());

        foreach (var listing in listings)
        {
            listing.ImageUrl = images.GetValueOrDefault(listing.Id);
        }

        return new HostProfileResponseDto
        {
            UserId = user.Id,
            Username = user.Username,
            IsHost = user.IsHost,
            CreatedAt = user.CreatedAt,
            HostSince = user.HostSince,
            ProfilePictureUrl = user.ProfilePictureUrl,
            AboutMe = user.AboutMe,
            Work = user.Work,
            Languages = user.Languages,
            LivesIn = user.LivesIn,
            ProfileDetails = BuildProfileDetails(
                user.DreamDestination,
                user.Work,
                user.UselessSkill,
                user.Pets,
                user.BirthDecade,
                user.School,
                user.SpendTooMuchTime,
                user.FunFact,
                user.FavoriteHighSchoolSong,
                user.BiographyTitle,
                user.ObsessedWith,
                user.Languages,
                user.LivesIn),
            HostReviewCount = hostReviews.Count,
            AverageHostRating = hostReviews.Count == 0
                ? null
                : Math.Round(hostReviews.Average(review => review.Rating), 1),
            HostReviews = hostReviews,
            Listings = listings
        };
    }

    private static List<HostProfileDetailDto> BuildProfileDetails(
        string? dreamDestination,
        string? work,
        string? uselessSkill,
        string? pets,
        string? birthDecade,
        string? school,
        string? spendTooMuchTime,
        string? funFact,
        string? favoriteHighSchoolSong,
        string? biographyTitle,
        string? obsessedWith,
        string? languages,
        string? livesIn)
    {
        var values = new List<(string Label, string? Value)>
        {
            ("Where I've always wanted to go", dreamDestination),
            ("My work", work),
            ("My most useless skill", uselessSkill),
            ("Pets", pets),
            ("Decade I was born", birthDecade),
            ("Where I went to school", school),
            ("I spend too much time", spendTooMuchTime),
            ("My fun fact", funFact),
            ("My favorite song in high school", favoriteHighSchoolSong),
            ("My biography title would be", biographyTitle),
            ("I'm obsessed with", obsessedWith),
            ("Languages I speak", languages),
            ("Where I live", livesIn)
        };

        return values
            .Where(item => !string.IsNullOrWhiteSpace(item.Value))
            .Select(item => new HostProfileDetailDto
            {
                Label = item.Label,
                Value = item.Value!.Trim()
            })
            .ToList();
    }

    [Authorize]
    [HttpPost("become-host")]
    public async Task<ActionResult<AuthResponseDto>> BecomeHost()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var result = await _authService.BecomeHostAsync(userId);

        if (result == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(result);
    }

    [Authorize(Roles = "Host")]
    [HttpGet("host-test")]
    public IActionResult HostTest()
    {
        return Ok(new
        {
            message = "Host access granted."
        });
    }

}
