<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");

$postId = $_GET["post_id"];

$db = new Database();
$conn = $db->connect();

$query = "
SELECT
comments.*,
users.username

FROM comments

JOIN users
ON users.id = comments.user_id

WHERE post_id = :post_id

ORDER BY created_at ASC
";

$stmt = $conn->prepare($query);

$stmt->bindParam(":post_id",$postId);

$stmt->execute();

echo json_encode([
    "success" => true,
    "comments" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);