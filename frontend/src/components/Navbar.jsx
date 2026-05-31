import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import UserAvatar from "./UserAvatar";

export default function Navbar() {
  const location = useLocation();

  const [notificationCount, setNotificationCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const user =
    JSON.parse(localStorage.getItem("user")) || {};

  async function fetchNotifications() {
    try {
      const response = await fetch(
        `http://localhost:8888/connecthub1/backend/api/get_unread_notifications.php?user_id=${user.id}`
      );

      const data = await response.json();

      if (data.success) {
        setNotificationCount(data.count);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch(
        "http://localhost:8888/connecthub1/backend/api/get_users.php"
      );

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (!user.id) return;

    fetchNotifications();
    fetchUsers();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? users.filter((item) => {
        const fullName = `${item.first_name || ""} ${item.last_name || ""}`;
        return (
          item.username?.toLowerCase().includes(normalizedSearch) ||
          fullName.toLowerCase().includes(normalizedSearch)
        );
      })
    : [];

  return (
    <nav style={styles.nav}>
      <div style={styles.leftSection}>
        <Link to="/feed" style={styles.logo}>
          ConnectHub
        </Link>
      </div>

      <div style={styles.centerSection}>
        <div style={styles.searchWrap}>
          <input
            type="search"
            placeholder="Search users"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            style={styles.searchInput}
          />

          {normalizedSearch && (
            <div style={styles.searchResults}>
              {filteredUsers.length === 0 ? (
                <div style={styles.searchEmpty}>No users found</div>
              ) : (
                filteredUsers.map((item) => (
                  <Link
                    key={item.id}
                    to={`/profile/${item.id}`}
                    style={styles.searchUser}
                    onClick={() => setSearchQuery("")}
                  >
                    <UserAvatar user={item} size={34} />

                    <div>
                      <div style={styles.searchUsername}>{item.username}</div>
                      <div style={styles.searchName}>
                        {item.first_name} {item.last_name}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <Link
          to="/feed"
          aria-label="Feed"
          title="Feed"
          style={{
            ...styles.link,
            ...(location.pathname === "/feed"
              ? styles.activeLink
              : {})
          }}
        >
          <HomeIcon />
        </Link>

        <Link
          to="/communities"
          aria-label="Communities"
          title="Communities"
          style={{
            ...styles.link,
            ...(location.pathname === "/communities"
              ? styles.activeLink
              : {})
          }}
        >
          <CommunityIcon />
        </Link>

        <Link
          to="/messages"
          aria-label="Messages"
          title="Messages"
          style={{
            ...styles.link,
            ...(location.pathname === "/messages"
              ? styles.activeLink
              : {})
          }}
        >
          <MessageIcon />
        </Link>

        <Link
          to="/notifications"
          aria-label="Notifications"
          title="Notifications"
          style={{
            ...styles.link,
            ...styles.notificationLink,
            ...(location.pathname === "/notifications"
              ? styles.activeLink
              : {})
          }}
        >
          <BellIcon />

          {notificationCount > 0 && (
            <span style={styles.badge}>
              {notificationCount}
            </span>
          )}
        </Link>

        <Link
          to="/profile"
          aria-label="Profile"
          title="Profile"
          style={{
            ...styles.link,
            ...(location.pathname === "/profile"
              ? styles.activeLink
              : {})
          }}
        >
          <UserIcon />
        </Link>

        {(user.role === "admin" || user.role === "moderator") && (
          <Link
            to="/admin"
            aria-label="Moderation"
            title="Moderation"
            style={{
              ...styles.link,
              ...(location.pathname === "/admin"
                ? styles.activeLink
                : {})
            }}
          >
            <ShieldIcon />
          </Link>
        )}
      </div>

      <div style={styles.rightSection}>
        <Link
          to="/"
          style={styles.logout}
          onClick={() => {
            localStorage.removeItem("user");
          }}
        >
          Logout
        </Link>
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg style={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.2v-6.4H8.7V21H3.5a.5.5 0 0 1-.5-.5z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg style={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4.2 4.2A.5.5 0 0 1 4 19.8z" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg style={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m8.5 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2.5 20.5a5.5 5.5 0 0 1 11 0 .5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5m11.8.5h6.2a.5.5 0 0 0 .5-.5 4.5 4.5 0 0 0-7.2-3.6 6.8 6.8 0 0 1 .5 4.1" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg style={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22a2.6 2.6 0 0 0 2.5-2h-5a2.6 2.6 0 0 0 2.5 2M5 18h14l-1.6-2.3V10a5.4 5.4 0 0 0-4.1-5.2V3a1.3 1.3 0 0 0-2.6 0v1.8A5.4 5.4 0 0 0 6.6 10v5.7z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg style={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9m-8 9a8 8 0 0 1 16 0 .5.5 0 0 1-.5.5h-15A.5.5 0 0 1 4 21" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg style={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.4 20 5.5v5.8c0 5.1-3.2 8.8-8 10.3-4.8-1.5-8-5.2-8-10.3V5.5zm3.7 7.2-4.6 4.6-2-2-1.4 1.4 3.4 3.4 6-6z" />
    </svg>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    minHeight: "70px",
    backgroundColor: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 30px",
    gap: "18px",
    flexWrap: "wrap",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
  },

  leftSection: {
    display: "flex",
    alignItems: "center"
  },

  centerSection: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flex: "1 1 520px",
    justifyContent: "center",
    flexWrap: "wrap"
  },

  rightSection: {
    display: "flex",
    alignItems: "center"
  },

  logo: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    color: "#1877f2",
    cursor: "pointer",
    textDecoration: "none"
  },

  link: {
    textDecoration: "none",
    color: "#555",
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    fontWeight: "600",
    transition: "0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  searchWrap: {
    position: "relative",
    width: "min(320px, 42vw)",
    minWidth: "180px"
  },

  searchInput: {
    width: "100%",
    height: "44px",
    border: "1px solid #dbe3ec",
    borderRadius: "10px",
    padding: "0 14px",
    outline: "none",
    fontSize: "14px",
    color: "#111827",
    backgroundColor: "#f8fafc",
    boxSizing: "border-box"
  },

  searchResults: {
    position: "absolute",
    top: "52px",
    left: 0,
    right: 0,
    zIndex: 1200,
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 12px 30px rgba(15,23,42,.16)",
    padding: "8px",
    display: "grid",
    gap: "6px"
  },

  searchUser: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    textDecoration: "none"
  },

  searchUsername: {
    color: "#111827",
    fontWeight: 700,
    fontSize: "14px",
    lineHeight: "18px"
  },

  searchName: {
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: "16px"
  },

  searchEmpty: {
    color: "#6b7280",
    fontSize: "13px",
    padding: "10px"
  },

  icon: {
    width: "22px",
    height: "22px",
    fill: "currentColor",
    display: "block"
  },

  notificationLink: {
    position: "relative"
  },

  badge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",

    minWidth: "20px",
    height: "20px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#ef4444",
    color: "#fff",

    borderRadius: "50%",

    fontSize: "11px",
    fontWeight: "700",

    padding: "0 6px"
  },

  activeLink: {
    backgroundColor: "#e7f3ff",
    color: "#1877f2"
  },

  logout: {
    textDecoration: "none",
    backgroundColor: "#ef4444",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "10px",
    fontWeight: "600"
  }
};
