import React, { useState } from "react";
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from "react-icons/fa";
import "./CustomerChatbot.css";
import { API_URL } from "../../config/api";

const quickReplies = [
  "Book a haircut",
  "Book a facial",
  "What services do you offer?",
  "How do I reschedule?",
  "How can I contact support?",
];

const CustomerChatbot = ({ customerName = "Customer" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: `Hi ${customerName}! I’m your EliteSalon assistant. I can help with bookings, services, and support.`,
    },
  ]);

  const sendMessage = async (messageText) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/customer/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await response.json();
      const botReply =
        data?.reply || "Sorry, I couldn’t understand that. Please try again.";

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: botReply,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "I’m having trouble connecting right now. Please try again.",
        },
      ]);
    }

    setInput("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="customer-chatbot-wrap">
      {!isOpen && (
        <button
          type="button"
          className="customer-chatbot-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open customer chatbot"
        >
          <FaCommentDots className="chatbot-launcher-icon" />
          <span>Need Help?</span>
        </button>
      )}

      {isOpen && (
        <div className="customer-chatbot-panel">
          <div className="customer-chatbot-header">
            <div className="customer-chatbot-title-wrap">
              <div className="customer-chatbot-avatar">
                <FaRobot />
              </div>
              <div>
                <h4>EliteSalon Assistant</h4>
                <small>Online</small>
              </div>
            </div>

            <button
              type="button"
              className="customer-chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              <FaTimes />
            </button>
          </div>

          <div className="customer-chatbot-body">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${
                  message.sender === "user" ? "user" : "bot"
                }`}
              >
                <div className="chat-bubble">{message.text}</div>
              </div>
            ))}
          </div>

          <div className="customer-chatbot-quick-replies">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                className="quick-reply-btn"
                onClick={() => sendMessage(reply)}
              >
                {reply}
              </button>
            ))}
          </div>

          <form className="customer-chatbot-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              aria-label="Type your message"
            />
            <button type="submit" aria-label="Send message">
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    
    </div>
  );
};

export default CustomerChatbot;