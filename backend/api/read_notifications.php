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

$userId = $_POST["user_id"] ?? 0;

if (!$userId) {
    parse_str(file_get_contents("php://input"), $body);
    $userId = $body["user_id"] ?? 0;
}

$db = new Database();
$conn = $db->connect();

$stmt = $conn->prepare("
UPDATE notifications
SET is_read = 1
WHERE user_id = :user_id
");

$stmt->execute([
    ":user_id" => $userId
]);

echo json_encode([
    "success" => true
]);