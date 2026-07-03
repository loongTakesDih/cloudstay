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
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Prevents the "multiple cascade paths" crash during migration
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Guest)
            .WithMany()
            .HasForeignKey(b => b.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Property)
            .WithMany()
            .HasForeignKey(b => b.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Conversation>()
            .HasIndex(conversation => conversation.BookingId)
            .IsUnique()
            .HasFilter("\"BookingId\" IS NOT NULL");

        modelBuilder.Entity<Conversation>()
            .HasIndex(conversation => new { conversation.PropertyId, conversation.GuestId })
            .IsUnique()
            .HasFilter("\"BookingId\" IS NULL");

        modelBuilder.Entity<Conversation>()
            .HasOne(conversation => conversation.Booking)
            .WithOne()
            .HasForeignKey<Conversation>(conversation => conversation.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Conversation>()
            .HasOne(conversation => conversation.Property)
            .WithMany()
            .HasForeignKey(conversation => conversation.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Conversation>()
            .HasOne(conversation => conversation.Guest)
            .WithMany()
            .HasForeignKey(conversation => conversation.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Conversation>()
            .HasOne(conversation => conversation.Host)
            .WithMany()
            .HasForeignKey(conversation => conversation.HostId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ChatMessage>()
            .HasOne(message => message.Conversation)
            .WithMany(conversation => conversation.Messages)
            .HasForeignKey(message => message.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChatMessage>()
            .HasOne(message => message.Sender)
            .WithMany()
            .HasForeignKey(message => message.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ChatMessage>()
            .HasIndex(message => new { message.ConversationId, message.CreatedAt });

        modelBuilder.Entity<Review>()
            .HasIndex(review => review.BookingId)
            .IsUnique();

        modelBuilder.Entity<Review>()
            .HasIndex(review => new { review.PropertyId, review.CreatedAt });

        modelBuilder.Entity<Review>()
            .HasOne(review => review.Booking)
            .WithOne()
            .HasForeignKey<Review>(review => review.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(review => review.Property)
            .WithMany()
            .HasForeignKey(review => review.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Review>()
            .HasOne(review => review.Guest)
            .WithMany()
            .HasForeignKey(review => review.GuestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
