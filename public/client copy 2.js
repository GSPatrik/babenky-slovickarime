const socket = io();

const wordDisplay = document.getElementById("word-display-text");
const submitBtn = document.getElementById('submit-btn');
const nSenSubBtn = document.getElementById('nSenSub');
const input = document.getElementById('word');

const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const roomCode = urlParams.get('room');

const waitText = document.getElementById("wait-turn"); // pridaj do HTML nejaký <div id="wait-text"></div>



socket.emit("join room", { username, roomCode });

// Stav, či môžeš písať - bez turnov teraz len true
let canPlay = true;



// Čistý chat - pridávanie správ do wordDisplay
// socket.on('chat message', (msg) => {
//   wordDisplay.textContent += msg + " ";
//   console.log("New message received:", msg);
// });

socket.on('chat message', ({ username, message }) => {
    wordDisplay.textContent += message + " ";
    console.log("New message received:", message);
});


// Nová veta - vyčistí text
socket.on('start new sentence', () => {
    wordDisplay.textContent = "";
});

// Stop writing - schová inputy a tlačidlá
socket.on('do-story-end', () => {
  document.getElementById('input-words').style.display = 'none';
  document.getElementById('stop-writing').style.display = 'none';
});

// Zoznam používateľov
socket.on("user list", (users) => {
  const list = document.getElementById("user-list");
  list.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u;
    list.appendChild(li);
  });
});

// Info o miestnosti - tu zobrazujeme admina a ovládame START button
socket.on('room info', ({ admin }) => {
  const adminDisplay = document.getElementById('admin-display');
  if (adminDisplay) {
    adminDisplay.textContent = `Admin: ${admin}`;
  }

  const startBtn = document.getElementById('start-game-btn');

  // Pridáme listener len raz, aby sa nepridával zbytočne viackrát
  if (!startBtn.listenerAdded) {
    startBtn.addEventListener('click', () => {
      socket.emit('start game');
      startBtn.disabled = true;
    });
    startBtn.listenerAdded = true;
  }

  // Ukážeme START button iba adminovi
  if (admin === username) {
    startBtn.style.display = 'block';
    startBtn.disabled = false;
  } else {
    startBtn.style.display = 'none';
  }
});

// Submit button - posielanie správy bez refreshu
// submitBtn.addEventListener('click', (e) => {
//   e.preventDefault();
//   console.log("Submit button clicked", input.value.trim());
//     socket.emit('chat message', input.value.trim() + ".");

//     input.value = '';
  
// });
// submitBtn.addEventListener("click", (e) => {
// //   e.preventDefault();

//   const msg = input.value.trim();
//   if (msg.length === 0) return;
//     if (msg !== "") {
//         socket.emit('chat message', msg); // Neposielaj roomCode, už ho má server
//         console.log("Posielam správu na server:", msg);

//         input.value = '';
//     }
// //   socket.emit('chat message', { message: input.value.trim(), roomCode: roomCode });
// // //   socket.emit("chat message", msg);

// });

// submitBtn.addEventListener('click', (e) => {
//   e.preventDefault();
//   const msg = input.value.trim();
//   if (msg !== "") {
//     socket.emit('chat message', msg); // Neposielaj roomCode, už ho má server
//     input.value = '';
//   }
// });

// submitBtn.addEventListener('click', (e) => {
//   e.preventDefault();
//   const msg = input.value.trim();

//   if (msg !== "") {
//     socket.emit('chat message', {
//       message: msg,
//       roomCode: roomCode
//     });
//     input.value = '';
//   }
// });

submitBtn.onclick = () => {
  if (!canPlay) return;  // nemôžeš písať, takže nedovoľ odoslať
  const msg = input.value.trim();
  if (msg) {
    socket.emit("chat message", msg);
    input.value = "";
  }
};


// New sentence button - pošle správu a event pre novú vetu
// nSenSubBtn.addEventListener('click', (e) => {
//   e.preventDefault();
//   if (input.value.trim() !== '' && canPlay) {
//     socket.emit('chat message', {
//       message: input.value.trim() + "."
//     });
//     socket.emit('new sentence');
//     input.value = '';
//   }
// });

// Stop writing button
document.getElementById("stop-writing").addEventListener('click', () => {
  socket.emit('story end');
});

// Zakážeme zadávanie medzier a bodiek, plus autofokus
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

socket.on('your turn', () => {
    canPlay = true;
    submitBtn.disabled = false;
    document.getElementById("word").disabled = false;

    waitText.textContent = "It's your turn!";

    waitText.style.color = "green";
  });
  
  socket.on('wait turn', () => {
      canPlay = false;
      submitBtn.disabled = true;
      waitText.textContent = "It is currently not your turn.";
  });



console.log("Client connected as:", username, "in room:", roomCode);
