<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once("../config/database.php");
require_once("../config/content_schema.php");
require_once("../config/community_schema.php");

$database = new Database();
$conn = $database->connect();
ensureContentSchema($conn);
ensureCommunitySchema($conn);

$viewerId = $_GET["viewer_id"] ?? null;
$search = trim($_GET["q"] ?? "");
$category = trim($_GET["category"] ?? "");
$hashtag = strtolower(trim($_GET["hashtag"] ?? ""));
$sort = $_GET["sort"] ?? "recent";
$communityId = isset($_GET["community_id"]) ? (int) $_GET["community_id"] : 0;

$query = "
SELECT
    posts.*,
    users.username,
    users.profile_picture,
    communities.name AS community_name,

    (
        SELECT COUNT(*)
        FROM likes
        WHERE likes.post_id = posts.id
    ) AS likes_count,

    (
        SELECT COUNT(*)
        FROM comments
        WHERE comments.post_id = posts.id
    ) AS comments_count,

    (
        SELECT GROUP_CONCAT(post_hashtags.tag ORDER BY post_hashtags.tag SEPARATOR ',')
        FROM post_hashtags
        WHERE post_hashtags.post_id = posts.id
    ) AS hashtags
";

if ($viewerId) {
    $query .= ",
    EXISTS (
        SELECT 1
        FROM likes
        WHERE likes.post_id = posts.id
        AND likes.user_id = :viewer_id
    ) AS is_liked
    ";
}

$query .= "

FROM posts

JOIN users
ON users.id = posts.user_id

LEFT JOIN communities
ON communities.id = posts.community_id
";

$conditions = [];
$params = [];

if ($viewerId) {
    $params[":viewer_id"] = $viewerId;
}

if ($search !== "") {
    $conditions[] = "(posts.content LIKE :search OR users.username LIKE :search OR posts.link_url LIKE :search)";
    $params[":search"] = "%" . $search . "%";
}

if ($category !== "" && $category !== "all") {
    $conditions[] = "posts.category = :category";
    $params[":category"] = $category;
}

if ($hashtag !== "") {
    $conditions[] = "EXISTS (
        SELECT 1
        FROM post_hashtags ph_filter
        WHERE ph_filter.post_id = posts.id
        AND ph_filter.tag = :hashtag
    )";
    $params[":hashtag"] = ltrim($hashtag, "#");
}

if ($communityId) {
    $conditions[] = "posts.community_id = :community_id";
    $params[":community_id"] = $communityId;
}

if (!empty($conditions)) {
    $query .= " WHERE " . implode(" AND ", $conditions);
}

if ($sort === "popular") {
    $query .= " ORDER BY likes_count DESC, comments_count DESC, posts.created_at DESC";
} elseif ($sort === "discussed") {
    $query .= " ORDER BY comments_count DESC, posts.created_at DESC";
} else {
    $query .= " ORDER BY posts.created_at DESC";
}

$stmt = $conn->prepare($query);
$stmt->execute($params);

$posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($posts as &$post) {
    $post["hashtags"] = $post["hashtags"] ? explode(",", $post["hashtags"]) : [];
}

echo json_encode([
    "success" => true,
    "posts" => $posts
]);
