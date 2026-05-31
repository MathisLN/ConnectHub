<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once("../config/database.php");

$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "No JSON received"
    ]);
    exit;
}

if (!isset($data->user1) || !isset($data->user2)) {
    echo json_encode([
        "success" => false,
        "message" => "Missing user ids"
    ]);
    exit;
}

$user1 = (int)$data->user1;
$user2 = (int)$data->user2;

try {

    $database = new Database();
    $conn = $database->connect();

    $query = "
    SELECT c.id
    FROM conversations c
    JOIN conversation_members cm1
        ON c.id = cm1.conversation_id
    JOIN conversation_members cm2
        ON c.id = cm2.conversation_id
    WHERE cm1.user_id = :user1
    AND cm2.user_id = :user2
    LIMIT 1
    ";

    $stmt = $conn->prepare($query);

    $stmt->execute([
        ":user1" => $user1,
        ":user2" => $user2
    ]);

    $conversation = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($conversation) {
        echo json_encode([
            "success" => true,
            "conversation_id" => $conversation["id"]
        ]);
        exit;
    }

    $conn->beginTransaction();

    $conn->exec("
        INSERT INTO conversations ()
        VALUES ()
    ");

    $conversationId = $conn->lastInsertId();

    $stmt = $conn->prepare("
        INSERT INTO conversation_members
        (conversation_id, user_id)
        VALUES
        (:conversation, :user)
    ");

    $stmt->execute([
        ":conversation" => $conversationId,
        ":user" => $user1
    ]);

    $stmt->execute([
        ":conversation" => $conversationId,
        ":user" => $user2
    ]);

    $conn->commit();

    echo json_encode([
        "success" => true,
        "conversation_id" => $conversationId
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}