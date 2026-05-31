<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");
require_once("../config/auth.php");

$database = new Database();
$conn = $database->connect();

$userId = $_GET["user_id"] ?? null;
requireRole($conn, $userId, ["admin", "moderator"]);

$query = "SELECT reports.*, posts.content, users.username 
          FROM reports
          JOIN posts ON reports.post_id = posts.id
          JOIN users ON reports.reporter_id = users.id
          WHERE status = 'pending'
          ORDER BY created_at DESC";

$stmt = $conn->prepare($query);
$stmt->execute();

$reports = $stmt->fetchAll();

echo json_encode([
    "success" => true,
    "reports" => $reports
]);
