<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");
require_once("../config/community_schema.php");

$communityId = isset($_GET["community_id"]) ? (int) $_GET["community_id"] : 0;
$viewerId = isset($_GET["user_id"]) ? (int) $_GET["user_id"] : 0;

if (!$communityId) {
    echo json_encode([
        "success" => false,
        "message" => "Missing community"
    ]);
    exit;
}

$database = new Database();
$conn = $database->connect();
ensureCommunitySchema($conn);

$stmt = $conn->prepare("
    SELECT
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
    WHERE c.id = :community_id
    GROUP BY c.id, c.name, c.description, c.cover_image, c.creator_id, c.created_at, u.username
    LIMIT 1
");

$stmt->execute([
    ":community_id" => $communityId,
    ":viewer_id" => $viewerId
]);

$community = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$community) {
    echo json_encode([
        "success" => false,
        "message" => "Community not found"
    ]);
    exit;
}

$membersStmt = $conn->prepare("
    SELECT
        users.id,
        users.username,
        users.profile_picture,
        community_members.joined_at
    FROM community_members
    JOIN users ON users.id = community_members.user_id
    WHERE community_members.community_id = :community_id
    ORDER BY community_members.joined_at DESC
    LIMIT 12
");

$membersStmt->execute([":community_id" => $communityId]);

echo json_encode([
    "success" => true,
    "community" => $community,
    "members" => $membersStmt->fetchAll(PDO::FETCH_ASSOC)
]);
