const ws = new WebSocket('wss://phone-td.onrender.com:443');

let px = 25; // Position x and y
let py = 25;
let vx = 0.0; // Velocity x and y
let vy = 0.0;
let x = 0.0;
let y = 0.0;
const updateRate = 1 / 60; // Sensor refresh rate

let isDragging = false;
let clientId = 0;

let colorR = Math.floor(Math.random() * 256);
let colorG = Math.floor(Math.random() * 256);
let colorB = Math.floor(Math.random() * 256);

let canvas;
let canvasSize;

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function setupWebSocket() {
    ws.onopen = function () {
        console.log('Connected to the server.');
    };

    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === 'other-client-data') {
            // Handle data from other clients
        }
    };

    ws.onerror = function (error) {
        console.error('WebSocket error:', error);
    };

    ws.onclose = function () {
        console.log('Disconnected from the server.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange, false);
    
    ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'client-id') {
            clientId = data.id;
            console.log(`Received client ID: ${clientId}`);
        }
    });

    window.addEventListener('beforeunload', () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({'type': 'clientOUT', 'id': clientId}));
        }
    });
}

function handleVisibilityChange() {
    if (document.hidden) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({'type': 'clientOUT', 'id': clientId}));
        }
    } else {
        if (ws.readyState === WebSocket.CLOSED) {
            setupWebSocket();
        }
    }
}

setupWebSocket();

if (isMobile) {
    function handleOrientation(event) {
        // Mobile orientation handling code
        x = event.beta;  // In degree in the range [-180,180]
        y = event.gamma; // In degree in the range [-90,90]

        x = constrain(x, -90, 90);  // Constrain pitch to [-90,90]
        y = constrain(y, -90, 90);  // Constrain roll to [-90,90]

        x = map(x, -90, 90, 0, canvasSize);
        y = map(y, -90, 90, canvasSize, 0);
    }

    function requestSensorPermission() {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                }
            })
            .catch(console.error);
    }

    // Call requestSensorPermission to ask for permission
    requestSensorPermission();
} else {
    document.addEventListener('mousedown', function(event) {
        isDragging = checkMouseInsideEllipse(event.clientX, event.clientY);
    });

    document.addEventListener('mouseup', function(event) {
        isDragging = false;
    });

    document.addEventListener('mousemove', function(event) {
        if (isDragging) {
            px = event.clientX;
            py = event.clientY;
        }
    });

    function checkMouseInsideEllipse(mouseX, mouseY) {
        const dx = mouseX - px;
        const dy = mouseY - py;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 12.5; // Assuming the ellipse radius is 25/2 = 12.5
    }
}

function setup() {
    canvasSize = min(windowWidth, windowHeight) * 0.7;
    canvas = createCanvas(canvasSize, canvasSize);
    canvas.position((windowWidth - width) / 2, (windowHeight - height) / 2);
    background(0);

    ellipseMode(CENTER);
}

function draw() {
    background(0);  // Clear canvas each frame

    fill(colorR, colorG, colorB);
    ellipse(px, py, 25, 25);

    if (isMobile) {
        // Send data to server
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                'type': 'client-data',
                'id': clientId,
                'position': { x, y }
            }));
        }
    } else {
        if (isDragging) {
            // Send data to server
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    'type': 'client-data',
                    'id': clientId,
                    'position': { x: px, y: py }
                }));
            }
        }
    }
}

function windowResized() {
    canvasSize = min(windowWidth, windowHeight) * 0.7;
    resizeCanvas(canvasSize, canvasSize);
    canvas.position((windowWidth - width) / 2, (windowHeight - height) / 2);
}




// const ws = new WebSocket('wss://phone-td.onrender.com:443');

// let px = 25; // Position x and y
// let py = 25;
// let vx = 0.0; // Velocity x and y
// let vy = 0.0;
// let x = 0.0;
// let y = 0.0;
// let mobile = false;
// const updateRate = 1/60; // Sensor refresh rate

// var isDragging = false;
// let clientId = 0;

// let colorR = Math.floor(Math.random() * 256);
// let colorG = Math.floor(Math.random() * 256);
// let colorB = Math.floor(Math.random() * 256);
 
