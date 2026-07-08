namespace server.DTOs.Auth;

public class UpdateProfileRequestDto
{
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

    public List<string>? Interests { get; set; }
}
