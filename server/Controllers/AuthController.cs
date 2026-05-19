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

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var isHost = bool.TryParse(User.FindFirst("isHost")?.Value, out var parsedIsHost)
            && parsedIsHost;

        return Ok(new
        {
            userId = int.TryParse(userIdClaim, out var userId) ? userId : 0,
            username,
            email,
            role,
            isHost
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

    [Authorize(Roles = "Admin")]
    [HttpGet("admin-test")]
    public IActionResult AdminTest()
    {
        return Ok(new
        {
            message = "Admin access granted."
        });
    }
}
