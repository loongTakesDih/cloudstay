using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260705000000_AddGoogleAuthToUsers")]
    public partial class AddGoogleAuthToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AuthProvider",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "Password");

            migrationBuilder.AddColumn<bool>(
                name: "EmailVerified",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "GoogleSubjectId",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfilePictureUrl",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_GoogleSubjectId",
                table: "Users",
                column: "GoogleSubjectId",
                unique: true,
                filter: "\"GoogleSubjectId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_GoogleSubjectId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AuthProvider",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailVerified",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "GoogleSubjectId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ProfilePictureUrl",
                table: "Users");
        }
    }
}
