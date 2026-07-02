using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class BackfillLegacyCompletedBookings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "Bookings"
                SET "Status" = 'Completed'
                WHERE LOWER("Status") = 'accepted'
                  AND "CheckOut" < TIMESTAMPTZ '2026-07-02 00:00:00+00';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // This data correction is intentionally irreversible because completed
            // legacy stays must not become active reservations again.
        }
    }
}
