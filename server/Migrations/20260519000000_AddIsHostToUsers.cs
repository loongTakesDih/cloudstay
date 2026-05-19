using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddIsHostToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsHost",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "IsHost" = TRUE
                WHERE "Role" = 'Host';
                """);

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "Role" = 'User'
                WHERE "Role" IN ('Guest', 'Host');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "Role" = 'Host'
                WHERE "Role" = 'User' AND "IsHost" = TRUE;
                """);

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "Role" = 'Guest'
                WHERE "Role" = 'User';
                """);

            migrationBuilder.DropColumn(
                name: "IsHost",
                table: "Users");
        }
    }
}
