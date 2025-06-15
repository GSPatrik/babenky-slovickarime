const socket = io();

const usernameInput = document.getElementById("username");
const roomCodeInput = document.getElementById("roomCode");
const joinBtn = document.getElementById("joinBtn");

const chatSection = document.getElementById("chatSection");
const chat = document.getElementById("chat");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");




joinBtn.onclick = () => {
  const username = usernameInput.value.trim();
  const roomCode = roomCodeInput.value.trim();
  if (!username || !roomCode) return;

  socket.emit("join room", { username, roomCode });
  chatSection.style.display = "block";
};

sendBtn.onclick = () => {
  const msg = messageInput.value.trim();
  if (msg) {
    socket.emit("chat message", msg);
    messageInput.value = "";
  }
};

socket.on("chat message", ({ username, message }) => {
    console.log(`${username}: ${message}`);
    console.log(socket.turnIndex);
  const p = document.createElement("p");
  p.textContent = `${username}: ${message}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
});
