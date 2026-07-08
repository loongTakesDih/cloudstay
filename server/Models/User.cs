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

    public string? DreamDestination { get; set; }

    public string? Work { get; set; }

    public string? UselessSkill { get; set; }

    public string? Pets { get; set; }

    public string? BirthDecade { get; set; }

    public string? School { get; set; }

    public string? SpendTooMuchTime { get; set; }

    public string? FunFact { get; set; }

    public string? FavoriteHighSchoolSong { get; set; }

    public string? BiographyTitle { get; set; }

    public string? ObsessedWith { get; set; }

    public string? Languages { get; set; }

    public string? LivesIn { get; set; }

    public string? AboutMe { get; set; }

    public string? Interests { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
