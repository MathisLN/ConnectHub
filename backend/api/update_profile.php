<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once("../config/database.php");
require_once("../config/profile_schema.php");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->user_id)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing user id"
    ]);
    exit;
}

$bio = trim($data->bio ?? "");
$profilePicture = trim($data->profile_picture ?? "");

$database = new Database();
$conn = $database->connect();
ensureProfileSchema($conn);

$stmt = $conn->prepare("
UPDATE users
SET
    bio = :bio,
    profile_picture = :profile_picture
WHERE id = :id
");

$stmt->execute([
    ":bio" => $bio,
    ":profile_picture" => $profilePicture,
    ":id" => $data->user_id
]);

$stmt = $conn->prepare("
SELECT
    id,
    first_name,
    last_name,
    username,
    email,
    bio,
    profile_picture,
    role
FROM users
WHERE id = :id
LIMIT 1
");

$stmt->execute([":id" => $data->user_id]);

echo json_encode([
    "success" => true,
    "user" => $stmt->fetch(PDO::FETCH_ASSOC)
]);
