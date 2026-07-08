using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260708000000_AddPerformanceIndexes")]
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Bookings_GuestId_CreatedAt",
                table: "Bookings",
                columns: new[] { "GuestId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_PropertyId_Status_CheckIn_CheckOut",
                table: "Bookings",
                columns: new[] { "PropertyId", "Status", "CheckIn", "CheckOut" });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ConversationId_ReadAt_SenderId",
                table: "ChatMessages",
                columns: new[] { "ConversationId", "ReadAt", "SenderId" },
                filter: "\"ReadAt\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_GuestId_UpdatedAt",
                table: "Conversations",
                columns: new[] { "GuestId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_HostId_UpdatedAt",
                table: "Conversations",
                columns: new[] { "HostId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_IsListed_IsAvailable_AvailableTo_CreatedAt",
                table: "Properties",
                columns: new[] { "IsListed", "IsAvailable", "AvailableTo", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_GuestId_CreatedAt",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_PropertyId_Status_CheckIn_CheckOut",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_ChatMessages_ConversationId_ReadAt_SenderId",
                table: "ChatMessages");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_GuestId_UpdatedAt",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_HostId_UpdatedAt",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Properties_IsListed_IsAvailable_AvailableTo_CreatedAt",
                table: "Properties");
        }
    }
}
