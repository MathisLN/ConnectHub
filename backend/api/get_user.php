<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");
require_once("../config/profile_schema.php");

$userId = $_GET["id"] ?? null;
$viewerId = $_GET["viewer_id"] ?? null;

if (!$userId) {
    echo json_encode([
        "success" => false,
        "message" => "Missing user id"
    ]);
    exit;
}

$database = new Database();
$conn = $database->connect();
ensureProfileSchema($conn);

if ($viewerId) {
    $stmtSqlExtra = ",
    EXISTS (
        SELECT 1
        FROM follows
        WHERE follower_id = :viewer_id
        AND following_id = users.id
    ) AS is_following
    ";
} else {
    $stmtSqlExtra = "";
}

$stmt = $conn->prepare("
SELECT
    id,
    first_name,
    last_name,
    username,
    email,
    bio,
    profile_picture,
    role,
    created_at,
    (
        SELECT COUNT(*)
        FROM follows
        WHERE following_id = users.id
    ) AS followers_count,
    (
        SELECT COUNT(*)
        FROM follows
        WHERE follower_id = users.id
    ) AS following_count
    $stmtSqlExtra
FROM users
WHERE id = :id
LIMIT 1
");

$params = [":id" => $userId];

if ($viewerId) {
    $params[":viewer_id"] = $viewerId;
}

$stmt->execute($params);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode([
        "success" => false,
        "message" => "User not found"
    ]);
    exit;
}

$stmt = $conn->prepare("
SELECT
    posts.*,
    (
        SELECT COUNT(*)
        FROM likes
        WHERE likes.post_id = posts.id
    ) AS likes_count,
    (
        SELECT COUNT(*)
        FROM comments
        WHERE comments.post_id = posts.id
    ) AS comments_count
FROM posts
WHERE user_id = :id
ORDER BY created_at DESC
");

$stmt->execute([":id" => $userId]);

echo json_encode([
    "success" => true,
    "user" => $user,
    "posts" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);
