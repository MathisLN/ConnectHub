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
require_once("../config/auth.php");

$data = json_decode(file_get_contents("php://input"));

if (
    !$data ||
    !isset($data->post_id) ||
    !isset($data->user_id)
) {
    echo json_encode([
        "success" => false,
        "message" => "Missing post data"
    ]);
    exit;
}

$database = new Database();
$conn = $database->connect();

$stmt = $conn->prepare("
SELECT user_id, image
FROM posts
WHERE id = :id
LIMIT 1
");

$stmt->execute([":id" => $data->post_id]);
$post = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$post) {
    echo json_encode([
        "success" => false,
        "message" => "Post not found"
    ]);
    exit;
}

$role = getUserRole($conn, $data->user_id);
$isOwner = (int)$post["user_id"] === (int)$data->user_id;
$canModerate = in_array($role, ["admin", "moderator"], true);

if (!$isOwner && !$canModerate) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Forbidden"
    ]);
    exit;
}

$stmt = $conn->prepare("
DELETE FROM posts
WHERE id = :id
");

$stmt->execute([":id" => $data->post_id]);

if ($post["image"]) {
    $prefix = "http://localhost:8888/connecthub1/backend/uploads/posts/";

    if (strpos($post["image"], $prefix) === 0) {
        $fileName = basename($post["image"]);
        $path = __DIR__ . "/../uploads/posts/" . $fileName;

        if (is_file($path)) {
            unlink($path);
        }
    }
}

echo json_encode([
    "success" => true
]);
