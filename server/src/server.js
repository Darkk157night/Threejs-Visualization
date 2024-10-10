const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const PORT_NAME = '/dev/ttyUSB0';
let serialPort = null;
let parser = null;

function connectToSerialPort() {
    if (serialPort) {
        console.log('Closing existing connection...');
        serialPort.close();
    }

    console.log(`Attempting to connect to ${PORT_NAME}...`);
    serialPort = new SerialPort(PORT_NAME, { 
        baudRate: 9600 
    }, function (err) {
        if (err) {
            console.log('Error opening port: ', err.message);
            console.log('Will retry in 5 seconds...');
            setTimeout(connectToSerialPort, 5000);
            return;
        }
        console.log('Serial port opened successfully');
        setupParser();
    });

    serialPort.on('error', function(err) {
        console.log('Serial port error: ', err.message);
    });
}

function setupParser() {
    parser = serialPort.pipe(new Readline({ delimiter: '\n' }));
    
    parser.on('data', (data) => {
        try {
            const parsedData = JSON.parse(data);
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(parsedData));
                }
            });
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// List available ports
SerialPort.list().then(ports => {
    console.log('Available ports:');
    ports.forEach(port => {
        console.log(port.path);
    });
}).catch(err => console.error('Error listing ports', err));

connectToSerialPort();

const SERVER_PORT = 3000;
server.listen(SERVER_PORT, () => {
    console.log(`Server running on port ${SERVER_PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (serialPort) {
        console.log('Closing serial port...');
        serialPort.close();
    }
    process.exit();
});
