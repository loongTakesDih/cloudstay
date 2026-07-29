namespace server.DTOs.Auth;

public class HostProfileResponseDto
{
    public int UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public bool IsHost { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? HostSince { get; set; }

    public string? ProfilePictureUrl { get; set; }

    public string? AboutMe { get; set; }

    public string? Work { get; set; }

    public string? Languages { get; set; }

    public string? LivesIn { get; set; }

    public List<HostProfileDetailDto> ProfileDetails { get; set; } = [];

    public int HostReviewCount { get; set; }

    public double? AverageHostRating { get; set; }

    public List<HostReviewItemDto> HostReviews { get; set; } = [];

    public List<HostListingItemDto> Listings { get; set; } = [];
}

public class HostProfileDetailDto
{
    public string Label { get; set; } = string.Empty;

    public string Value { get; set; } = string.Empty;
}

public class HostReviewItemDto
{
    public int Id { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? StayDate { get; set; }

    public int GuestId { get; set; }

    public string GuestName { get; set; } = "Guest";

    public string PropertyTitle { get; set; } = "CloudStay property";
}

public class PublicUserProfileResponseDto
{
    public int UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public bool IsHost { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? HostSince { get; set; }

    public string? ProfilePictureUrl { get; set; }

    public string? AboutMe { get; set; }

    public string? Work { get; set; }

    public string? Languages { get; set; }

    public string? LivesIn { get; set; }

    public List<HostProfileDetailDto> ProfileDetails { get; set; } = [];
}

public class HostListingItemDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public decimal PricePerNight { get; set; }

    public bool IsListed { get; set; }

    public bool IsAvailable { get; set; }

    public string? ImageUrl { get; set; }
}