// let canvas;
// let canvasSize;

// const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ws.onopen = function () 
// {
//   console.log('Connected to the server.');

//   // Generate a random color for this client
//   colorR = Math.floor(Math.random() * 256);
//   colorG = Math.floor(Math.random() * 256);
//   colorB = Math.floor(Math.random() * 256);

// };

// ws.onmessage = function (event) 
// {
//     let data = JSON.parse(event.data);
//     let stringifiedData = data.toString();

//     if(stringifiedData === 'ping') 
//     {
//         ws.send('pong');
//         console.log('got ping, sent pong');
//         return;
//     }

//     if (data.type === 'sensorData') {
//         let id = data.id;
//         let valPX = data.px;
//         let valPY = data.py;
//         let valueGamma = data.g;
//         let valColR = data.red; 
//         let valColG = data.green;
//         let valColB = data.blue;
//         console.log('Got : ', id, valPX, valPY, valueGamma, valColR, valColG, valColB);

//         fill(valColR, valColG, valColB); // Use ellipseColor for fill color
//         ellipse(valPX, valPY, 15, 15);
//       }
    
//       if (data.type === 'mouseData') {
//         let id = data.id;
//         let valX = data.x;
//         let valY = data.y;
//         let valColR = data.red; 
//         let valColG = data.green;
//         let valColB = data.blue;
//         console.log('Got : ', id, valX, valY, valColR, valColG, valColB);

//         fill(valColR, valColG, valColB); // Use ellipseColor for fill color
//         ellipse(valX, valY, 15, 15);
//       }
// };

// ws.onerror = function (error) 
// {
//   console.error('WebSocket error:', error);
// };

// ws.onclose = function () 
// {
//   console.log('Disconnected from the server.');
//   ws.send(JSON.stringify({'type': 'clientOUT', 'id' : clientId}));
// };

// // Page Visibility API
// function handleVisibilityChange() 
// {
//     if (document.hidden) 
//     {
//         // Page is hidden, send 'clientOUT'
//         ws.send(JSON.stringify({'type': 'clientOUT', 'id' : clientId}));
//     } 
//     else 
//     {
//         // Page is visible again, reconnect if necessary
//         if (ws.readyState === WebSocket.CLOSED) 
//         {
//             ws = new WebSocket('wss://phone-td.onrender.com:443');
//         }
//     }
// }

// document.addEventListener('visibilitychange', handleVisibilityChange, false);

// // beforeunload event
// window.addEventListener('beforeunload', (event) => 
// {
//     // Send 'clientOUT' before the window closes
//     ws.send(JSON.stringify({'type': 'clientOUT', 'id' : clientId}));
// });
  
// ws.addEventListener('message', (event) => 
// {
//     const data = JSON.parse(event.data);
//     if (data.type === 'client-id') 
//     {
//         clientId = data.id;
//         console.log(`Received client ID: ${clientId}`);
//     }
// });

// // Check if the device is a mobile phone
// const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// // If the device is a mobile phone, listen for sensor data
// if (isMobile) 
// {
//     mobile = true;

//     function handleOrientation(event) 
//     {
//         let smoothing_factor = 0.9; // Adjust this between 0 (no smoothing) and 1 (maximum smoothing)
//         let scale_factor = 0.8; // Scale factor for adjusting sensor data range to canvas range

//         let new_vx = 0, new_vy = 0;
        
//         // Processing canvas width and height
//         let canvasWidth = width;
//         let canvasHeight = height;

//         // Check if accelerationIncludingGravity is available
//         if(event.accelerationIncludingGravity.x !== null && event.accelerationIncludingGravity.y !== null) 
//         {
//             // Calculate the new velocities based on accelerationIncludingGravity
//             // Here, we don't multiply by updateRate because acceleration is already a rate of change
//             // Also, swap x and y to match screen dimensions, and reverse the direction
//             new_vx = -event.accelerationIncludingGravity.x * scale_factor;
//             new_vy = event.accelerationIncludingGravity.y * scale_factor;
//         }

//         // Apply smoothing
//         vx = vx * smoothing_factor + new_vx * (1 - smoothing_factor);
//         vy = vy * smoothing_factor + new_vy * (1 - smoothing_factor);

