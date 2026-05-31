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

if (
    !$data ||
    !isset($data->follower_id) ||
    !isset($data->following_id)
) {
    echo json_encode([
        "success" => false,
        "message" => "Missing follow data"
    ]);
    exit;
}

$followerId = (int)$data->follower_id;
$followingId = (int)$data->following_id;
$action = $data->action ?? "toggle";

if ($followerId === $followingId) {
    echo json_encode([
        "success" => false,
        "message" => "Cannot follow yourself"
    ]);
    exit;
}

$database = new Database();
$conn = $database->connect();
ensureProfileSchema($conn);

$stmt = $conn->prepare("
SELECT id
FROM follows
WHERE follower_id = :follower_id
AND following_id = :following_id
LIMIT 1
");

$stmt->execute([
    ":follower_id" => $followerId,
    ":following_id" => $followingId
]);

$exists = (bool)$stmt->fetch(PDO::FETCH_ASSOC);
$isFollowing = $exists;

if ($action === "unfollow" || ($action === "toggle" && $exists)) {
    $stmt = $conn->prepare("
    DELETE FROM follows
    WHERE follower_id = :follower_id
    AND following_id = :following_id
    ");

    $stmt->execute([
        ":follower_id" => $followerId,
        ":following_id" => $followingId
    ]);

    $isFollowing = false;
} else {
    $stmt = $conn->prepare("
    INSERT IGNORE INTO follows (follower_id, following_id)
    VALUES (:follower_id, :following_id)
    ");

    $stmt->execute([
        ":follower_id" => $followerId,
        ":following_id" => $followingId
    ]);

    $isFollowing = true;
}

echo json_encode([
    "success" => true,
    "is_following" => $isFollowing
]);
