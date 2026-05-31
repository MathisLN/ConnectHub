<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
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
    !isset($data->user_id) ||
    !isset($data->content)
) {
    echo json_encode([
        "success" => false,
        "message" => "Missing data"
    ]);
    exit;
}

try {

    $db = new Database();
    $conn = $db->connect();

    $query = "
    INSERT INTO comments
    (
        post_id,
        user_id,
        content
    )
    VALUES
    (
        :post_id,
        :user_id,
        :content
    )
    ";

    $stmt = $conn->prepare($query);

    $stmt->execute([
        ":post_id" => $data->post_id,
        ":user_id" => $data->user_id,
        ":content" => $data->content
    ]);

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
            ":message" => $post["actor_username"] . " commented on your post."
        ]);
    }

    echo json_encode([
        "success" => true
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
