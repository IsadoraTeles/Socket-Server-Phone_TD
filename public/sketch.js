


const ws = new WebSocket('wss://phone-td.onrender.com:443');

let px = 25; // Position x and y
let py = 25;
let vx = 0.0; // Velocity x and y
let vy = 0.0;
let x = 0.0;
let y = 0.0;
let mobile = false;
const updateRate = 1/60; // Sensor refresh rate

var isDragging = false;
let clientId = 0;

// let colorR = Math.floor(Math.random() * 256);
// let colorG = Math.floor(Math.random() * 256);
// let colorB = Math.floor(Math.random() * 256);

let colorR = 255;
let colorG = 255;
let colorB = 255;
 
let canvas;

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

ws.onopen = function () 
{
  console.log('Connected to the server.');

};

ws.onmessage = function (event) 
{
    const data = JSON.parse(event.data);

    let stringifiedData = data.toString();

    if(stringifiedData === 'ping') 
    {
        ws.send('pong');
        console.log('got ping, sent pong');
        return;
    }

    if (data.type === 'sensorData') 
    {
        let id = data.id;
        let valPX = data.px;
        let valPY = data.py;
        let valueGamma = data.g;
        let valColR = data.red; 
        let valColG = data.green;
        let valColB = data.blue;
        console.log('Got : ', id, valPX, valPY, valueGamma, valColR, valColG, valColB);

        fill(valColR, valColG, valColB); // Use ellipseColor for fill color
        ellipse(valPX, valPY, 15, 15);
      }
    
      if (data.type === 'mouseData') 
      {
        let id = data.id;
        let valX = data.x;
        let valY = data.y;
        let valColR = data.red; 
        let valColG = data.green;
        let valColB = data.blue;
        console.log('Got : ', id, valX, valY, valColR, valColG, valColB);

        fill(valColR, valColG, valColB); // Use ellipseColor for fill color
        ellipse(valX, valY, 15, 15);
      }
};

ws.onerror = function (error) 
{
  console.error('WebSocket error:', error);
};

ws.onclose = function () 
{
  console.log('Disconnected from the server.');
  ws.send(JSON.stringify({'type': 'clientOUT', 'id' : clientId}));
};

function handleVisibilityChange() 
{
    if (document.hidden) 
    {
        if (ws.readyState === WebSocket.OPEN) 
        {
            ws.send(JSON.stringify({'type': 'clientOUT', 'id': clientId}));
        }
    } 
    else 
    {
        if (ws.readyState === WebSocket.CLOSED) 
        {
            setupWebSocket();
        }
    }
}

document.addEventListener('visibilitychange', handleVisibilityChange, false);
  
ws.addEventListener('message', (event) => 
{
    const data = JSON.parse(event.data);
    if (data.type === 'client-id') 
    {
        clientId = data.id;
        console.log(`Received client ID: ${clientId}`);
    }
});

window.addEventListener('beforeunload', () => 
{
    if (ws.readyState === WebSocket.OPEN) 
    {
        ws.send(JSON.stringify({'type': 'clientOUT', 'id': clientId}));
    }
});

// If the device is a mobile phone, listen for sensor data
if (isMobile) 
{
    mobile = true;

    function handleOrientation(event) 
    {
        let smoothing_factor = 0.9; // Adjust this between 0 (no smoothing) and 1 (maximum smoothing)
        let scale_factor = 0.8; // Scale factor for adjusting sensor data range to canvas range

        let new_vx = 0, new_vy = 0;

        // Check if accelerationIncludingGravity is available
        if(event.accelerationIncludingGravity.x !== null && event.accelerationIncludingGravity.y !== null) 
        {
            // Calculate the new velocities based on accelerationIncludingGravity
            // Here, we don't multiply by updateRate because acceleration is already a rate of change
            // Also, swap x and y to match screen dimensions, and reverse the direction
            new_vx = -event.accelerationIncludingGravity.x * scale_factor;
            new_vy = event.accelerationIncludingGravity.y * scale_factor;
        }

        // Apply smoothing
        vx = vx * smoothing_factor + new_vx * (1 - smoothing_factor);
        vy = vy * smoothing_factor + new_vy * (1 - smoothing_factor);

        // Update position and clip it to bounds
        px += vx;

        if (px > width || px < 0) 
        { 
            px = Math.max(0, Math.min(width, px)); // Clip 
            vx = 0;
        }

        py += vy;
        if (py > height || py < 0) 
        {
            py = Math.max(0, Math.min(height, py)); // Clip
            vy = 0;
        }

        ws.send(
        JSON.stringify({
            'type': "sensorData",
            'id': clientId,
            'px': px,
            'py': py,
            'g': leftToRight_degrees,
            'red' : colorR,
            'green' : colorG,
            'blue' : colorB 
        })
        );
    }
    
    function requestSensorPermission() 
    {
        if 
        (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function"
        ) 
        {
            // iOS 13+
            DeviceMotionEvent.requestPermission().then((response) => 
            {
                if (response == "granted") 
                {
                window.addEventListener("devicemotion", handleOrientation);
                }
            });
        } 
        else 
        {
            window.addEventListener("devicemotion", handleOrientation);
        }
    }
    
  // Call requestSensorPermission to ask for permission
  requestSensorPermission();
  
}

else
{
    mobile = false;

    //const canvas = document.getElementById('defaultCanvas0');
    //const canvasRect = canvas.getBoundingClientRect();

    document.addEventListener('mousedown', function(event) 
    {
        const canvasRect = canvas.elt.getBoundingClientRect();
        const mouseX = event.clientX - canvasRect.left;
        const mouseY = event.clientY - canvasRect.top;
        if (checkMouseInsideEllipse(mouseX, mouseY)) 
        {
          isDragging = true;
          x = mouseX;
          y = mouseY;
        }
    });
      
    document.addEventListener('mousemove', function(event) 
    {
        if (isDragging) 
        {
          const canvasRect = canvas.elt.getBoundingClientRect();
          x = event.clientX - canvasRect.left;
          y = event.clientY - canvasRect.top;
          ws.send(JSON.stringify(
            {
            'type': 'mouseData',
            'id': clientId,
            'x': x,
            'y': y,
            'red': colorR,
            'green': colorG,
            'blue': colorB
          }));
        }
      });
      
    document.addEventListener('mouseup', function(event) 
    {
        isDragging = false;
    });

    function checkMouseInsideEllipse(mouseX, mouseY) 
    {
        const dx = mouseX - px;
        const dy = mouseY - py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 12.5; // Considering the radius of the ellipse is 12.5 (half of 25)
    }
}

const sensorButton = document.getElementById('sensor-button');

sensorButton.addEventListener('click', function() 
{
    requestSensorPermission();
});


function setup() 
{
    canvas = createCanvas(windowWidth * 0.7, windowHeight * 0.5);
    canvas.parent('canvas-container'); // Attach the canvas to the container div
    background(0);
    
    ellipseMode(CENTER);
}

  
function draw() 
{
    background(0); // Clear the canvas on each draw cycle
  
    if(mobile) 
    {
        // For mobile, we directly use px and py for ellipse position
        fill(colorR, colorG, colorB);
        ellipse(px, py, 25, 25);
    } 
    else 
    {
        // For desktop, we only draw when dragging is true
        if (isDragging) 
        {
        fill(colorR, colorG, colorB);
        ellipse(x, y, 25, 25);
        }
    }
}

function windowResized() 
{
    resizeCanvas(windowWidth * 0.7, windowHeight * 0.5);
}
