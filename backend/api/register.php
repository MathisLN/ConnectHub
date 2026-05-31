<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
header("Content-Type: application/json");
require_once(__DIR__ . "/../config/database.php");
$data = json_decode(file_get_contents("php://input"));
if (
    !$data ||
    !isset($data->first_name) ||
    !isset($data->last_name) ||
    !isset($data->username) ||
    !isset($data->email) ||
    !isset($data->password)
) {
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields"
    ]);
    exit;
}
$database = new Database();
$conn = $database->connect();
if (!$conn) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}
$first_name = $data->first_name;
$last_name = $data->last_name;
$username = $data->username;
$email = $data->email;
$password = password_hash($data->password, PASSWORD_BCRYPT);
$query = "SELECT id FROM users WHERE email = :email OR username = :username";
$stmt = $conn->prepare($query);
$stmt->bindParam(":email", $email);
$stmt->bindParam(":username", $username);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    echo json_encode([
        "success" => false,
        "message" => "User already exists"
    ]);
    exit;
}
$query = "INSERT INTO users (first_name, last_name, username, email, password)
          VALUES (:first_name, :last_name, :username, :email, :password)";

$stmt = $conn->prepare($query);

$stmt->bindParam(":first_name", $first_name);
$stmt->bindParam(":last_name", $last_name);
$stmt->bindParam(":username", $username);
$stmt->bindParam(":email", $email);
$stmt->bindParam(":password", $password);
if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "User registered successfully"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Registration failed"
    ]);
}