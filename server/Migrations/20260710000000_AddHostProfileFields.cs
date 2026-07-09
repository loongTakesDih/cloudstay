using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260710000000_AddHostProfileFields")]
    public partial class AddHostProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "HostSince",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HostRating",
                table: "Reviews",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HostReviewComment",
                table: "Reviews",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HostSince",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "HostRating",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "HostReviewComment",
                table: "Reviews");
        }
    }
}
