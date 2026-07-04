using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddStripePaymentFieldsToBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Bookings",
                type: "text",
                nullable: false,
                defaultValue: "Unpaid");

            migrationBuilder.AddColumn<string>(
                name: "StripePaymentIntentId",
                table: "Bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeSessionId",
                table: "Bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "StripePaymentIntentId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "StripeSessionId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Bookings");
        }
    }
}
