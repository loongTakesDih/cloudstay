using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;
using server.Data;
using server.DTOs.Auth;
using server.Models;

namespace server.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly IConfiguration _configuration;

    public AuthService(
        AppDbContext context,
        TokenService tokenService,
        IConfiguration configuration)
    {
        _context = context;
        _tokenService = tokenService;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterRequestDto request)
    {
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email == request.Email);

        if (emailExists)
        {
            return null;
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "User",
            IsHost = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return null;
        }

        var passwordValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash
        );

        if (!passwordValid)
        {
            return null;
        }

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponseDto?> GoogleLoginAsync(GoogleLoginRequestDto request)
    {
        var clientId = _configuration["Google:ClientId"];

        if (string.IsNullOrWhiteSpace(clientId) ||
            clientId == "PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE")
        {
            throw new InvalidOperationException("Google Client ID is not configured.");
        }

        if (string.IsNullOrWhiteSpace(request.Credential))
        {
            return null;
        }

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.Credential,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [clientId]
                });
        }
        catch (InvalidJwtException)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(payload.Email) ||
            payload.EmailVerified != true)
        {
            return null;
        }

        var normalizedEmail = payload.Email.Trim();
        var user = await _context.Users
            .FirstOrDefaultAsync(currentUser =>
                currentUser.GoogleSubjectId == payload.Subject ||
                currentUser.Email == normalizedEmail);

        if (user == null)
        {
            user = new User
            {
                Username = BuildGoogleUsername(payload),
                Email = normalizedEmail,
                PasswordHash = string.Empty,
                AuthProvider = "Google",
                GoogleSubjectId = payload.Subject,
                EmailVerified = true,
                ProfilePictureUrl = payload.Picture,
                Role = "User",
                IsHost = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
        }
        else
        {
            user.GoogleSubjectId ??= payload.Subject;
            user.AuthProvider = user.AuthProvider == "Password"
                ? "Password,Google"
                : "Google";
            user.EmailVerified = true;
            user.ProfilePictureUrl = payload.Picture;

            if (string.IsNullOrWhiteSpace(user.Username))
            {
                user.Username = BuildGoogleUsername(payload);
            }
        }

        await _context.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponseDto?> BecomeHostAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return null;
        }

        user.IsHost = true;
        await _context.SaveChangesAsync();

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponseDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return null;
        }

        return CreateAuthResponse(user);
    }

    private AuthResponseDto CreateAuthResponse(User user)
    {
        return new AuthResponseDto
        {
            Token = _tokenService.CreateToken(user),
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
            IsHost = user.IsHost,
            CreatedAt = user.CreatedAt
        };
    }

    private static string BuildGoogleUsername(GoogleJsonWebSignature.Payload payload)
    {
        if (!string.IsNullOrWhiteSpace(payload.Name))
        {
            return payload.Name.Trim();
        }

        var emailPrefix = payload.Email?.Split('@')[0];

        return string.IsNullOrWhiteSpace(emailPrefix)
            ? "Google User"
            : emailPrefix;
    }
}
