const socket = io();

const wordDisplay = document.getElementById("word-display-text");
const waitText = document.getElementById('wait-turn');
const submitBtn = document.getElementById('submit-btn');
const nSenSubBtn = document.getElementById('nSenSub');
const input = document.getElementById('word');
const textarea = input; // for compatibility with previous code

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const roomCode = urlParams.get('room');

document.getElementById('roomCodeB').value = roomCode;
socket.emit("join room", { username, roomCode });
let canPlay = true;

  
socket.on('turn changed', (currentTurnUser) => {
  if (currentTurnUser === username) {
    textarea.disabled = false;
    textarea.placeholder = "Si na rade, môžeš písať!";
  } else {
    textarea.disabled = true;
    textarea.placeholder = `Čakaj na svoj ťah (${currentTurnUser} píše)...`;
  }
});

console.log("Pripojený do miestnosti:", roomCode, "ako", username);

socket.on('your turn', () => {
  canPlay = true;
  submitBtn.disabled = false;
  input.disabled = false;
  waitText.textContent = "It's your turn!";
  waitText.style.color = "green";
});

socket.on('wait turn', (currentTurnUser) => {
  canPlay = false;
  submitBtn.disabled = true;
  input.disabled = true;
  waitText.textContent = `It is currently not your turn. (${currentTurnUser} píše)`;
  waitText.style.color = "red";
});

document.getElementById('submit-btn').addEventListener('click', (e) => {
  e.preventDefault();
  if (input.value.trim() !== '' && canPlay) {
    socket.emit('chat message', {
      message: input.value.trim()
    });
    input.value = '';
    canPlay = false;
    submitBtn.disabled = true;
    input.disabled = true;
    waitText.textContent = "It is currently not your turn.";
    waitText.style.color = "red";
  }
});

nSenSubBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (input.value.trim() !== '' && canPlay) {
    socket.emit('chat message', {
      message: input.value.trim() + "."
    });
    socket.emit('new sentence');
    input.value = '';
    canPlay = false;
    submitBtn.disabled = true;
    input.disabled = true;
    waitText.textContent = "It is currently not your turn.";
    waitText.style.color = "red";
  }
});

socket.on('chat message', (msg) => {
  wordDisplay.textContent += msg.message + " ";
});

socket.on('start new sentence', () => {
  wordDisplay.textContent = "";
});

document.getElementById("stop-writing").addEventListener('click', () => {
  socket.emit('story end');
});

socket.on('do-story-end', () => {
  document.getElementById('input-words').style.display = 'none';
  document.getElementById('turns').style.display = 'none';
  document.getElementById('stop-writing').style.display = 'none';
});

window.addEventListener('keydown', (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    alert("No spaces!");
  } else if (e.code === "Period") {
    e.preventDefault();
    alert("No periods!");
  }
  if (e.key.length === 1) {
    input.focus();
  }
});

socket.on("user list", (users) => {
  const list = document.getElementById("user-list");
  list.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u;
    list.appendChild(li);
  });
});

socket.on('room info', ({ admin }) => {
  const adminDisplay = document.getElementById('admin-display');
  if (adminDisplay) {
    adminDisplay.textContent = `Admin: ${admin}`;
  }
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      socket.emit('start game');
      startBtn.disabled = true;
    });
    if (admin === username) {
      startBtn.style.display = 'block';
      startBtn.disabled = false;
    } else {
      startBtn.style.display = 'none';
    }
  }
});

console.log(canPlay, "Can play status initialized.");
