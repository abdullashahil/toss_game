
// const express = require('express');
// const http = require('http');
// const cors = require('cors');
// const { registerSocketHandlers } = require('./sockets');

// require('dotenv').config();

// const app = express();
// // Middlewares
// app.use(cors());
// app.use(express.json());

// // Basic route
// app.get('/', (req, res) => {
//   res.send('API Running...');
// });

// const server = http.createServer(app);

// // initialize Socket.IO inside our socket module
// registerSocketHandlers(server);

// const PORT = process.env.PORT || 6000;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const express = require('express');
const http = require('http');
const cors = require('cors');
const { registerSocketHandlers } = require('./sockets');
require('dotenv').config();

const app = express();
// Middlewares
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('API Running...');
});

const server = http.createServer(app);

// initialize Socket.IO inside our socket module
registerSocketHandlers(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

