const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const PATH = "./users.json";

const readUsers = () => JSON.parse(fs.readFileSync(PATH, "utf-8"));
const writeUsers = (data) => fs.writeFileSync(PATH, JSON.stringify(data, null, 2));

// 1. POST /user - Add user
app.post("/user", (req, res) => {
  const { name, age, email } = req.body;
  const users = readUsers();
  if (users.find((u) => u.email === email)) {
    return res.json({ message: "Email already exists." });
  }
  const newUser = { id: users.length + 1, name, age, email };
  users.push(newUser);
  writeUsers(users);
  res.json({ message: "User added successfully." });
});

// 2. PATCH /user/:id - Update user
app.patch("/user/:id", (req, res) => {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (index === -1) return res.json({ message: "User ID not found." });
  users[index] = { ...users[index], ...req.body };
  writeUsers(users);
  res.json({ message: "User age updated successfully." });
});

// 3. DELETE /user/:id - Delete user
app.delete("/user/:id", (req, res) => {
  let users = readUsers();
  const index = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (index === -1) return res.json({ message: "User ID not found." });
  users.splice(index, 1);
  writeUsers(users);
  res.json({ message: "User deleted successfully." });
});

// 4. GET /user/getByName - Get by name
app.get("/user/getByName", (req, res) => {
  const { name } = req.query;
  const users = readUsers();
  const user = users.find((u) => u.name === name);
  if (!user) return res.json({ message: "User name not found." });
  res.json(user);
});

// 5. GET /user - Get all users
app.get("/user", (req, res) => {
  res.json(readUsers());
});

// 6. GET /user/filter - Filter by minAge
app.get("/user/filter", (req, res) => {
  const minAge = parseInt(req.query.minAge);
  const users = readUsers();
  const filtered = users.filter((u) => u.age >= minAge);
  if (filtered.length === 0) return res.json({ message: "no user found" });
  res.json(filtered);
});

// 7. GET /user/:id - Get by ID
app.get("/user/:id", (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.json({ message: "User not found." });
  res.json(user);
});

app.listen(3000, () => console.log("Server running on port 3000"));