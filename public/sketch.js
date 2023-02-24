const ws = new WebSocket('wss://phone-td.onrender.com:443');

let px = 50; // Position x and y
let py = 50;
let vx = 0.0; // Velocity x and y
let vy = 0.0;
const updateRate = 1/60; // Sensor refresh rate

let rotation_degrees = 0;
let frontToBack_degrees = 0;
let leftToRight_degrees = 0;

ws.onopen = function () {
  console.log('Connected to the server.');
};

ws.onmessage = function (event) {
    let data = JSON.parse(event.data);
    let stringifiedData = data.toString();
    if(stringifiedData === 'ping') {
        ws.send('pong');
        console.log('got ping, sent pong');
        return;
    }

    if (data.type === 'sensorData') {
        let valAlpha = data.a;
        let valBeta = data.b;
        let valueGamma = data.g; 
        console.log('Got : ', valAlpha, valBeta, valueGamma);
    }
};

ws.onerror = function (error) {
  console.error('WebSocket error:', error);
};

ws.onclose = function () {
  console.log('Disconnected from the server.');
};

// Check if the device is a mobile phone
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// If the device is a mobile phone, listen for sensor data
if (isMobile) {
    // Add a listener to get smartphone orientation 
    // in the alpha-beta-gamma axes (units in degrees)
    window.addEventListener('deviceorientation', (event) => {
        // Expose each orientation angle in a more readable way
        rotation_degrees = event.alpha;
        frontToBack_degrees = event.beta;
        leftToRight_degrees = event.gamma;

        ws.send(JSON.stringify({'type': 'sensorData', 'a': rotation_degrees, 'b': frontToBack_degrees, 'g': leftToRight_degrees}));
    });
}

function setup() {
    createCanvas(400, 400);
    ellipseMode(CENTER);
}
  
function draw() {
    background(220);

    // Update velocity according to how tilted the phone is
    // Since phones are narrower than they are long, double the increase to the x velocity
    vx += leftToRight_degrees * updateRate * 2; 
    vy += frontToBack_degrees * updateRate;

    // Update position and clip it to bounds
    px += vx * 0.5;
    if (px > width || px < 0) { 
        px = Math.max(0, Math.min(398, px)); // Clip px between 0-398
        vx = 0;
    }

    py += vy * 0.5;
    if (py > height || py < 0) {
        py = Math.max(0, Math.min(398, py)); // Clip py between 0-398
        vy = 0;
    }


    ellipse(px, py, 50, 50);
}
