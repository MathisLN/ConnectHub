<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once("../config/database.php");

$data = json_decode(file_get_contents("php://input"));

if (
    !$data ||
    !isset($data->post_id) ||
    !isset($data->user_id)
) {
    echo json_encode([
        "success" => false
    ]);
    exit;
}

$db = new Database();
$conn = $db->connect();

$stmt = $conn->prepare("
SELECT id
FROM likes
WHERE post_id = :post_id
AND user_id = :user_id
LIMIT 1
");

$stmt->execute([
    ":post_id" => $data->post_id,
    ":user_id" => $data->user_id
]);

$existingLike = $stmt->fetch(PDO::FETCH_ASSOC);
$likeWasCreated = false;

if ($existingLike) {
    $stmt = $conn->prepare("
    DELETE FROM likes
    WHERE post_id = :post_id
    AND user_id = :user_id
    ");

    $stmt->execute([
        ":post_id" => $data->post_id,
        ":user_id" => $data->user_id
    ]);

    $isLiked = false;
} else {
    $stmt = $conn->prepare("
    INSERT INTO likes
    (
        post_id,
        user_id
    )
    VALUES
    (
        :post_id,
        :user_id
    )
    ");

    $stmt->execute([
        ":post_id" => $data->post_id,
        ":user_id" => $data->user_id
    ]);

    $likeWasCreated = true;
    $isLiked = true;
}

$query = "
SELECT
    posts.user_id,
    users.username AS actor_username
FROM posts
JOIN users
ON users.id = :actor_id
WHERE posts.id = :post_id
";

$stmt = $conn->prepare($query);

$stmt->execute([
    ":post_id" => $data->post_id,
    ":actor_id" => $data->user_id
]);

$post = $stmt->fetch(PDO::FETCH_ASSOC);

if (
    $likeWasCreated &&
    $post &&
    $post["user_id"] != $data->user_id
) {

    $stmt = $conn->prepare("
    INSERT INTO notifications
    (
        user_id,
        message
    )
    VALUES
    (
        :user_id,
        :message
    )
    ");

    $stmt->execute([
        ":user_id" => $post["user_id"],
        ":message" => $post["actor_username"] . " liked your post."
    ]);
}

echo json_encode([
    "success" => true,
    "liked" => $isLiked
]);
