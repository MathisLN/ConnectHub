<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config/database.php");
require_once("../config/auth.php");

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->report_id) ||
    !isset($data->action) ||
    !isset($data->user_id)
) {
    echo json_encode(["success" => false]);
    exit;
}

$database = new Database();
$conn = $database->connect();

requireRole($conn, $data->user_id, ["admin", "moderator"]);

if ($data->action === "delete") {
    $query = "SELECT post_id FROM reports WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":id", $data->report_id);
    $stmt->execute();
    $report = $stmt->fetch();

    $query = "DELETE FROM posts WHERE id = :post_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":post_id", $report['post_id']);
    $stmt->execute();

    $status = "approved";
} else {
    $status = "rejected";
}

$query = "UPDATE reports SET status = :status WHERE id = :id";
$stmt = $conn->prepare($query);
$stmt->bindParam(":status", $status);
$stmt->bindParam(":id", $data->report_id);
$stmt->execute();

echo json_encode(["success" => true]);
