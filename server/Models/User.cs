namespace server.Models;

public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string AuthProvider { get; set; } = "Password";

    public string? GoogleSubjectId { get; set; }

    public bool EmailVerified { get; set; } = false;

    public string? ProfilePictureUrl { get; set; }

    public string Role { get; set; } = "User";

    public bool IsHost { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
