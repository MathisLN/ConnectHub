import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserAvatar from "../components/UserAvatar";
import "./CommunityDetail.css";

const API_BASE = "http://localhost:8888/connecthub1/backend/api";

export default function CommunityDetail() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState("");

  const categories = [
    { value: "general", label: "General" },
    { value: "question", label: "Question" },
    { value: "project", label: "Project" },
    { value: "event", label: "Event" },
    { value: "resource", label: "Resource" }
  ];

  async function loadCommunity() {
    const res = await fetch(`${API_BASE}/get_community.php?community_id=${id}&user_id=${user.id}`);
    const data = await res.json();

    if (data.success) {
      setCommunity(data.community);
      setMembers(data.members);
    } else {
      setMessage(data.message || "Community not found");
    }
  }

  async function loadPosts() {
    const params = new URLSearchParams({
      viewer_id: user.id,
      community_id: id
    });

    const res = await fetch(`${API_BASE}/get_posts.php?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      setPosts(data.posts);
    }
  }

  useEffect(() => {
    loadCommunity();
    loadPosts();
  }, [id]);

  const joinCommunity = async () => {
    const res = await fetch(`${API_BASE}/joincommunity.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: user.id,
        community_id: id
      })
    });

    const data = await res.json();

    if (data.success) {
      loadCommunity();
    } else {
      setMessage(data.message || "Could not join community");
    }
  };

  const createPost = async (event) => {
    event.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("community_id", id);
    formData.append("content", content);
    formData.append("category", category);
    formData.append("link_url", linkUrl);

    if (selectedImage) {
      formData.append("image", selectedImage);
    }

    const res = await fetch(`${API_BASE}/create_post.php`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.success) {
      setMessage(data.message || "Could not publish post");
      return;
    }

    setContent("");
    setCategory("general");
    setLinkUrl("");
    setSelectedImage(null);
    loadPosts();
  };

  const likePost = async (postId) => {
    await fetch(`${API_BASE}/like_post.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        post_id: postId,
        user_id: user.id
      })
    });

    loadPosts();
  };

  if (!community) {
    return (
      <>
        <Navbar />
        <div className="community-page">
          <div className="community-shell">
            {message || "Loading community..."}
          </div>
        </div>
      </>
    );
  }

  const isJoined = Boolean(Number(community.is_joined));

  return (
    <>
      <Navbar />
      <div className="community-page">
        <div className="community-shell">
          <Link className="community-back" to="/communities">
            Back to communities
          </Link>

          <section className="community-hero">
            <div>
              <h1>{community.name}</h1>
              <p>{community.description}</p>
              <span>
                {Number(community.member_count || 0)} member{Number(community.member_count || 0) === 1 ? "" : "s"} · Created by {community.creator_username}
              </span>
            </div>

            <button
              className={isJoined ? "community-joined" : "community-join"}
              onClick={joinCommunity}
              disabled={isJoined}
            >
              {isJoined ? "Joined" : "Join community"}
            </button>
          </section>

          {message && (
            <div className="community-message">
              {message}
            </div>
          )}

          <div className="community-layout">
            <main>
              {isJoined ? (
                <form className="community-create" onSubmit={createPost}>
                  <textarea
                    placeholder={`Publish in ${community.name}`}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                  />

                  <div className="community-post-options">
                    <select value={category} onChange={(event) => setCategory(event.target.value)}>
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
                      onChange={(event) => setLinkUrl(event.target.value)}
                    />

                    <label>
                      Image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        onChange={(event) => setSelectedImage(event.target.files[0] || null)}
                      />
                    </label>
                  </div>

                  {selectedImage && (
                    <span className="community-file-name">
                      {selectedImage.name}
                    </span>
                  )}

                  <button type="submit">
                    Publish
                  </button>
                </form>
              ) : (
                <div className="community-locked">
                  Join this community to publish content here.
                </div>
              )}

              {posts.map((post) => (
                <article className="community-post" key={post.id}>
                  <header>
                    <Link to={`/profile/${post.user_id}`}>
                      <UserAvatar username={post.username} src={post.profile_picture} />
                    </Link>
                    <div>
                      <Link to={`/profile/${post.user_id}`}>{post.username}</Link>
                      <span>{new Date(post.created_at).toLocaleString()}</span>
                    </div>
                  </header>

                  <p>{post.content}</p>

                  <div className="community-post-tags">
                    <span>{post.category || "general"}</span>
                    {(post.hashtags || []).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>

                  {post.link_url && (
                    <a className="community-post-link" href={post.link_url} target="_blank" rel="noreferrer">
                      {post.link_url}
                    </a>
                  )}

                  {post.image && (
                    <img src={post.image} alt="Post attachment" />
                  )}

                  <button
                    className={Number(post.is_liked) ? "community-liked" : ""}
                    onClick={() => likePost(post.id)}
                  >
                    {Number(post.is_liked) ? "Liked" : "Like"} · {post.likes_count}
                  </button>
                </article>
              ))}
            </main>

            <aside className="community-members">
              <h2>Members</h2>
              {members.map((member) => (
                <Link key={member.id} to={`/profile/${member.id}`}>
                  <UserAvatar username={member.username} src={member.profile_picture} />
                  <span>{member.username}</span>
                </Link>
              ))}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
