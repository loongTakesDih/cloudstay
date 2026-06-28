using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Remove old User Foreign Key constraints
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Users_UserId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_UserId",
                table: "Bookings");

            // 2. Rename existing columns cleanly
            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Bookings",
                newName: "GuestId");

            migrationBuilder.RenameColumn(
                name: "CheckInDate",
                table: "Bookings",
                newName: "CheckIn");

            migrationBuilder.RenameColumn(
                name: "CheckOutDate",
                table: "Bookings",
                newName: "CheckOut");

            // 3. Add the missing columns
            migrationBuilder.AddColumn<decimal>(
                name: "TotalPrice",
                table: "Bookings",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalPrice",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "GuestId",
                table: "Bookings",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "CheckIn",
                table: "Bookings",
                newName: "CheckInDate");

            migrationBuilder.RenameColumn(
                name: "CheckOut",
                table: "Bookings",
                newName: "CheckOutDate");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserId",
                table: "Bookings",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Users_UserId",
                table: "Bookings",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
