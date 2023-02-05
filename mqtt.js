const mqtt = require('mqtt');
const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const morgan = require('morgan')

const mysql = require('mysql');

const connection = mysql.createConnection({
  host: '172.17.0.3',
  user: 'admin',
  password: 'SWKSrRfSwT71',
  database: 'WSINEU'
});

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server,{
    allowEIO3: true, // false by default
    cors : {
      origin: function (origin, callback) {
        callback(null, true)
      },
      credentials: true,
  }
  });


let hum = '';
let temp_reel = '';
let temp_test= '';
let pressure = '';
let rainFall = '';
let windSpeed = '';
let calDirection = '';
let date = '';

app.use(morgan('dev'))

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected as id ' + connection.threadId);
});


app.get('/', (req, res) => {
res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/wsclichy/:id', function (req, res) {
var id = connection.escape(req.params.id);
var query = `SELECT * FROM WSCLICHY ORDER BY ID DESC LIMIT ${id}`;

  connection.query(query, function (error, results) {
  if(error)
  console.log(message.error)
  else res.json(success(results))})
});

//connexion au broker mqtt TTN
var client = 
//mqtt.connect("mqtt://eu1.cloud.thethings.network",{username:"arrosage-newton@ttn",password:"NNSXS.ZOGOBFVZ4GIE7OPXM2VQFG4APAP5Z7PTUSEIFBI.CKCBVWFQA5PVHIQK3IUCWXDOCNFK2OV6IM44LUL3SOHOANYIPXDQ"});
//mqtt.connect("mqtt://eu1.cloud.thethings.network",{username:"ws-chioggia@ttn",password:"NNSXS.Q6EM3Z6IPI2UMJQCBCOH77K47B5ATVRW4PSMCQA.BX7K4CWFKANMZHHQGBSFAB4HY4JR6M2OGCWMJVDORJETSF5W672A"});
mqtt.connect("mqtt://eu1.cloud.thethings.network",{username:"ws-clichy@ttn",password:"NNSXS.74WWUMQG5ZQ5FT673FG7VAYA742LIHESG3W4KBQ.2MEH34R4YPFXHN5ZGVQEX2XPJAABVH53M4J5WQQROZ2WROSDDTTQ"});
//var client = mqtt.connect("mqtt://eu1.cloud.thethings.network",{username:"lse01id@ttn",password:"NNSXS.GK7RRP7GIFY3AKLGMKICDD6DG23ATHEUSSXO22Y.PYUQAJ3BDN25QI2HELSVGRS3DYWC4BI4NFF7SMB7XR4QXE56O3VA"});
//client.on("connect",function(){	
//console.log("connected");})

//Définition du topic (ici on s'abonne à la totalité du message)
const topic = '#';
client.subscribe([topic]);
//client.subscribe([topic], () => {
//console.log(`Subscribe to topic '${topic}'`);
//})

//sur la réception du message, on affiche en console le message, on parse le payload pour filtrer l'humidité et on émet la valeur
//de l'humidité en socketio
client.on('message', (topic,payload) => {
try{
console.log('Received Message:', JSON.parse(payload).uplink_message);
console.log('Received Message:', JSON.parse(payload).uplink_message.decoded_payload.temp_reel);
console.log('Received Message:', JSON.parse(payload).uplink_message.decoded_payload.humidity);
console.log('Received Message:', JSON.parse(payload).uplink_message.decoded_payload.temp_test);
//console.log('Received Message:', JSON.parse(payload).uplink_message.rx_metadata.received_at);

hum = JSON.parse(payload).uplink_message.decoded_payload.humidity;
temp_reel = JSON.parse(payload).uplink_message.decoded_payload.temp_reel;
pressure = JSON.parse(payload).uplink_message.decoded_payload.pressure;
rainFall = JSON.parse(payload).uplink_message.decoded_payload.rainFall;
windSpeed = JSON.parse(payload).uplink_message.decoded_payload.windSpeed;
calDirection = JSON.parse(payload).uplink_message.decoded_payload.calDirection;
temp_test=JSON.parse(payload).uplink_message.decoded_payload.temp_test;
//date = JSON.parse(payload).uplink_message.rx_metadata.received_at;

connection.query("INSERT INTO WSCLICHY (TEMP_REEL,TEMP_TEST,HUMIDITY,PRESSURE,RAIN,WIND_SPEED,WIN_DIRECTION) VALUES ('"+temp_reel+"','"+temp_test+"','"+hum+"','"+pressure+"','"+rainFall+"','"+windSpeed+"','"+calDirection+"')",function (error, results, fields) {
  if (error) throw error;
  // résultats contient le résultat de la requête
});

let LastId;
connection.query('SELECT ID FROM WSCLICHY ORDER BY ID DESC LIMIT 1', function (error, results) {
  if(error)
  console.log(message.error)
  else LastId=JSON.parse(JSON.stringify(results))[0].ID});

let  count;
connection.query('SELECT COUNT(*) as count FROM WSCLICHY', function (error, results) {
if(error)
console.log(message.error)
else count=JSON.parse(JSON.stringify(results))[0].count

console.log(LastId-2200);

if(count>=2200) {connection.query('DELETE FROM WSCLICHY WHERE id <'+(LastId-2200), function (error, results) {
  if(error)
  console.log(message.error)});
}
});


io.emit('message-from-server-to-client', hum,temp_reel,pressure,rainFall,windSpeed,calDirection);
}
catch(error){console.error(error)}
})

// io.on('connection', (socket) => {
//     console.log('a user connected');
//     socket.emit('message-from-server-to-client', hum);
//    });

server.listen(3000, () => {
console.log('listening on *:3000');
});

function success(result){
return {
	status : 'success',
	result : result
}
}
