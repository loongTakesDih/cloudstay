using Amazon.S3;
using Amazon.S3.Model;
using server.DTOs.Uploads;

namespace server.Services;

public class S3ImageUploadService
{
    private static readonly Dictionary<string, string> SupportedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/gif"] = ".gif"
    };

    private readonly IAmazonS3 _s3Client;
    private readonly IConfiguration _configuration;

    public S3ImageUploadService(IAmazonS3 s3Client, IConfiguration configuration)
    {
        _s3Client = s3Client;
        _configuration = configuration;
    }

    public CreateImageUploadUrlResponseDto CreatePropertyImageUploadUrl(
        int userId,
        string fileName,
        string contentType)
    {
        if (!SupportedContentTypes.TryGetValue(contentType, out var extension))
        {
            throw new ArgumentException("Only JPEG, PNG, WebP, and GIF images can be uploaded.");
        }

        var bucketName = _configuration["Aws:S3:BucketName"];

        if (string.IsNullOrWhiteSpace(bucketName))
        {
            throw new InvalidOperationException("S3 bucket name is not configured.");
        }

        var configuredPrefix = _configuration["Aws:S3:PropertyImagePrefix"];
        var prefix = string.IsNullOrWhiteSpace(configuredPrefix)
            ? "property-images"
            : configuredPrefix.Trim().Trim('/');
        var objectKey = $"{prefix}/{userId}/{Guid.NewGuid():N}{extension}";
        var expiresInMinutes = GetPresignedUrlExpiryMinutes();

        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = objectKey,
            Verb = HttpVerb.PUT,
            ContentType = contentType,
            Expires = DateTime.UtcNow.AddMinutes(expiresInMinutes)
        };

        var uploadUrl = _s3Client.GetPreSignedURL(request);

        return new CreateImageUploadUrlResponseDto
        {
            UploadUrl = uploadUrl,
            ImageUrl = BuildPublicImageUrl(bucketName, objectKey),
            ObjectKey = objectKey
        };
    }

    private int GetPresignedUrlExpiryMinutes()
    {
        var configuredExpiry = _configuration.GetValue<int?>("Aws:S3:PresignedUrlExpiryMinutes");

        return configuredExpiry is > 0 and <= 60 ? configuredExpiry.Value : 10;
    }

    private string BuildPublicImageUrl(string bucketName, string objectKey)
    {
        var publicBaseUrl = _configuration["Aws:S3:PublicBaseUrl"];

        if (!string.IsNullOrWhiteSpace(publicBaseUrl))
        {
            return $"{publicBaseUrl.TrimEnd('/')}/{objectKey}";
        }

        var region = _configuration["Aws:Region"];

        if (string.IsNullOrWhiteSpace(region))
        {
            throw new InvalidOperationException("AWS region is not configured.");
        }

        return $"https://{bucketName}.s3.{region}.amazonaws.com/{objectKey}";
    }
}
