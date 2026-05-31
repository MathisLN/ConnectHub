<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

require_once(__DIR__ . "/../config/database.php");
$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    echo json_encode(["success" => false, "message" => "No data"]);
    exit;
}

if (!isset($data->conversation_id)) {
    echo json_encode(["success" => false, "message" => "Missing conversation_id"]);
    exit;
}

if (!isset($data->sender_id)) {
    echo json_encode(["success" => false, "message" => "Missing sender_id"]);
    exit;
}

if (!isset($data->message)) {
    echo json_encode(["success" => false, "message" => "Missing message"]);
    exit;
}

$database = new Database();
$conn = $database->connect();

if (!$conn) {
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

$query = "INSERT INTO messages (conversation_id, sender_id, message)
          VALUES (:conversation_id, :sender_id, :message)";

$stmt = $conn->prepare($query);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed"]);
    exit;
}

$stmt->bindParam(":conversation_id", $data->conversation_id);
$stmt->bindParam(":sender_id", $data->sender_id);
$stmt->bindParam(":message", $data->message);

if ($stmt->execute()) {
    $query = "
    SELECT user_id
    FROM conversation_members
    WHERE conversation_id = :conversation_id
    AND user_id != :sender_id
    LIMIT 1
    ";

    $receiverStmt = $conn->prepare($query);

    $receiverStmt->execute([
        ":conversation_id" => $data->conversation_id,
        ":sender_id" => $data->sender_id
    ]);

    $receiver = $receiverStmt->fetch(PDO::FETCH_ASSOC);

    if ($receiver) {

        $notifStmt = $conn->prepare("
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

        $notifStmt->execute([
            ":user_id" => $receiver["user_id"],
            ":message" => "You received a new message."
        ]);
    }

    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Execute failed"]);
}
