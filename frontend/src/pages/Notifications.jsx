import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const user =
    JSON.parse(localStorage.getItem("user")) || {};

  async function fetchNotifications() {
    try {
      const response = await fetch(
        `http://localhost:8888/connecthub1/backend/api/get_notifications.php?user_id=${user.id}`
      );

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
      }
      await fetch(
  "http://localhost:8888/connecthub1/backend/api/read_notifications.php",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `user_id=${user.id}`
  }
);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (user.id) {
      fetchNotifications();

      const interval = setInterval(() => {
        fetchNotifications();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth: "900px",
          margin: "40px auto",
          padding: "0 20px",
          minHeight: "calc(100vh - 110px)"
        }}
      >
        <h2
          style={{
            marginBottom: "25px"
          }}
        >
          Notifications
        </h2>

        {notifications.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              color: "#6b7280"
            }}
          >
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                background: Number(notification.is_read) ? "#fff" : "#eef6ff",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "12px",
                border: Number(notification.is_read)
                  ? "1px solid #e5e7eb"
                  : "1px solid #bfdbfe",
                boxShadow:
                  "0 2px 8px rgba(0,0,0,.05)"
              }}
            >
              <div
                style={{
                  color: "#111827",
                  fontWeight: 700
                }}
              >
                {notification.message}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                {new Date(
                  notification.created_at
                ).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
