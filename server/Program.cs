using Amazon;
using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Services;
using server.Hubs;
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
builder.Services.AddScoped<RealtimeNotifier>();
builder.Services.AddSingleton<IAmazonS3>((serviceProvider) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var regionName = configuration["Aws:Region"] ?? "us-east-1";

    return new AmazonS3Client(RegionEndpoint.GetBySystemName(regionName));
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddSignalR();

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
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(accessToken) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs/cloudstay"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDevClient", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://cloudstay.vercel.app"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Keep this commented for now to avoid HTTPS redirect warning during local testing.
// app.UseHttpsRedirection();

app.UseCors("AllowReactDevClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<CloudStayHub>("/hubs/cloudstay");

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        message = "CloudStay API is running"
    });
});

app.Run();
