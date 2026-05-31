import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import UserAvatar from "../components/UserAvatar";
import "./Profile.css";

const API_BASE = "http://localhost:8888/connecthub1/backend/api";

export default function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const { id } = useParams();
  const profileId = id || storedUser.id;
  const isOwnProfile = Number(profileId) === Number(storedUser.id);

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [people, setPeople] = useState([]);
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(storedUser.id));
  const roleLabels = {
    student: "Student",
    community_admin: "Community admin",
    moderator: "Moderator",
    admin: "Admin"
  };

  const roleDescriptions = {
    student: "Can post, comment, message, follow users and join communities.",
    community_admin: "Can use student features and manage community spaces.",
    moderator: "Can use platform features and handle reported content.",
    admin: "Can manage moderation tools and user roles."
  };

  async function loadProfile() {
    try {
      const res = await fetch(
        `${API_BASE}/get_user.php?id=${profileId}&viewer_id=${storedUser.id}`
      );
      const data = await res.json();

      if (data.success) {
        setUserData(data.user);
        setPosts(data.posts || []);
        setBio(data.user.bio || "");
        setProfilePicture(data.user.profile_picture || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPeople() {
    try {
      const res = await fetch(
        `${API_BASE}/get_users.php?viewer_id=${storedUser.id}`
      );
      const data = await res.json();

      if (data.success) {
        setPeople(
          data.users.filter(
            (person) => Number(person.id) !== Number(storedUser.id)
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!storedUser.id) return;

    loadProfile();
    if (isOwnProfile) {
      loadPeople();
    }
  }, [profileId]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/update_profile.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: storedUser.id,
          bio,
          profile_picture: profilePicture
        })
      });

      const data = await res.json();

      if (data.success) {
        const updatedUser = {
          ...storedUser,
          ...data.user
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUserData((current) => ({
          ...current,
          ...data.user
        }));
        setMessage("Profile updated");
      } else {
        setMessage(data.message || "Could not update profile");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  const toggleFollow = async (person) => {
    const followingId = person?.id || profileId;

    try {
      const res = await fetch(`${API_BASE}/follow_user.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          follower_id: storedUser.id,
          following_id: followingId,
          action: "toggle"
        })
      });

      const data = await res.json();

      if (data.success) {
        if (person) {
          setPeople((current) =>
            current.map((item) =>
              item.id === person.id
                ? { ...item, is_following: data.is_following ? 1 : 0 }
                : item
            )
          );
        } else {
          setUserData((current) => ({
            ...current,
            is_following: data.is_following ? 1 : 0
          }));
        }
        loadProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading...</p>;
  }

  if (!storedUser.id) {
    return <p style={{ padding: "20px" }}>Please log in first.</p>;
  }

  if (!userData) {
    return <p style={{ padding: "20px" }}>Profile not found.</p>;
  }

  return (
    <>
      <Navbar />

      <div className="profile-page">
        <div className="profile-shell">
          <aside className="profile-panel">
            <div className="profile-header">
              <UserAvatar user={userData} size={82} />

              <div className="profile-name">
                <h2>
                  {userData.first_name} {userData.last_name}
                </h2>
                <p>@{userData.username}</p>
                <span className="profile-role">
                  {roleLabels[userData.role] || userData.role}
                </span>
              </div>
            </div>

            <div className="profile-permissions">
              {roleDescriptions[userData.role] || "Standard user permissions."}
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <strong>{userData.following_count || 0}</strong>
                <span>Following</span>
              </div>

              <div className="profile-stat">
                <strong>{userData.followers_count || 0}</strong>
                <span>Followers</span>
              </div>
            </div>

            {isOwnProfile ? (
              <form className="profile-form" onSubmit={saveProfile}>
                <label htmlFor="avatar">Avatar URL</label>
                <input
                  id="avatar"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={profilePicture}
                  onChange={(event) => setProfilePicture(event.target.value)}
                />

                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  placeholder="Tell people a little about you"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                />

                <button type="submit">Save profile</button>
              </form>
            ) : (
              <button
                className={`profile-follow-btn ${
                  Number(userData.is_following) ? "is-following" : ""
                }`}
                onClick={() => toggleFollow()}
                type="button"
              >
                {Number(userData.is_following) ? "Following" : "Follow"}
              </button>
            )}

            {message && <div className="profile-message">{message}</div>}
          </aside>

          <main className="profile-main">
            {isOwnProfile && (
              <section className="profile-people">
                <h3 className="profile-section-title">People</h3>

                {people.length === 0 ? (
                  <div className="profile-empty">No other users yet.</div>
                ) : (
                  people.map((person) => (
                    <div className="profile-person" key={person.id}>
                      <div className="profile-person-info">
                        <UserAvatar user={person} size={42} />
                        <div>
                          <strong>{person.username}</strong>
                          <span>
                            {person.first_name} {person.last_name}
                          </span>
                        </div>
                      </div>

                      <button
                        className={`profile-follow-btn ${
                          Number(person.is_following) ? "is-following" : ""
                        }`}
                        onClick={() => toggleFollow(person)}
                        type="button"
                      >
                        {Number(person.is_following) ? "Following" : "Follow"}
                      </button>
                    </div>
                  ))
                )}
              </section>
            )}

            <section>
              <h3 className="profile-section-title">Posts</h3>

              {posts.length === 0 ? (
                <div className="profile-empty">No posts yet.</div>
              ) : (
                posts.map((post) => (
                  <article className="profile-post" key={post.id}>
                    <div className="profile-post-header">
                      <span>@{userData.username}</span>
                      <span>
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="profile-post-content">{post.content}</div>

                    {post.image && (
                      <img
                        className="profile-post-image"
                        src={post.image}
                        alt="Post attachment"
                      />
                    )}

                    <div className="profile-post-stats">
                      <span>{post.likes_count} likes</span>
                      <span>{post.comments_count} comments</span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
