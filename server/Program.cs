using Microsoft.EntityFrameworkCore;
using server.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDevClient", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Keep this commented for now to avoid HTTPS redirect warning during local testing.
// app.UseHttpsRedirection();

app.UseCors("AllowReactDevClient");

app.MapControllers();

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        message = "CloudStay API is running"
    });
});

app.Run();