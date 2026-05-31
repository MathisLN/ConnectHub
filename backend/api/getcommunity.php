<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");
require_once("../config/community_schema.php");

$database = new Database();
$conn = $database->connect();
ensureCommunitySchema($conn);

$viewerId = isset($_GET["user_id"]) ? (int) $_GET["user_id"] : 0;

$query = "SELECT
            c.id,
            c.name,
            c.description,
            c.cover_image,
            c.creator_id,
            c.created_at,
            u.username AS creator_username,
            COUNT(cm.id) AS member_count,
            MAX(CASE WHEN cm.user_id = :viewer_id THEN 1 ELSE 0 END) AS is_joined
          FROM communities c
          JOIN users u ON u.id = c.creator_id
          LEFT JOIN community_members cm ON cm.community_id = c.id
          GROUP BY c.id, c.name, c.description, c.cover_image, c.creator_id, c.created_at, u.username
          ORDER BY c.created_at DESC";

$stmt = $conn->prepare($query);
$stmt->bindValue(":viewer_id", $viewerId, PDO::PARAM_INT);
$stmt->execute();

$communities = $stmt->fetchAll();

echo json_encode([
    "success" => true,
    "communities" => $communities
]);
