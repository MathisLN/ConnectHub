import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8888/connecthub1/backend/api";

export default function Communities() {
  const [communities, setCommunities] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  async function fetchCommunities() {
    const userQuery = user?.id ? `?user_id=${user.id}` : "";
    const res = await fetch(`${API_BASE}/getcommunity.php${userQuery}`);
    const data = await res.json();
    if (data.success) setCommunities(data.communities);
  }

  useEffect(() => {
    fetchCommunities();
  }, []);

  const createCommunity = async (e) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch(`${API_BASE}/createcommunity.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        description,
        creator_id: user.id
      })
    });
    const data = await res.json();

    if (!data.success) {
      setMessage(data.message || "Could not create community");
      return;
    }

    setName("");
    setDescription("");
    fetchCommunities();
  };

  const joinCommunity = async (id) => {
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
      setCommunities((current) =>
        current.map((community) => {
          if (community.id !== id) return community;

          const memberCount = Number(community.member_count || 0);

          return {
            ...community,
            is_joined: 1,
            member_count: community.is_joined ? memberCount : memberCount + 1
          };
        })
      );
    }
  };

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.container}>
          <section style={styles.header}>
            <h2 style={styles.title}>Communities</h2>
            <p style={styles.subtitle}>
              Create spaces for shared interests and join groups that match your work.
            </p>
          </section>

          <form onSubmit={createCommunity} style={styles.form}>
            <input
              placeholder="Community name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
            <input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={styles.input}
            />
            <button style={styles.primaryButton}>Create</button>
          </form>

          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}

          <div style={styles.grid}>
            {communities.map((c) => (
              <div key={c.id} style={styles.card}>
                <h4 style={styles.cardTitle}>{c.name}</h4>
                <p style={styles.cardText}>{c.description}</p>
                <p style={styles.creatorText}>
                  Created by {c.creator_username}
                </p>
                <p style={styles.memberCount}>
                  {Number(c.member_count || 0)} member{Number(c.member_count || 0) === 1 ? "" : "s"}
                </p>
                <div style={styles.cardActions}>
                  <Link style={styles.openButton} to={`/communities/${c.id}`}>
                    Open
                  </Link>
                  <button
                    style={c.is_joined ? styles.joinedButton : styles.secondaryButton}
                    onClick={() => joinCommunity(c.id)}
                    disabled={Boolean(Number(c.is_joined))}
                  >
                    {Number(c.is_joined) ? "Joined" : "Join"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 70px)",
    background: "#f0f2f5",
    padding: "32px 20px"
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto"
  },
  header: {
    marginBottom: "22px"
  },
  title: {
    margin: 0,
    color: "#111827"
  },
  subtitle: {
    marginTop: "6px",
    color: "#6b7280"
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
    marginBottom: "22px",
    background: "#fff",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb"
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "11px 12px",
    font: "inherit"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px"
  },
  card: {
    padding: "18px",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb"
  },
  cardTitle: {
    margin: "0 0 8px",
    color: "#111827"
  },
  cardText: {
    color: "#6b7280",
    minHeight: "48px"
  },
  memberCount: {
    margin: "0 0 12px",
    color: "#4b5563",
    fontSize: "14px",
    fontWeight: 600
  },
  creatorText: {
    margin: "0 0 10px",
    color: "#6b7280",
    fontSize: "13px"
  },
  message: {
    marginBottom: "16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    color: "#b91c1c",
    padding: "10px 12px",
    fontWeight: 700
  },
  cardActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  openButton: {
    border: 0,
    borderRadius: "8px",
    background: "#111827",
    color: "#fff",
    padding: "9px 14px",
    fontWeight: 700,
    textDecoration: "none"
  },
  primaryButton: {
    border: 0,
    borderRadius: "8px",
    background: "#1877f2",
    color: "#fff",
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer"
  },
  secondaryButton: {
    border: 0,
    borderRadius: "8px",
    background: "#e7f3ff",
    color: "#1877f2",
    padding: "9px 14px",
    fontWeight: 700,
    cursor: "pointer"
  },
  joinedButton: {
    border: 0,
    borderRadius: "8px",
    background: "#ecfdf5",
    color: "#047857",
    padding: "9px 14px",
    fontWeight: 700,
    cursor: "default"
  }
};
