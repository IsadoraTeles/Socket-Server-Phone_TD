const ws = new WebSocket('wss://phone-td.onrender.com:443');

let px = 50; // Position x and y
let py = 50;
let vx = 0.0; // Velocity x and y
let vy = 0.0;
let x = 0.0;
let y = 0.0;
let mobile = false;
const updateRate = 1/60; // Sensor refresh rate

let rotation_degrees = 0;
let frontToBack_degrees = 0;
let leftToRight_degrees = 0;

var isDragging = false;
let clientId = 0;

let red;
let green;
let blue;

let redSlider, greenSlider, blueSlider;
let colorR = 127, colorG = 127, colorB = 127;

let w = 1000;
let h = 1000;


ws.onopen = function () 
{
  console.log('Connected to the server.');
};


ws.onmessage = function (event) 
{
    let data = JSON.parse(event.data);
    let stringifiedData = data.toString();

    if(stringifiedData === 'ping') 
    {
        ws.send('pong');
        console.log('got ping, sent pong');
        return;
    }

    if (data.type === 'sensorData') {
        let id = data.id;
        let valPX = data.px;
        let valPY = data.py;
        let valueGamma = data.g;
        let valColR = data.red; 
        let valColG = data.green;
        let valColB = data.blue;
        console.log('Got : ', id, valPX, valPY, valueGamma, valColR, valColG, valColB);

        fill(valColR, valColG, valColB); // Use ellipseColor for fill color
        ellipse(valPX, valPY, 20, 20);
      }
    
      if (data.type === 'mouseData') {
        let id = data.id;
        let valX = data.x;
        let valY = data.y;
        let valColR = data.red; 
        let valColG = data.green;
        let valColB = data.blue;
        console.log('Got : ', id, valX, valY, valColR, valColG, valColB);

        fill(valColR, valColG, valColB); // Use ellipseColor for fill color
        ellipse(valX, valY, 20, 20);
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

// Listen for changes in page visibility
document.addEventListener('visibilitychange', function() 
{
    if (!isPageVisible()) 
    {
      // If the page is not visible, close the socket connection
      ws.send(JSON.stringify({'type': 'clientOUT', 'id' : clientId}));
      ws.close();
    } 
    else 
    {
      // If the page is visible, reconnect to the socket server
      connect();
    }
}, false);
  
ws.addEventListener('message', (event) => 
{
    const data = JSON.parse(event.data);
    if (data.type === 'client-id') 
    {
        clientId = data.id;
        console.log(`Received client ID: ${clientId}`);
    }
});

// Check if the device is a mobile phone
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// If the device is a mobile phone, listen for sensor data
if (isMobile) 
{
    mobile = true;

    function handleOrientation(event) 
    {
        rotation_degrees = event.alpha;
        frontToBack_degrees = event.beta;
        leftToRight_degrees = event.gamma;
        let smoothing_factor = 0.2; // Adjust this between 0 (no smoothing) and 1 (maximum smoothing)

        // Calculate the new velocities and apply smoothing
        let new_vx = leftToRight_degrees * updateRate * 0.5;
        let new_vy = frontToBack_degrees * updateRate;
        vx = vx * smoothing_factor + new_vx * (1 - smoothing_factor);
        vy = vy * smoothing_factor + new_vy * (1 - smoothing_factor);

        // Update position and clip it to bounds
        px += vx * 0.2;
        if (px > width || px < 0) 
        { 
            px = Math.max(0, Math.min(w, px)); // Clip px between 0-398
            vx = 0;
        }

        py += vy * 0.2;
        if (py > height || py < 0) 
        {
            py = Math.max(0, Math.min(h, py)); // Clip py between 0-398
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

    // function handleOrientation(event) 
    // {
    //     rotation_degrees = event.alpha;
    //     frontToBack_degrees = event.beta;
    //     leftToRight_degrees = event.gamma;

    //     // Update velocity according to how tilted the phone is
    //     // Since phones are narrower than they are long, double the increase to the x velocity
    //     vx += leftToRight_degrees * updateRate * 0.5; 
    //     vy += frontToBack_degrees * updateRate;

    //     // Update position and clip it to bounds
    //     px += vx * 0.2;
    //     if (px > width || px < 0) 
    //     { 
    //         px = Math.max(0, Math.min(w, px)); // Clip px between 0-398
    //         vx = 0;
    //     }

    //     py += vy * 0.2;
    //     if (py > height || py < 0) 
    //     {
    //         py = Math.max(0, Math.min(h, py)); // Clip py between 0-398
    //         vy = 0;
    //     }

    //     ws.send(
    //       JSON.stringify({
    //         'type': "sensorData",
    //         'id': clientId,
    //         'px': px,
    //         'py': py,
    //         'g': leftToRight_degrees,
    //         'red' : red.value(),
    //         'green' : green.value(),
    //         'blue' : blue.value()
    //       })
    //     );
    // }

    // Request permission to use device sensor
    
    function requestSensorPermission() 
    {
        if 
        (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
        ) 
        {
            // iOS 13+
            DeviceOrientationEvent.requestPermission().then((response) => 
            {
                if (response == "granted") 
                {
                window.addEventListener("deviceorientation", handleOrientation);
                }
            });
        } 
        else 
        {
            window.addEventListener("deviceorientation", handleOrientation);
        }
    }
    
  // Call requestSensorPermission to ask for permission
  requestSensorPermission();
  
}

else
{
    mobile = false;

    document.addEventListener('mousedown', function(event) 
    {
        isDragging = true;
    });
      
    document.addEventListener('mouseup', function(event)
    {
        isDragging = false;
    });

    document.addEventListener('mousemove', function(event) 
    {
        if (isDragging) 
        {
            // Get the x and y coordinates of the mouse
            x = event.clientX;
            y = event.clientY;
        
            //console.log("Mouse clicked at position: x=" + x + ", y=" + y);
            ws.send(JSON.stringify({
                'type': 'mouseData', 
                'id' : clientId , 
                'x': x, 
                'y': y,
                'red' : colorR,
                'green' : colorG,
                'blue' : colorB 
            }));
            console.log('sending : ', clientId, x, y, red.value(), green.value(), blue.value());
        }
    });
}

const sensorButton = document.getElementById('sensor-button');

sensorButton.addEventListener('click', function() 
{
    requestSensorPermission();
});


function setup() 
{
    createCanvas(w, h);
    background(0);

    let sliderWidth = window.innerWidth * 0.4;
    let sliderHeight = 20;

    // get HTML elements
    redSlider = document.getElementById("red-slider");
    greenSlider = document.getElementById("green-slider");
    blueSlider = document.getElementById("blue-slider");

    // event listeners for sliders and button
    redSlider.addEventListener("input", updateColor);
    greenSlider.addEventListener("input", updateColor);
    blueSlider.addEventListener("input", updateColor);

    ellipseMode(CENTER);
}

function updateColor() 
{
    colorR = redSlider.value;
    colorG = greenSlider.value;
    colorB = blueSlider.value;
}
  
function draw() 
{
    if(mobile)
    {
        fill(colorR, colorG, colorB);
        ellipse(px, py, 50, 50);
    }

    else if (!mobile && isDragging)
    {
        fill(colorR, colorG, colorB);
        ellipse(x, y, 50, 50);
    }
}

