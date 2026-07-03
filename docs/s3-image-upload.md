# S3 Image Upload Setup

CloudStay uses presigned S3 PUT URLs for listing photos. The API signs the upload request, the browser uploads the image directly to S3, and CloudStay stores the final image URL with the listing.

## AWS bucket

1. Create an S3 bucket, for example `cloudstay-property-images`.
2. Use the same AWS region configured in the API, for example `ap-southeast-1`.
3. Add this CORS rule to the bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://cloudstay-lemon.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

4. If you serve images directly from S3, allow public read for the `property-images/*` prefix with a bucket policy like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadPropertyImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cloudstay-property-images/property-images/*"
    }
  ]
}
```

If you use CloudFront instead, keep the bucket private and set `Aws:S3:PublicBaseUrl` to the CloudFront domain.

## API configuration

Set these values in `server/appsettings.json`, user secrets, or your deployment environment:

```json
{
  "Aws": {
    "Region": "ap-southeast-1",
    "S3": {
      "BucketName": "cloudstay-property-images",
      "PropertyImagePrefix": "property-images",
      "PresignedUrlExpiryMinutes": 10,
      "PublicBaseUrl": ""
    }
  }
}
```

The API uses the normal AWS credential chain. Locally, set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, or use an AWS profile. In production, prefer an IAM role.

## Minimum IAM permissions

The API identity only needs permission to create presigned uploads for the configured prefix:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::cloudstay-property-images/property-images/*"
    }
  ]
}
```
