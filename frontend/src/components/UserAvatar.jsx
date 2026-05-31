export default function UserAvatar({
  user,
  username,
  src,
  size = 52,
  className = ""
}) {
  const displayName = username || user?.username || "";
  const imageUrl = src || user?.profile_picture || "";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1877f2, #4f46e5)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: `${Math.max(13, Math.round(size * 0.34))}px`,
    overflow: "hidden",
    flexShrink: 0
  };

  if (imageUrl) {
    return (
      <div className={className} style={style}>
        <img
          src={imageUrl}
          alt={displayName ? `${displayName} avatar` : "User avatar"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
            event.currentTarget.parentElement.textContent = initial;
          }}
        />
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {initial}
    </div>
  );
}
