using Amazon;
using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<StripeSettings>(
    builder.Configuration.GetSection("Stripe")
);

builder.Services.AddScoped<StripePaymentService>();

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<S3ImageUploadService>();
builder.Services.AddSingleton<IAmazonS3>((serviceProvider) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var regionName = configuration["Aws:Region"] ?? "us-east-1";

    return new AmazonS3Client(RegionEndpoint.GetBySystemName(regionName));
});

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));


var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrEmpty(jwtKey))
{
    throw new Exception("JWT Key is missing.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDevClient", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://cloudstay-lemon.vercel.app"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Keep this commented for now to avoid HTTPS redirect warning during local testing.
// app.UseHttpsRedirection();

app.UseCors("AllowReactDevClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        message = "CloudStay API is running"
    });
});

app.Run();
