import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import UserAvatar from "../components/UserAvatar";
import "./Messages.css";

const API_BASE = "http://localhost:8888/connecthub1/backend/api";

export default function Messages() {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [content, setContent] = useState("");

  async function loadUsers() {
    try {
      const response = await fetch(`${API_BASE}/get_users.php`);
      const data = await response.json();

      if (data.success) {
        setUsers(
          data.users.filter(
            (item) => Number(item.id) !== Number(user.id)
          )
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchMessages(conversation) {
    try {
      const response = await fetch(
        `${API_BASE}/get_messages.php?conversation_id=${conversation}`
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    fetchMessages(conversationId);

    const interval = setInterval(() => {
      fetchMessages(conversationId);
    }, 2000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const openChat = async (otherUser) => {
    try {
      const response = await fetch(
        `${API_BASE}/get_or_create_conversation.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user1: user.id,
            user2: otherUser.id
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setSelectedUser(otherUser);
        setConversationId(data.conversation_id);
        fetchMessages(data.conversation_id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!content.trim() || !conversationId) return;

    try {
      const response = await fetch(`${API_BASE}/send_message.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: user.id,
          message: content
        })
      });

      const data = await response.json();

      if (data.success) {
        setContent("");
        fetchMessages(conversationId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Navbar />

      <div className="messages-page">
        <div className="conversations-sidebar">
          <div className="sidebar-header">Messages</div>

          {users.map((item) => (
            <div
              key={item.id}
              className={`conversation-item ${
                selectedUser?.id === item.id ? "active-conversation" : ""
              }`}
              onClick={() => openChat(item)}
            >
              <UserAvatar
                user={item}
                size={50}
                className="conversation-avatar"
              />

              <div>
                <div className="conversation-name">{item.username}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-container">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <UserAvatar
                  user={selectedUser}
                  size={50}
                  className="conversation-avatar"
                />

                <div>{selectedUser.username}</div>
              </div>

              <div className="messages-container">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      Number(msg.sender_id) === Number(user.id)
                        ? "message own-message"
                        : "message other-message"
                    }
                  >
                    <div className="message-content">{msg.message}</div>
                  </div>
                ))}
              </div>

              <form className="message-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />

                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="empty-chat">Select a user to start chatting</div>
          )}
        </div>
      </div>
    </>
  );
}
