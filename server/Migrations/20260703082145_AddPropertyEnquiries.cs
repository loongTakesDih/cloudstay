using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyEnquiries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Conversations_BookingId",
                table: "Conversations");

            migrationBuilder.AlterColumn<int>(
                name: "BookingId",
                table: "Conversations",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "PropertyId",
                table: "Conversations",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "Conversations" AS conversation
                SET "PropertyId" = booking."PropertyId"
                FROM "Bookings" AS booking
                WHERE conversation."BookingId" = booking."Id";
                """);

            migrationBuilder.AlterColumn<int>(
                name: "PropertyId",
                table: "Conversations",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_BookingId",
                table: "Conversations",
                column: "BookingId",
                unique: true,
                filter: "\"BookingId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_PropertyId_GuestId",
                table: "Conversations",
                columns: new[] { "PropertyId", "GuestId" },
                unique: true,
                filter: "\"BookingId\" IS NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Conversations_Properties_PropertyId",
                table: "Conversations",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Conversations_Properties_PropertyId",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_BookingId",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_PropertyId_GuestId",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "PropertyId",
                table: "Conversations");

            migrationBuilder.AlterColumn<int>(
                name: "BookingId",
                table: "Conversations",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_BookingId",
                table: "Conversations",
                column: "BookingId",
                unique: true);
        }
    }
}
