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

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<PropertyResponseDto>> CreateProperty(
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

        var host = await _context.Users.FindAsync(userId);

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

        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Description) ||
            string.IsNullOrWhiteSpace(request.Location) ||
            request.PricePerNight <= 0)
        {
            return BadRequest(new
            {
                message = "Title, description, location, and a valid price are required."
            });
        }

        var property = new Property
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            PricePerNight = request.PricePerNight,
            Location = request.Location.Trim(),
            HostId = userId
        };

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            _context.PropertyImages.Add(new PropertyImage
            {
                ImageUrl = request.ImageUrl,
                PropertyId = property.Id
            });

            await _context.SaveChangesAsync();
        }

        return Created($"/api/properties/{property.Id}",
            new PropertyResponseDto
            {
                Id = property.Id,
                Title = property.Title,
                Description = property.Description,
                PricePerNight = property.PricePerNight,
                Location = property.Location,
                HostId = property.HostId,
                ImageUrl = request.ImageUrl
            });
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<PropertyResponseDto>>> GetMyProperties()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        var properties = await _context.Properties
            .Where(property => property.HostId == userId)
            .Select(property => new PropertyResponseDto
            {
                Id = property.Id,
                Title = property.Title,
                Description = property.Description,
                PricePerNight = property.PricePerNight,
                Location = property.Location,
                HostId = property.HostId,
                ImageUrl = _context.PropertyImages
                    .Where(image => image.PropertyId == property.Id)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Ok(properties);
    }
}
