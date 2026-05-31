<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");

$conversation_id = $_GET['conversation_id'] ?? null;

if (!$conversation_id) {
    echo json_encode(["success" => false]);
    exit;
}

$database = new Database();
$conn = $database->connect();

$query = "SELECT messages.*, users.username 
          FROM messages 
          JOIN users ON messages.sender_id = users.id
          WHERE conversation_id = :conversation_id
          ORDER BY created_at ASC";

$stmt = $conn->prepare($query);
$stmt->bindParam(":conversation_id", $conversation_id);
$stmt->execute();

$messages = $stmt->fetchAll();

echo json_encode([
    "success" => true,
    "messages" => $messages
]);