import { memo } from "react";

function ChatMessage({
  msg,
  prev,
  isMe,
  profilePic,
  formatDay,
  formatTime,
  loadedImages,
  handleImageLoad,
  setViewImage,
  setViewerLoading,
  reactionMsg,
  sendReaction,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleHoldStart,
  handleHoldEnd,
  setReplyMsg,
  setReactionMsg
}) {

  const showDay =
  !prev || formatDay(prev.created_at) !== formatDay(msg.created_at);

  return (
    <div>

      {showDay &&
      <div className="date-divider">
          <span>{formatDay(msg.created_at)}</span>
        </div>
      }

      <div
        className={`msg-row ${isMe ? "msg-me" : "msg-them"}`}
        onTouchStart={(e) => {
          handleTouchStart(e, msg);
          handleHoldStart(msg);
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          handleHoldEnd();
        }}>
        

        {!isMe && <img src={profilePic} className="msg-avatar" alt="" />}

        <div className={`msg-bubble ${isMe ? "bubble-me" : "bubble-them"}`}>

          {!isMe &&
          <div
            className={`reaction-menu ${reactionMsg?.id === msg.id ? "show" : ""}`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}>
            
              <span onClick={() => sendReaction("❤️")}>❤️</span>
              <span onClick={() => sendReaction("😂")}>😂</span>
              <span onClick={() => sendReaction("👍")}>👍</span>
              <span onClick={() => sendReaction("😭")}>😭</span>
            </div>
          }

          {msg.reply_to &&
          <div className="reply-bubble">{msg.reply_to}</div>
          }

          {msg.image &&
          <div className="msg-image-wrap">
              {!loadedImages[msg.id] &&
            <div className="msg-image-skeleton"></div>
            }

              <img
              src={msg.image}
              className="msg-image"
              loading="lazy"
              decoding="async"
              onClick={() => {
                setViewImage(msg.image);
                setViewerLoading(true);
              }}
              onLoad={() => handleImageLoad(msg.id)}
              style={{ opacity: loadedImages[msg.id] ? 1 : 0 }}
              alt="" />
            
            </div>
          }

          <div className="msg-text">{msg.text}</div>
          <div className="msg-time">{formatTime(msg.created_at)}</div>

          {isMe &&
          <div className="msg-status">
              {msg.status === "sending" && "Sending..."}
              {msg.status === "failed" && "Failed ❌"}
              {msg.status !== "sending" && msg.status !== "failed" && (
            msg.seen ? "Seen" : "Sent")
            }
            </div>
          }

          {msg.reaction &&
          <div className="msg-reaction">{msg.reaction}</div>
          }

        </div>

        {!isMe &&
        <div className="pc-actions">

            <button
            className="pc-btn"
            onClick={(e) => {
              e.stopPropagation();
              setReactionMsg(msg);
            }}>
            
              <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              className="pc-icon"
              aria-hidden="true">
              
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-4 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM12 17.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" />
              </svg>
            </button>

            <button
            className="pc-btn"
            onClick={(e) => {
              e.stopPropagation();
              setReplyMsg(msg);
            }}>
            
              ↩
            </button>

          </div>
        }

      </div>

    </div>);

}

export default memo(ChatMessage);