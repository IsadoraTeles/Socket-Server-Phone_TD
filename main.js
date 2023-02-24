const http = require("http");
const express = require("express");
const app = express();

app.use(express.static("public"));
// require("dotenv").config();

const serverPort = process.env.PORT || 3000;
const server = http.createServer(app);
const WebSocket = require("ws");

let keepAliveId;

const wss =
  process.env.NODE_ENV === "production"
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: 5001 });

server.listen(serverPort);
console.log(`Server started on port ${serverPort} in stage ${process.env.NODE_ENV}`);

wss.on("connection", function (ws, req) {
  console.log("Connection Opened");
  console.log("Client size: ", wss.clients.size);

  if (wss.clients.size === 1) {
    console.log("first connection. starting keepalive");
    keepServerAlive();
  }

  ws.on("message", (data) => 
  {
    let stringifiedData = data.toString();
    if (stringifiedData === 'pong') 
    {
      console.log('keepAlive');
      return;
    }

    try 
    {
      const jsonData = JSON.parse(stringifiedData);
      if (jsonData.type === 'sensorAccData') 
      {
        // Broadcast sensor data to all connected clients
        broadcast(ws, stringifiedData, false);
      }
      if (jsonData.type === 'sensorOrientationData') 
      {
        // Broadcast device orientation sensor data to all connected clients
        broadcast(ws, stringifiedData, false);
      }
    } 
    
    catch (error) 
    {
      console.error(error);
    }
  });

  ws.on("close", (data) => 
  {
    console.log("closing connection");

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
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } 
  else 
  {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) 
      {
        //if (jsonData.type === 'sensorAccData' || jsonData.type === 'sensorOrientationData') {
          client.send(message);
        //}
      }
    });
  }
};

/**
 * Sends a ping message to all connected clients every 50 seconds
 */
 const keepServerAlive = () => {
  keepAliveId = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('ping');
      }
    });
  }, 50000);
};


app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Add endpoint to receive sensor data from clients
app.post('/sensor-data', (req, res) => {
  const jsonData = req.body;
  if (jsonData.type === 'sensorAccData') {
    // Broadcast sensor data to all connected clients
    broadcast(null, JSON.stringify(jsonData), false);
  }
  res.send('Sensor data received');
});
