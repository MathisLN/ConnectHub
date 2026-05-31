<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config/database.php");

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->reporter_id) ||
    !isset($data->post_id) ||
    !isset($data->reason)
) {
    echo json_encode(["success" => false]);
    exit;
}

$database = new Database();
$conn = $database->connect();

$query = "INSERT INTO reports (reporter_id, post_id, reason) 
          VALUES (:reporter_id, :post_id, :reason)";

$stmt = $conn->prepare($query);

$stmt->bindParam(":reporter_id", $data->reporter_id);
$stmt->bindParam(":post_id", $data->post_id);
$stmt->bindParam(":reason", $data->reason);

$stmt->execute();

echo json_encode(["success" => true]);