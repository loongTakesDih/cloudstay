using server.DTOs.Auth;
using server.DTOs.Properties;

namespace server.DTOs.Host;

public class HostOnboardingResponseDto
{
    public AuthResponseDto User { get; set; } = new();

    public PropertyResponseDto Listing { get; set; } = new();
}
