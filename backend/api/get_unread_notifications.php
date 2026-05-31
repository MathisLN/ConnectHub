<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once("../config/database.php");

$userId = $_GET["user_id"] ?? 0;

$db = new Database();
$conn = $db->connect();

$query = "
SELECT COUNT(*) as total
FROM notifications
WHERE user_id = :user_id
AND is_read = 0
";

$stmt = $conn->prepare($query);

$stmt->execute([
    ":user_id" => $userId
]);

$result = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode([
    "success" => true,
    "count" => (int)$result["total"]
]);