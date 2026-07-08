using Microsoft.AspNetCore.Mvc;
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

    public AuthController(AuthService authService)
    {
        _authService = authService;
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

        return Ok(new
        {
            result.UserId,
            result.Username,
            result.Email,
            result.Role,
            result.IsHost,
            result.CreatedAt
        });
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
