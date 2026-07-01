using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Data;
using server.DTOs.Auth;
using server.DTOs.Host;
using server.DTOs.Properties;
using server.Models;
using server.Services;
using System.Security.Claims;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HostController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;

    public HostController(AppDbContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [Authorize]
    [HttpPost("onboarding")]
    public async Task<ActionResult<HostOnboardingResponseDto>> CompleteOnboarding(
        CreatePropertyRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var validationError = PropertiesController.ValidateFullListing(request);

        if (validationError != null)
        {
            return BadRequest(new
            {
                message = validationError
            });
        }

        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var property = PropertiesController.BuildProperty(
            request,
            userId,
            isListed: false);

        property.IsAvailable = true;
        user.IsHost = true;

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        var imageUrls = PropertiesController.NormalizeImageUrls(request);

        if (imageUrls.Count > 0)
        {
            _context.PropertyImages.AddRange(imageUrls.Select(imageUrl => new PropertyImage
            {
                ImageUrl = imageUrl,
                PropertyId = property.Id
            }));

            await _context.SaveChangesAsync();
        }

        await transaction.CommitAsync();

        return Ok(new HostOnboardingResponseDto
        {
            User = new AuthResponseDto
            {
                Token = _tokenService.CreateToken(user),
                UserId = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                IsHost = user.IsHost
            },
            Listing = PropertiesController.MapProperty(
                property,
                imageUrls)
        });
    }
}
