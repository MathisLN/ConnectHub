import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:8888/connecthub1/backend/api";

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const canModerate = user.role === "admin" || user.role === "moderator";
  const canManageRoles = user.role === "admin";

  async function fetchReports() {
    const res = await fetch(`${API_BASE}/get_reports.php?user_id=${user.id}`);
    const data = await res.json();
    if (data.success) setReports(data.reports);
  }

  async function fetchUsers() {
    const res = await fetch(`${API_BASE}/get_users.php`);
    const data = await res.json();
    if (data.success) setUsers(data.users);
  }

  useEffect(() => {
    if (!canModerate) return;
    fetchReports();
    if (canManageRoles) fetchUsers();
  }, []);

  const handle = async (id, action) => {
    await fetch(`${API_BASE}/handle_report.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        report_id: id,
        action,
        user_id: user.id
      })
    });

    fetchReports();
  };

  const updateRole = async (targetUserId, role) => {
    const res = await fetch(`${API_BASE}/update_user_role.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        admin_id: user.id,
        user_id: targetUserId,
        role
      })
    });

    const data = await res.json();

    if (data.success) {
      setUsers((current) =>
        current.map((item) =>
          Number(item.id) === Number(targetUserId)
            ? { ...item, role }
            : item
        )
      );
    }
  };

  if (!canModerate) {
    return (
      <>
        <Navbar />
        <div style={styles.page}>
          <div style={styles.panel}>
            <h2 style={styles.title}>Moderation</h2>
            <p style={styles.muted}>
              You do not have permission to access moderation tools.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.panel}>
          <h2 style={styles.title}>Moderation</h2>

          {reports.length === 0 ? (
            <p style={styles.muted}>No pending reports.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} style={styles.report}>
                <p style={styles.content}>
                  <b>{r.username}</b>: {r.content}
                </p>
                <p style={styles.reason}>{r.reason}</p>
                <div style={styles.actions}>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handle(r.id, "delete")}
                  >
                    Delete
                  </button>
                  <button
                    style={styles.ignoreButton}
                    onClick={() => handle(r.id, "ignore")}
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {canManageRoles && (
          <div style={styles.panel}>
            <h2 style={styles.title}>User roles</h2>

            <div style={styles.roleHelp}>
              Students can post, message, follow and join communities. Community admins
              can manage community spaces. Moderators can handle reports. Admins can
              manage roles and moderation.
            </div>

            {users.map((item) => (
              <div key={item.id} style={styles.userRow}>
                <div>
                  <strong style={styles.userName}>{item.username}</strong>
                  <div style={styles.userMeta}>
                    {item.first_name} {item.last_name}
                  </div>
                </div>

                <select
                  value={item.role}
                  onChange={(event) => updateRole(item.id, event.target.value)}
                  style={styles.roleSelect}
                  disabled={Number(item.id) === Number(user.id)}
                >
                  <option value="student">student</option>
                  <option value="community_admin">community_admin</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            ))}
          </div>
        )}
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
  panel: {
    maxWidth: "760px",
    margin: "0 auto",
    marginBottom: "20px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "22px"
  },
  title: {
    margin: "0 0 18px",
    color: "#111827"
  },
  muted: {
    color: "#6b7280"
  },
  report: {
    borderTop: "1px solid #eef2f7",
    padding: "16px 0"
  },
  content: {
    color: "#111827"
  },
  reason: {
    color: "#6b7280",
    marginTop: "8px"
  },
  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "12px"
  },
  deleteButton: {
    border: 0,
    borderRadius: "8px",
    background: "#ef4444",
    color: "#fff",
    padding: "9px 14px",
    fontWeight: 700,
    cursor: "pointer"
  },
  ignoreButton: {
    border: 0,
    borderRadius: "8px",
    background: "#e5e7eb",
    color: "#111827",
    padding: "9px 14px",
    fontWeight: 700,
    cursor: "pointer"
  },
  roleHelp: {
    color: "#6b7280",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "12px"
  },
  userRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    borderTop: "1px solid #eef2f7",
    padding: "12px 0"
  },
  userName: {
    color: "#111827"
  },
  userMeta: {
    color: "#6b7280",
    fontSize: "13px"
  },
  roleSelect: {
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "8px 10px",
    background: "#fff",
    color: "#111827"
  }
};
