const ws = new WebSocket('wss://phone-td.onrender.com:443');

let posX = 50;
let posY = 50;
let speedX = 0;
let speedY = 0;


let alphaValue = 0;
let betaValue = 0;
let gammaValue = 0;


ws.onopen = function () 
{
  console.log('Connected to the server.');
};

// ws.onmessage = function (event) 
// {
//   console.log('Received a message from the server:', event.data);

//   const data = JSON.parse(event.data);
  
//   if (data.type === 'sensorAccData') 
//   {
//     speedX += data.x;
//     speedY += data.y;
//   }
//   else if (data.type === 'sensorOrientationData') 
//   {
//     alphaValue = data.alpha.toFixed(2);
//     betaValue = data.beta.toFixed(2);
//     gammaValue = data.gamma.toFixed(2);
//   }

// };

ws.addEventListener('message', (message) =>{
    if(message.data == 'ping')
    {
        ws.send('pong');
        console.log('got ping, sent pong');
        return;
    }

    let data = JSON.parse(message.data);

    if ('sensorAccData' in data) 
    {
        speedX += data.x;
        speedY += data.y;
        console.log('got sensor data acc');
    }
    else if (data.type == 'sensorOrientationData') 
    {
        alphaValue = data.alpha.toFixed(2);
        betaValue = data.beta.toFixed(2);
        gammaValue = data.gamma.toFixed(2);

        console.log('got sensor data orient');
    }

    console.log(data);
});

ws.onerror = function (error) 
{
  console.error('WebSocket error:', error);
};

ws.onclose = function () 
{
  console.log('Disconnected from the server.');
};

// Check if the device is a mobile phone
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// If the device is a mobile phone, listen for sensor data
if (isMobile) 
{
    const confirmMessage = 'Allow this website to access your device sensors?';
    const isConfirmed = window.confirm(confirmMessage);
  
    if (isConfirmed) 
    {
        window.addEventListener('devicemotion', function (event) 
        {
            var acceleration = event.accelerationIncludingGravity;
            const message = {
            type : 'sensorAccData',
            x : acceleration.x,
            y : acceleration.y,
            z : acceleration.z,
            };
            ws.send(JSON.stringify(message));
        });
        
        window.addEventListener('deviceorientation', function (event) 
        {
            var alphaV = event.alpha;
            var betaV = event.beta;
            var gammaV = event.gamma;
            const message = 
            {
            type : 'sensorOrientationData',
            alpha : alphaV,
            beta : betaV,
            gamma : gammaV,
            };
            ws.send(JSON.stringify(message));
        });
        }
        else 
        {
            console.log('User denied access to device sensors');
        }
}

///////////////////////

function setup() 
{
    createCanvas(400, 400);
    ellipseMode(CENTER);
  }
  
  function draw() 
  {
    background(220);
    posX += speedX;
    posY += speedY;
    if (posX > width || posX < 0) 
    {
      speedX *= -1;
    }
    if (posY > height || posY < 0) 
    {
      speedY *= -1;
    }
    ellipse(posX, posY, 50, 50);
  }