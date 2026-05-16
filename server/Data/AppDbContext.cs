using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Property> Properties => Set<Property>();

    public DbSet<Booking> Bookings => Set<Booking>();

    public DbSet<PropertyImage> PropertyImages => Set<PropertyImage>();
}