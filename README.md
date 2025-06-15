//potrebujeme nainstalovat cez powershell express-session, mysql2, bcryptjs aby vsetko islo po masle :)

meno DB: login, table users a stories

users:

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255)
);

stories:

CREATE TABLE stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

