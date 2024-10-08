


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

let colorR = Math.floor(Math.random() * 256);
let colorG = Math.floor(Math.random() * 256);
let colorB = Math.floor(Math.random() * 256);

// let colorR = 255;
// let colorG = 255;
// let colorB = 255;
 
let canvas;
let isMouseOverEllipse = false;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function mapValue(value, fromLow, fromHigh, toLow, toHigh) 
{
    return toLow + ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow);
}

ws.onopen = function () 
{
  console.log('Connected to the server.');

};

ws.onmessage = function (event) 
{
    try 
    {
        let data = JSON.parse(event.data);
        switch (data.type) 
        {
            case 'ping':
                ws.send('pong');
                console.log('got ping, sent pong');
                break;

            case 'sensorData':
                handleSensorData(data);
                break;

            case 'mouseData':
                handleMouseData(data);
                break;

            default:
                console.log('Received unknown message type:', data.type);
        }
    } 

    catch (error) 
    {
        console.error('Error processing message:', error);
    }
};

function handleSensorData(data) 
{
    let id = data.id;
    let valPX = data.px;
    let valPY = data.py;
    let valueGamma = data.g;
    let valColR = data.red;
    let valColG = data.green;
    let valColB = data.blue;

    console.log('Got : ', id, valPX, valPY, valueGamma, valColR, valColG, valColB);

    let mappedPX = mapValue(valPX, 0, 512, 0, width);
    let mappedPY = mapValue(valPY, 0, 288, 0, height);
    fill(valColR, valColG, valColB);
    ellipse(mappedPX, mappedPY, 15, 15);
}

function handleMouseData(data) 
{
    let id = data.id;
    let valX = data.px;
    let valY = data.py;
    let valColR = data.red;
    let valColG = data.green;
    let valColB = data.blue;

    console.log('Got : ', id, valX, valY, valColR, valColG, valColB);
    let mappedX = mapValue(valX, 0, 512, 0, width);
    let mappedY = mapValue(valY, 0, 288, 0, height);

    // Use mappedX and mappedY for drawing
    fill(valColR, valColG, valColB);
    ellipse(mappedX, mappedY, 15, 15);
}

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
        let smoothing_factor = 0; // Adjust this between 0 (no smoothing) and 1 (maximum smoothing)
        let scale_factor = 3; // Scale factor for adjusting sensor data range to canvas range
        let damping_factor = 1; // Damping factor to gradually reduce velocity

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

        // Apply damping
        vx *= damping_factor;
        vy *= damping_factor;

        // Update position and clip it to bounds
        px += vx * updateRate;
        px = Math.max(0, Math.min(width, px)); // Clip to bounds

        py += vy * updateRate;
        py = Math.max(0, Math.min(height, py)); // Clip to bounds

        ws.send(
        JSON.stringify({
            'type': "sensorData",
            'id': clientId,
            'px': px,
            'py': py,
            'g': 0,
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

    function handleMouseDown(event) 
    {
        const canvasRect = canvas.elt.getBoundingClientRect();
        const mouseX = event.clientX - canvasRect.left;
        const mouseY = event.clientY - canvasRect.top;
        
        if (checkMouseInsideEllipse(mouseX, mouseY)) 
        {
            isDragging = true;
            isMouseOverEllipse = true;
            px = mouseX;
            py = mouseY;
        }
    }
      
    function handleMouseMove(event) 
    {
        if (isMouseOverEllipse || isDragging) 
        {
          const canvasRect = canvas.elt.getBoundingClientRect();
          px = event.clientX - canvasRect.left;
          py = event.clientY - canvasRect.top;
      
          if (px >= 0 && px <= width && py >= 0 && py <= height) 
          {
            if (isDragging) 
            {
              ws.send(JSON.stringify({
                'type': 'mouseData',
                'id': clientId,
                'px': px,
                'py': py,
                'red': colorR,
                'green': colorG,
                'blue': colorB
              }));
              
              fill(colorR, colorG, colorB);
              ellipse(px, py, 25, 25);
            }
          }
        }
      }
      
      
    function handleMouseUp() 
    {
        isDragging = false;
        isMouseOverEllipse = false;
    }

    function handleMouseOver() 
    {
        isMouseOverEllipse = true;
    }

    function handleMouseOut() 
    {
        isMouseOverEllipse = false;
    }

    function checkMouseInsideEllipse(mouseX, mouseY) 
    {
        const dx = mouseX - px;
        const dy = mouseY - py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 12.5; // Considering the radius of the ellipse is 12.5 (half of 25)
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
}

const sensorButton = document.getElementById('sensor-button');

sensorButton.addEventListener('click', function() 
{
    requestSensorPermission();
});

function setup() 
{
    canvas = createCanvas(288, 512);

    canvas.parent('canvas-container'); // Attach the canvas to the container div
    background(0);
    fill(255);
}

function draw() 
{
    if(mobile) 
    {
        fill(colorR, colorG, colorB);
        ellipse(px, py, 25, 25);
    }

    else 
    {
        if(isDragging)
        {
            fill(colorR, colorG, colorB);
            ellipse(px, py, 25, 25);
        }
        else
        {
            fill(255, 255, 255);
            ellipse(px, py, 30, 30);
        }
    }
}

// function windowResized() 
// {
//     resizeCanvas(windowWidth * 0.7, windowHeight * 0.5);
// }
