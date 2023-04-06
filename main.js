const http = require("http");
const express = require("express");
const app = express();

app.use(express.static("public"));
// require("dotenv").config();

const serverPort = process.env.PORT || 3000;
const server = http.createServer(app);
const WebSocket = require("ws");

let keepAliveId;

const clients = {};

const wss =
  process.env.NODE_ENV === "production"
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: 5001 });

server.listen(serverPort);
console.log(`Server started on port ${serverPort} in stage ${process.env.NODE_ENV}`);

wss.on("connection", function (ws, req) 
{
  console.log("Connection Opened");
  console.log("Client size: ", wss.clients.size);

  if (wss.clients.size === 1) 
  {
    console.log("first connection. starting keepalive");
    keepServerAlive();
  }

  const clientId = req.url.split('/')[1]; // Extract client ID from URL
  if (clientId) 
  {
    ws.clientId = clientId;
    clients[clientId] = ws;
    ws.send(JSON.stringify({ type: 'client-id', id: ws.clientId }));
  } 
  else 
  {
    ws.terminate(); // Close connection if no client ID
  }

  console.log(`Client connected with id ${ws.clientId}`);

  ws.on("message", (data) => 
  {
    let stringifiedData = data.toString();
    if (stringifiedData === 'pong') 
    {
      console.log('keepAlive');
      return;
    }
    broadcast(ws, stringifiedData, false);
  });

  ws.on("close", (data) => 
  {
    console.log("closing connection");

    delete clients[ws.clientId];
    console.log(`Client disconnected with id ${ws.clientId}`);

    if (wss.clients.size === 0) 
    {
      console.log("last client disconnected, stopping keepAlive interval");
      clearInterval(keepAliveId);
    }
  });
});

// Implement broadcast function because of ws doesn't have it
const broadcast = (ws, message, includeSelf) => 
{
  if (includeSelf) 
  {
    wss.clients.forEach((client) => 
    {
      if (client.readyState === WebSocket.OPEN) 
      {
        client.send(message);
      }
    });
  } 
  else 
  {
    wss.clients.forEach((client) => 
    {
      if (client !== ws && client.readyState === WebSocket.OPEN) 
      {
        client.send(message);
      }
    });
  }
};

/**
 * Sends a ping message to all connected clients every 50 seconds
 */
const keepServerAlive = () => 
{
  keepAliveId = setInterval(() => 
  {
    wss.clients.forEach((client) => 
    {
      if (client.readyState === WebSocket.OPEN) 
      {
        client.send('ping');
      }
    });
  }, 20000);
};


app.get('/', (req, res) => 
{
    res.send('Hello World!');
});


