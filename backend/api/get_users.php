<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");
require_once("../config/profile_schema.php");

$database = new Database();
$conn = $database->connect();
ensureProfileSchema($conn);

$viewerId = $_GET["viewer_id"] ?? null;

$query = "
SELECT
id,
username,
first_name,
last_name,
profile_picture,
role
";

if ($viewerId) {
    $query .= ",
    EXISTS (
        SELECT 1
        FROM follows
        WHERE follows.follower_id = :viewer_id
        AND follows.following_id = users.id
    ) AS is_following
    ";
}

$query .= "
FROM users
ORDER BY username
";

$stmt = $conn->prepare($query);

if ($viewerId) {
    $stmt->execute([":viewer_id" => $viewerId]);
} else {
    $stmt->execute();
}

$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "success" => true,
    "users" => $users
]);
