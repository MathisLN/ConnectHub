<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");

$userId = $_GET["user_id"];

$db = new Database();
$conn = $db->connect();

$query = "
SELECT *
FROM notifications
WHERE user_id = :user_id
ORDER BY created_at DESC
";

$stmt = $conn->prepare($query);

$stmt->execute([
    ":user_id" => $userId
]);

echo json_encode([
    "success" => true,
    "notifications" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);