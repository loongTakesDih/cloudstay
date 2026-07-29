using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260729000000_BackfillHostSince")]
    public partial class BackfillHostSince : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The HostSince column was added (20260710000000_AddHostProfileFields)
            // as nullable with no backfill, so every account that became a host
            // before that migration has HostSince = NULL and shows no host duration.
            // Backfill it from the host's earliest listing (the best signal of when
            // they actually started hosting), falling back to their registration date.
            migrationBuilder.Sql(
                """
                UPDATE "Users" u
                SET "HostSince" = COALESCE(
                    (SELECT MIN(p."CreatedAt") FROM "Properties" p WHERE p."HostId" = u."Id"),
                    u."CreatedAt"
                )
                WHERE u."IsHost" = true
                  AND u."HostSince" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally irreversible: the original NULLs carried no information,
            // so there is nothing meaningful to restore.
        }
    }
}
