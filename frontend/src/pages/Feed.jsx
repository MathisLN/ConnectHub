import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserAvatar from "../components/UserAvatar";
import "./Feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [category, setCategory] = useState("general");
  const [linkUrl, setLinkUrl] = useState("");
  const [postMessage, setPostMessage] = useState("");
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [feedSearch, setFeedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [hashtagFilter, setHashtagFilter] = useState("");
  const [sortMode, setSortMode] = useState("recent");

  const user = JSON.parse(localStorage.getItem("user"));
  const categories = [
    { value: "general", label: "General" },
    { value: "question", label: "Question" },
    { value: "project", label: "Project" },
    { value: "event", label: "Event" },
    { value: "resource", label: "Resource" }
  ];

  async function fetchPosts() {
    try {
      const params = new URLSearchParams({
        viewer_id: user.id,
        sort: sortMode
      });

      if (feedSearch.trim()) params.set("q", feedSearch.trim());
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (hashtagFilter.trim()) params.set("hashtag", hashtagFilter.trim());

      const response = await fetch(
        `http://localhost:8888/connecthub1/backend/api/get_posts.php?${params.toString()}`
      );

      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [feedSearch, categoryFilter, hashtagFilter, sortMode]);

  useEffect(() => {
    if (!posts.length || !window.location.hash) return;

    const target = document.querySelector(window.location.hash);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [posts]);

  const createPost = async (e) => {
    e.preventDefault();
    setPostMessage("");

    try {
      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("content", content);
      formData.append("category", category);
      formData.append("link_url", linkUrl);

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch(
        "http://localhost:8888/connecthub1/backend/api/create_post.php",
        {
          method: "POST",
          body: formData
        }
      );

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error("Invalid create_post response:", text, error);
        setPostMessage("Server returned an invalid response");
        return;
      }

      if (!data.success) {
        setPostMessage(
          data.detected_type
            ? `${data.message}: ${data.detected_type}`
            : data.message || "Could not publish post"
        );
        return;
      }

      setContent("");
      setSelectedImage(null);
      setCategory("general");
      setLinkUrl("");
      fetchPosts();
    } catch (error) {
      console.error(error);
      setPostMessage("Server error while publishing post");
    }
  };

  const likePost = async (postId) => {
    try {
      await fetch(
        "http://localhost:8888/connecthub1/backend/api/like_post.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            post_id: postId,
            user_id: user.id
          })
        }
      );

      fetchPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const loadComments = async (postId) => {
    try {
      const response = await fetch(
        `http://localhost:8888/connecthub1/backend/api/get_comments.php?post_id=${postId}`
      );

      const data = await response.json();

      if (data.success) {
        setComments((prev) => ({
          ...prev,
          [postId]: data.comments
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addComment = async (postId) => {
    if (!newComments[postId]?.trim()) return;

    try {
      await fetch(
        "http://localhost:8888/connecthub1/backend/api/create_comment.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            post_id: postId,
            user_id: user.id,
            content: newComments[postId]
          })
        }
      );

      setNewComments({
        ...newComments,
        [postId]: ""
      });

      loadComments(postId);
      fetchPosts();
    } catch (error) {
      console.error(error);
    }
  };

  const sharePost = async (postId) => {
    const url = `${window.location.origin}/feed#post-${postId}`;

    try {
      await navigator.clipboard.writeText(url);
      alert("Post link copied");
    } catch (error) {
      console.error(error);
      window.prompt("Copy this post link", url);
    }
  };

  const clearFilters = () => {
    setFeedSearch("");
    setCategoryFilter("all");
    setHashtagFilter("");
    setSortMode("recent");
  };

  const trendingTags = posts
    .flatMap((post) => post.hashtags || [])
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

  const sortedTrendingTags = Object.entries(trendingTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const canDeletePost = (post) =>
    Number(post.user_id) === Number(user.id) ||
    user.role === "admin" ||
    user.role === "moderator";

  const deletePost = async (postId) => {
    const confirmed = window.confirm("Delete this post?");

    if (!confirmed) return;

    try {
      const response = await fetch(
        "http://localhost:8888/connecthub1/backend/api/delete_post.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            post_id: postId,
            user_id: user.id
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setOpenMenuPostId(null);
        fetchPosts();
      } else {
        alert(data.message || "Could not delete post");
      }
    } catch (error) {
      console.error(error);
      alert("Server error while deleting post");
    }
  };

  return (
    <>
      <Navbar />

      <div className="feed-page">
        <div className="feed-layout">

          <aside className="sidebar">

            <div className="sidebar-card">
              <div className="sidebar-title">
                Navigation
              </div>

              <Link className="sidebar-item" to="/feed">Feed</Link>
              <Link className="sidebar-item" to="/communities">Communities</Link>
              <Link className="sidebar-item" to="/messages">Messages</Link>
              <Link className="sidebar-item" to="/notifications">Notifications</Link>
              <Link className="sidebar-item" to="/profile">Profile</Link>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-title">
                Groups
              </div>

              <div className="sidebar-item">
                💻 Web Developers
              </div>

              <div className="sidebar-item">
                🎨 UI / UX
              </div>

              <div className="sidebar-item">
                📷 Photography
              </div>
            </div>

          </aside>

          <main className="feed-center">
            <div className="create-post">
              <div className="create-post-top">

                <UserAvatar user={user} />

                <div className="post-input">
                  <form onSubmit={createPost}>

                    <textarea
                      placeholder={`What's on your mind, ${user?.username}?`}
                      value={content}
                      onChange={(e) =>
                        setContent(e.target.value)
                      }
                    />

                    <div className="post-meta-tools">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        aria-label="Post category"
                      >
                        {categories.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="url"
                        placeholder="Optional link"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                      />
                    </div>

                    <div className="post-tools">
                      <label className="image-picker">
                        Image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          onChange={(event) =>
                            setSelectedImage(event.target.files[0] || null)
                          }
                        />
                      </label>

                      {selectedImage && (
                        <span className="image-name">
                          {selectedImage.name}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="publish-btn"
                    >
                      Publish
                    </button>

                    {postMessage && (
                      <div className="post-message">
                        {postMessage}
                      </div>
                    )}

                  </form>
                </div>

              </div>
            </div>

            <div className="feed-filters">
              <input
                type="search"
                placeholder="Search posts, links or users"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                aria-label="Sort posts"
              >
                <option value="recent">Recent</option>
                <option value="popular">Most liked</option>
                <option value="discussed">Most discussed</option>
              </select>

              {(feedSearch || categoryFilter !== "all" || hashtagFilter || sortMode !== "recent") && (
                <button type="button" onClick={clearFilters}>
                  Clear
                </button>
              )}
            </div>

            {hashtagFilter && (
              <div className="active-filter">
                Showing #{hashtagFilter.replace("#", "")}
              </div>
            )}

            {posts.map((post) => (
              <div
                className="post-card"
                key={post.id}
                id={`post-${post.id}`}
                onDoubleClick={() => likePost(post.id)}
              >
                <div className="post-header">

                  <Link to={`/profile/${post.user_id}`}>
                    <UserAvatar
                      username={post.username}
                      src={post.profile_picture}
                    />
                  </Link>

                  <div className="post-user">
                    <h4>
                      <Link to={`/profile/${post.user_id}`}>
                        {post.username}
                      </Link>
                    </h4>

                    <span>
                      {new Date(
                        post.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  {canDeletePost(post) && (
                    <div className="post-menu">
                      <button
                        className="post-menu-button"
                        onClick={() =>
                          setOpenMenuPostId(
                            openMenuPostId === post.id ? null : post.id
                          )
                        }
                        aria-label="Post options"
                        type="button"
                      >
                        ⋯
                      </button>

                      {openMenuPostId === post.id && (
                        <div className="post-menu-dropdown">
                          <button
                            onClick={() => deletePost(post.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                <div className="post-content">
                  {post.content}
                </div>

                <div className="post-labels">
                  {post.community_id && post.community_name && (
                    <Link
                      className="community-label"
                      to={`/communities/${post.community_id}`}
                    >
                      {post.community_name}
                    </Link>
                  )}

                  <span className="category-label">
                    {post.category || "general"}
                  </span>

                  {(post.hashtags || []).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="hashtag-label"
                      onClick={() => setHashtagFilter(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                {post.link_url && (
                  <a
                    className="post-link-preview"
                    href={post.link_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {post.link_url}
                  </a>
                )}

                {post.image && (
                  <img
                    className="post-image"
                    src={post.image}
                    alt="Post attachment"
                  />
                )}

                <div className="post-stats">
                  <span>
                    👍 {post.likes_count}
                  </span>

                  <span>
                    💬 {post.comments_count}
                  </span>
                </div>

                <div className="post-actions">

                  <button
                    className={Number(post.is_liked) ? "liked-action" : ""}
                    onClick={() =>
                      likePost(post.id)
                    }
                  >
                    {Number(post.is_liked) ? "Liked" : "Like"}
                  </button>

                  <button
                    onClick={() =>
                      loadComments(post.id)
                    }
                  >
                    💬 Comments
                  </button>

                  <button onClick={() => sharePost(post.id)}>
                    Share
                  </button>

                </div>

                {comments[post.id] && (
                  <div className="comment-section">

                    {comments[post.id].map(
                      (comment) => (
                        <div
                          key={comment.id}
                          className="comment"
                        >
                          <div className="comment-user">
                            {comment.username}
                          </div>

                          <div>
                            {comment.content}
                          </div>
                        </div>
                      )
                    )}

                    <div className="comment-form">

                      <input
                        placeholder="Write a comment..."
                        value={newComments[post.id] || ""}
                        onChange={(e) =>
                          setNewComments({
                            ...newComments,
                            [post.id]: e.target.value
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addComment(post.id);
                          }
                        }}
                      />

                      <button
                        onClick={() =>
                          addComment(post.id)
                        }
                      >
                        Send
                      </button>

                    </div>

                  </div>
                )}

              </div>
            ))}
          </main>

          <aside className="sidebar">

            <div className="sidebar-card">
              <div className="sidebar-title">
                Trending
              </div>

              {sortedTrendingTags.length > 0 ? (
                sortedTrendingTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    type="button"
                    className="trending-item"
                    onClick={() => setHashtagFilter(tag)}
                  >
                    <strong>#{tag}</strong>
                    <span>
                      {count} post{count === 1 ? "" : "s"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="trending-empty">
                  No hashtags yet
                </div>
              )}
            </div>

            <div className="sidebar-card">
              <div className="sidebar-title">
                Suggested Friends
              </div>

              <div className="suggestion">
                <span>Hina Manolo</span>
                <button className="follow-btn">
                  Follow
                </button>
              </div>

              <div className="suggestion">
                <span>Jean-pierre Segado</span>
                <button className="follow-btn">
                  Follow
                </button>
              </div>

              <div className="suggestion">
                <span>ProfsInfoLesMeilleurs</span>
                <button className="follow-btn">
                  Follow
                </button>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </>
  );
}
