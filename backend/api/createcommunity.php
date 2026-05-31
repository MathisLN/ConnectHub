<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config/database.php");
require_once("../config/community_schema.php");

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->name) ||
    !isset($data->description) ||
    !isset($data->creator_id)
) {
    echo json_encode(["success" => false]);
    exit;
}

$name = trim($data->name);
$description = trim($data->description);

if (strlen($name) < 3 || strlen($name) > 100) {
    echo json_encode([
        "success" => false,
        "message" => "Community name must be between 3 and 100 characters"
    ]);
    exit;
}

if (strlen($description) > 500) {
    echo json_encode([
        "success" => false,
        "message" => "Community description is too long"
    ]);
    exit;
}

$database = new Database();
$conn = $database->connect();
ensureCommunitySchema($conn);

$duplicateStmt = $conn->prepare("
    SELECT id
    FROM communities
    WHERE LOWER(name) = LOWER(:name)
    LIMIT 1
");

$duplicateStmt->execute([":name" => $name]);

if ($duplicateStmt->fetch()) {
    echo json_encode([
        "success" => false,
        "message" => "A community with this name already exists"
    ]);
    exit;
}

$query = "INSERT INTO communities (name, description, creator_id) 
          VALUES (:name, :description, :creator_id)";

$stmt = $conn->prepare($query);

$stmt->bindParam(":name", $name);
$stmt->bindParam(":description", $description);
$stmt->bindParam(":creator_id", $data->creator_id);

$stmt->execute();
$communityId = $conn->lastInsertId();

$memberQuery = "INSERT IGNORE INTO community_members (user_id, community_id) 
                VALUES (:user_id, :community_id)";
$memberStmt = $conn->prepare($memberQuery);
$memberStmt->bindParam(":user_id", $data->creator_id);
$memberStmt->bindParam(":community_id", $communityId);
$memberStmt->execute();

echo json_encode([
    "success" => true,
    "community_id" => $communityId
]);