//         // Update position and clip it to bounds
//         px += vx;
//         if (px > canvasWidth || px < 0) 
//         { 
//             px = Math.max(0, Math.min(canvasWidth, px)); // Clip px between 0-398
//             vx = 0;
//         }

//         py += vy;
//         if (py > canvasHeight || py < 0) 
//         {
//             py = Math.max(0, Math.min(canvasHeight, py)); // Clip py between 0-398
//             vy = 0;
//         }

//         ws.send(
//         JSON.stringify({
//             'type': "sensorData",
//             'id': clientId,
//             'px': px,
//             'py': py,
//             'g': leftToRight_degrees,
//             'red' : colorR,
//             'green' : colorG,
//             'blue' : colorB 
//         })
//         );
//     }
    
//     function requestSensorPermission() 
//     {
//         if 
//         (
//         typeof DeviceMotionEvent !== "undefined" &&
//         typeof DeviceMotionEvent.requestPermission === "function"
//         ) 
//         {
//             // iOS 13+
//             DeviceMotionEvent.requestPermission().then((response) => 
//             {
//                 if (response == "granted") 
//                 {
//                 window.addEventListener("devicemotion", handleOrientation);
//                 }
//             });
//         } 
//         else 
//         {
//             window.addEventListener("devicemotion", handleOrientation);
//         }
//     }
    
//   // Call requestSensorPermission to ask for permission
//   requestSensorPermission();
  
// }

// else
// {
//     mobile = false;

//     //const canvas = document.getElementById('defaultCanvas0');
//     //const canvasRect = canvas.getBoundingClientRect();

//     document.addEventListener('mousedown', function(event) 
//     {
//         isDragging = checkMouseInsideEllipse(event.clientX, event.clientY);
//         isDragging = true;
//     });
      
//     document.addEventListener('mouseup', function(event)
//     {
//         isDragging = false;
//     });

//     document.addEventListener('mousemove', function(event) 
//     {
//         if (isDragging) 
//         {
//           // Get the x and y coordinates of the mouse
//           x = event.clientX;
//           y = event.clientY;
    
//           // Check if the mouse is inside the ellipse
//         //   if (checkMouseInsideEllipse(x, y)) 
//         //   {
//             // Update the position of the ellipse
//             px = x;
//             py = y;
    
//             // Send the updated position to the server
//             ws.send
//             (
//               JSON.stringify
//               ({
//                 'type': 'mouseData',
//                 'id': clientId,
//                 'x': px,
//                 'y': py,
//                 'red': colorR,
//                 'green': colorG,
//                 'blue': colorB
//               })
//             );
//         //   }
//         }
//       });

//       function checkMouseInsideEllipse(mouseX, mouseY) 
//       {
//         // Calculate the distance between the mouse position and the center of the ellipse
//         const dx = mouseX - px;
//         const dy = mouseY - py;
//         const distance = Math.sqrt(dx * dx + dy * dy);
    
//         // Check if the distance is less than the radius of the ellipse
//         return distance < 20; // Assuming the radius of the ellipse is 25
//       }
// }

// const sensorButton = document.getElementById('sensor-button');

// sensorButton.addEventListener('click', function() 
// {
//     requestSensorPermission();
// });


// function setup() 
// {
//     let canvasSize = min(windowWidth, windowHeight) * 0.7;
//     let canvas = createCanvas(canvasSize, canvasSize);
//     canvas.position((windowWidth - width) / 2, (windowHeight - height) / 2);
//     background(0);

//     ellipseMode(CENTER);
// }

  
// function draw() 
// {
//     if(mobile)
//     {
//         fill(colorR, colorG, colorB);
//         ellipse(px, py, 25, 25);
//     }

//     else if (!mobile && isDragging)
//     {
//         fill(colorR, colorG, colorB);
//         ellipse(x, y, 25, 25);
//     }
// }

// function windowResized() 
// {
//     let canvasSize = min(windowWidth, windowHeight) * 0.7;
//     resizeCanvas(canvasSize, canvasSize);
//     canvas.position((windowWidth - width) / 2, (windowHeight - height) / 2);
// }
