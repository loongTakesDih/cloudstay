using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260709000000_AddThingsToKnowAndUserProfileFields")]
    public partial class AddThingsToKnowAndUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "HouseRulesCheckInTime", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "HouseRulesCheckoutTime", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<bool>(name: "HouseRulesPetsAllowed", table: "Properties", type: "boolean", nullable: true);
            migrationBuilder.AddColumn<bool>(name: "HouseRulesSmokingAllowed", table: "Properties", type: "boolean", nullable: true);
            migrationBuilder.AddColumn<bool>(name: "HouseRulesPartiesAllowed", table: "Properties", type: "boolean", nullable: true);
            migrationBuilder.AddColumn<string>(name: "HouseRulesQuietHours", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "HouseRulesNotes", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<bool>(name: "SafetySmokeAlarm", table: "Properties", type: "boolean", nullable: true);
            migrationBuilder.AddColumn<bool>(name: "SafetyCarbonMonoxideAlarm", table: "Properties", type: "boolean", nullable: true);
            migrationBuilder.AddColumn<bool>(name: "SafetySecurityCameras", table: "Properties", type: "boolean", nullable: true);
            migrationBuilder.AddColumn<string>(name: "SafetyPropertyWarnings", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "SafetyNotes", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "CancellationPolicyType", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "CancellationFreeCancellationPeriod", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "CancellationPartialRefundRule", table: "Properties", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "CancellationNotes", table: "Properties", type: "text", nullable: true);

            migrationBuilder.AddColumn<string>(name: "AboutMe", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "BiographyTitle", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "BirthDecade", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "DreamDestination", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FavoriteHighSchoolSong", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "FunFact", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Interests", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Languages", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "LivesIn", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "ObsessedWith", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Pets", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "School", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "SpendTooMuchTime", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "UselessSkill", table: "Users", type: "text", nullable: true);
            migrationBuilder.AddColumn<string>(name: "Work", table: "Users", type: "text", nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "HouseRulesCheckInTime", table: "Properties");
            migrationBuilder.DropColumn(name: "HouseRulesCheckoutTime", table: "Properties");
            migrationBuilder.DropColumn(name: "HouseRulesPetsAllowed", table: "Properties");
            migrationBuilder.DropColumn(name: "HouseRulesSmokingAllowed", table: "Properties");
            migrationBuilder.DropColumn(name: "HouseRulesPartiesAllowed", table: "Properties");
            migrationBuilder.DropColumn(name: "HouseRulesQuietHours", table: "Properties");
            migrationBuilder.DropColumn(name: "HouseRulesNotes", table: "Properties");
            migrationBuilder.DropColumn(name: "SafetySmokeAlarm", table: "Properties");
            migrationBuilder.DropColumn(name: "SafetyCarbonMonoxideAlarm", table: "Properties");
            migrationBuilder.DropColumn(name: "SafetySecurityCameras", table: "Properties");
            migrationBuilder.DropColumn(name: "SafetyPropertyWarnings", table: "Properties");
            migrationBuilder.DropColumn(name: "SafetyNotes", table: "Properties");
            migrationBuilder.DropColumn(name: "CancellationPolicyType", table: "Properties");
            migrationBuilder.DropColumn(name: "CancellationFreeCancellationPeriod", table: "Properties");
            migrationBuilder.DropColumn(name: "CancellationPartialRefundRule", table: "Properties");
            migrationBuilder.DropColumn(name: "CancellationNotes", table: "Properties");

            migrationBuilder.DropColumn(name: "AboutMe", table: "Users");
            migrationBuilder.DropColumn(name: "BiographyTitle", table: "Users");
            migrationBuilder.DropColumn(name: "BirthDecade", table: "Users");
            migrationBuilder.DropColumn(name: "DreamDestination", table: "Users");
            migrationBuilder.DropColumn(name: "FavoriteHighSchoolSong", table: "Users");
            migrationBuilder.DropColumn(name: "FunFact", table: "Users");
            migrationBuilder.DropColumn(name: "Interests", table: "Users");
            migrationBuilder.DropColumn(name: "Languages", table: "Users");
            migrationBuilder.DropColumn(name: "LivesIn", table: "Users");
            migrationBuilder.DropColumn(name: "ObsessedWith", table: "Users");
            migrationBuilder.DropColumn(name: "Pets", table: "Users");
            migrationBuilder.DropColumn(name: "School", table: "Users");
            migrationBuilder.DropColumn(name: "SpendTooMuchTime", table: "Users");
            migrationBuilder.DropColumn(name: "UselessSkill", table: "Users");
            migrationBuilder.DropColumn(name: "Work", table: "Users");
        }
    }
}
