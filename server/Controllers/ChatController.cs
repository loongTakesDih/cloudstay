using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs.Chat;
using server.Models;

namespace server.Controllers;

[Authorize]
[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;

    public ChatController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("conversations")]
    public async Task<ActionResult> GetConversations()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var conversations = await _context.Conversations
            .Where(conversation => conversation.GuestId == userId || conversation.HostId == userId)
            .OrderByDescending(conversation => conversation.UpdatedAt)
            .Select(conversation => new
            {
                conversation.Id,
                conversation.BookingId,
                conversation.PropertyId,
                conversation.UpdatedAt,
                CurrentUserIsHost = conversation.HostId == userId,
                BookingStatus = conversation.Booking != null ? conversation.Booking.Status : "Enquiry",
                CheckIn = conversation.Booking != null ? conversation.Booking.CheckIn : (DateTime?)null,
                CheckOut = conversation.Booking != null ? conversation.Booking.CheckOut : (DateTime?)null,
                Property = conversation.Property != null
                    ? new
                    {
                        conversation.Property.Id,
                        conversation.Property.Title,
                        conversation.Property.Location
                    }
                    : null,
                OtherUser = conversation.GuestId == userId
                    ? conversation.Host == null
                        ? null
                        : new { conversation.Host.Id, conversation.Host.Username }
                    : conversation.Guest == null
                        ? null
                        : new { conversation.Guest.Id, conversation.Guest.Username },
                LastMessage = conversation.Messages
                    .OrderByDescending(message => message.CreatedAt)
                    .Select(message => new
                    {
                        message.Id,
                        message.Body,
                        message.SenderId,
                        message.CreatedAt
                    })
                    .FirstOrDefault(),
                UnreadCount = conversation.Messages.Count(message =>
                    message.SenderId != userId && message.ReadAt == null)
            })
            .ToListAsync();

        return Ok(conversations);
    }

    [HttpPost("conversations")]
    public async Task<ActionResult> CreateOrGetConversation(CreateConversationDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        if (request.BookingId.HasValue == request.PropertyId.HasValue)
        {
            return BadRequest(new
            {
                message = "Provide either a booking ID or a property ID."
            });
        }

        int? bookingId = null;
        int propertyId;
        int guestId;
        int hostId;

        if (request.BookingId.HasValue)
        {
            var booking = await _context.Bookings
                .Where(item => item.Id == request.BookingId.Value)
                .Select(item => new
                {
                    item.Id,
                    item.PropertyId,
                    item.GuestId,
                    HostId = item.Property != null ? item.Property.HostId : (int?)null
                })
                .FirstOrDefaultAsync();

            if (booking == null)
            {
                return NotFound(new { message = "Booking not found." });
            }

            if (booking.HostId == null)
            {
                return BadRequest(new { message = "This booking does not have a host." });
            }

            if (booking.GuestId != userId && booking.HostId != userId)
            {
                return Forbid();
            }

            bookingId = booking.Id;
            propertyId = booking.PropertyId;
            guestId = booking.GuestId;
            hostId = booking.HostId.Value;
        }
        else
        {
            var property = await _context.Properties
                .Where(item => item.Id == request.PropertyId!.Value)
                .Select(item => new { item.Id, item.HostId })
                .FirstOrDefaultAsync();

            if (property == null)
            {
                return NotFound(new { message = "Listing not found." });
            }

            if (property.HostId == userId)
            {
                return BadRequest(new { message = "You cannot message yourself about your own listing." });
            }

            propertyId = property.Id;
            guestId = userId;
            hostId = property.HostId;
        }

        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(item =>
                bookingId.HasValue
                    ? item.BookingId == bookingId.Value
                    : item.BookingId == null &&
                      item.PropertyId == propertyId &&
                      item.GuestId == guestId);

        if (conversation == null)
        {
            conversation = new Conversation
            {
                BookingId = bookingId,
                PropertyId = propertyId,
                GuestId = guestId,
                HostId = hostId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Conversations.Add(conversation);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                _context.Entry(conversation).State = EntityState.Detached;
                conversation = await _context.Conversations
                    .FirstOrDefaultAsync(item =>
                        bookingId.HasValue
                            ? item.BookingId == bookingId.Value
                            : item.BookingId == null &&
                              item.PropertyId == propertyId &&
                              item.GuestId == guestId);

                if (conversation == null)
                {
                    throw;
                }
            }
        }

        return Ok(new
        {
            conversation.Id,
            conversation.BookingId,
            conversation.PropertyId
        });
    }

    [HttpGet("conversations/{conversationId:int}/messages")]
    public async Task<ActionResult> GetMessages(int conversationId)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var conversation = await GetAuthorizedConversation(conversationId, userId);
        if (conversation == null)
        {
            return NotFound(new { message = "Conversation not found." });
        }

        var unreadMessages = await _context.ChatMessages
            .Where(message =>
                message.ConversationId == conversationId &&
                message.SenderId != userId &&
                message.ReadAt == null)
            .ToListAsync();

        if (unreadMessages.Count > 0)
        {
            var readAt = DateTime.UtcNow;
            foreach (var message in unreadMessages)
            {
                message.ReadAt = readAt;
            }

            await _context.SaveChangesAsync();
        }

        var messages = await _context.ChatMessages
            .Where(message => message.ConversationId == conversationId)
            .OrderBy(message => message.CreatedAt)
            .Select(message => new
            {
                message.Id,
                message.Body,
                message.SenderId,
                SenderName = message.Sender != null ? message.Sender.Username : string.Empty,
                message.CreatedAt,
                message.ReadAt,
                IsMine = message.SenderId == userId
            })
            .ToListAsync();

        return Ok(messages);
    }

    [HttpPost("conversations/{conversationId:int}/messages")]
    public async Task<ActionResult> SendMessage(int conversationId, SendMessageDto request)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user session." });
        }

        var conversation = await GetAuthorizedConversation(conversationId, userId);
        if (conversation == null)
        {
            return NotFound(new { message = "Conversation not found." });
        }

        var body = request.Body.Trim();
        if (string.IsNullOrWhiteSpace(body))
        {
            return BadRequest(new { message = "Message cannot be empty." });
        }

        var message = new ChatMessage
        {
            ConversationId = conversationId,
            SenderId = userId,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };

        conversation.UpdatedAt = message.CreatedAt;
        _context.ChatMessages.Add(message);
        await _context.SaveChangesAsync();

        var senderName = await _context.Users
            .Where(user => user.Id == userId)
            .Select(user => user.Username)
            .FirstOrDefaultAsync() ?? string.Empty;

        return Ok(new
        {
            message.Id,
            message.Body,
            message.SenderId,
            SenderName = senderName,
            message.CreatedAt,
            message.ReadAt,
            IsMine = true
        });
    }

    private bool TryGetUserId(out int userId)
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(value, out userId);
    }

    private Task<Conversation?> GetAuthorizedConversation(int conversationId, int userId)
    {
        return _context.Conversations.FirstOrDefaultAsync(conversation =>
            conversation.Id == conversationId &&
            (conversation.GuestId == userId || conversation.HostId == userId));
    }
}
