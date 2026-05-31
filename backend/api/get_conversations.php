<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");

$userId = $_GET["user_id"];

$database = new Database();
$conn = $database->connect();

$query = "
SELECT
c.id AS conversation_id,
u.id AS user_id,
u.username
FROM conversations c

JOIN conversation_members cm1
ON c.id = cm1.conversation_id

JOIN conversation_members cm2
ON c.id = cm2.conversation_id

JOIN users u
ON cm2.user_id = u.id

WHERE cm1.user_id = :userId
AND cm2.user_id <> :userId
";

$stmt = $conn->prepare($query);

$stmt->execute([
    ":userId" => $userId
]);

echo json_encode([
    "success" => true,
    "conversations" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);