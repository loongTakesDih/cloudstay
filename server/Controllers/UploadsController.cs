using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs.Uploads;
using server.Services;
using System.Security.Claims;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly S3ImageUploadService _imageUploadService;

    public UploadsController(S3ImageUploadService imageUploadService)
    {
        _imageUploadService = imageUploadService;
    }

    [HttpPost("property-image-url")]
    public ActionResult<CreateImageUploadUrlResponseDto> CreatePropertyImageUploadUrl(
        CreateImageUploadUrlRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user session."
            });
        }

        try
        {
            return Ok(_imageUploadService.CreatePropertyImageUploadUrl(
                userId,
                request.FileName,
                request.ContentType));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                message = ex.Message
            });
        }
    }
}
