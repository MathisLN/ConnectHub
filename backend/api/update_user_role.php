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
    !isset($data->admin_id) ||
    !isset($data->user_id) ||
    !isset($data->role)
) {
    echo json_encode([
        "success" => false,
        "message" => "Missing role update data"
    ]);
    exit;
}

$allowedRoles = ["student", "community_admin", "moderator", "admin"];

if (!in_array($data->role, $allowedRoles, true)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid role"
    ]);
    exit;
}

$database = new Database();
$conn = $database->connect();

requireRole($conn, $data->admin_id, ["admin"]);

$stmt = $conn->prepare("
UPDATE users
SET role = :role
WHERE id = :id
");

$stmt->execute([
    ":role" => $data->role,
    ":id" => $data->user_id
]);

echo json_encode([
    "success" => true
]);
