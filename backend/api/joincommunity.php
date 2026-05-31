<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config/database.php");
require_once("../config/community_schema.php");

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->user_id) ||
    !isset($data->community_id)
) {
    echo json_encode([
        "success" => false,
        "message" => "Missing user or community"
    ]);
    exit;
}

$database = new Database();
$conn = $database->connect();
ensureCommunitySchema($conn);

$communityStmt = $conn->prepare("
    SELECT id
    FROM communities
    WHERE id = :community_id
    LIMIT 1
");

$communityStmt->execute([":community_id" => $data->community_id]);

if (!$communityStmt->fetch()) {
    echo json_encode([
        "success" => false,
        "message" => "Community not found"
    ]);
    exit;
}

if (isCommunityMember($conn, $data->user_id, $data->community_id)) {
    echo json_encode([
        "success" => true,
        "joined" => true,
        "message" => "Already a member"
    ]);
    exit;
}

$query = "INSERT IGNORE INTO community_members (user_id, community_id) 
          VALUES (:user_id, :community_id)";

$stmt = $conn->prepare($query);

$stmt->bindParam(":user_id", $data->user_id);
$stmt->bindParam(":community_id", $data->community_id);

$stmt->execute();

echo json_encode([
    "success" => true,
    "joined" => true,
    "message" => "Community joined"
]);
