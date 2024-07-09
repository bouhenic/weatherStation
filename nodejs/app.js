const express = require('express');
const mqtt = require('mqtt');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const path = require('path');

const app = express();
const port = 3000;


// Configuration du client MQTT
const mqttUrl = 'mqtts://eu1.cloud.thethings.network'; // URL du broker MQTT
const topic = '#'; // Remplacez par le topic spécifique auquel vous souhaitez vous abonner

const options = {
    username: 'xxxxxx@ttn',
    password: 'XXXXX.74WWUMQG5ZQ5FT673FG7VAYA742LIHESG3W4KBQ.2MEH34R4YPFXHN5ZGVQEX2XPJAABVH53M4J5WXXXXXXXXXX',
    protocol: 'mqtts'
};

const client = mqtt.connect(mqttUrl, options);

client.on('connect', () => {
    console.log(`Connecté au broker MQTT à ${mqttUrl}`);
    client.subscribe(topic, (err) => {
        if (err) {
            console.error(`Erreur lors de l'abonnement au topic ${topic}`, err);
        } else {
            console.log(`Abonné au topic ${topic}`);
        }
    });
});

// Configuration du client InfluxDB
const influxUrl = 'http://influxdb:8086'; // URL de votre instance InfluxDB
const influxToken = 'dQSVkBRNMvJHrjbZFxN_sppfJfC725YiOR2FYX43O5WljhvLN6nnbZIl-5Ass6pGns8Vudfey8bXRS0GlV0mpw=='; // Votre token InfluxDB
const influxOrg = 'cielnewton'; // Votre organisation InfluxDB
const influxBucket = 'ws2024'; // Votre bucket InfluxDB

const influxDB = new InfluxDB({ url: influxUrl, token: influxToken });
const writeApi = influxDB.getWriteApi(influxOrg, influxBucket);

// Réception et traitement des messages MQTT
client.on('message', (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        console.log(`Message reçu sur ${topic}:`, JSON.stringify(payload, null, 2));

        if (payload.uplink_message && payload.uplink_message.decoded_payload) {
            const decodedPayload = payload.uplink_message.decoded_payload;

            const point = new Point('sensor_data')
                .tag('location', 'garden')
                .floatField('avgDirection', decodedPayload.avgDirection)
                .stringField('avgDirectionCardinal', decodedPayload.avgDirectionCardinal)
                .floatField('avgSpeed', decodedPayload.avgSpeed)
                .floatField('batteryVoltage', decodedPayload.batteryVoltage)
                .floatField('gas', decodedPayload.gas)
                .floatField('humidity', decodedPayload.humidity)
                .floatField('iaq', decodedPayload.iaq)
                .floatField('maxSpeed', decodedPayload.maxSpeed)
                .floatField('maxSpeedDirection', decodedPayload.maxSpeedDirection)
                .stringField('maxSpeedDirectionCardinal', decodedPayload.maxSpeedDirectionCardinal)
                .floatField('pressure', decodedPayload.pressure)
                .floatField('rainfall', decodedPayload.rainfall)
                .floatField('tempDS18B20', decodedPayload.tempDS18B20)
                .floatField('temperature', decodedPayload.temperature)
                .timestamp(new Date());

            writeApi.writePoint(point);

            console.log('Valeurs reçues :');
            console.log(`Direction moyenne : ${decodedPayload.avgDirection}°`);
            console.log(`Direction moyenne cardinale : ${decodedPayload.avgDirectionCardinal}`);
            console.log(`Vitesse moyenne : ${decodedPayload.avgSpeed}km/h`);
            console.log(`Tension de la batterie : ${decodedPayload.batteryVoltage}V`);
            console.log(`Gaz : ${decodedPayload.gas}kOhm`);
            console.log(`Humidité : ${decodedPayload.humidity}%`);
            console.log(`Qualité de l'air (IAQ) : ${decodedPayload.iaq}`);
            console.log(`Vitesse maximale : ${decodedPayload.maxSpeed}`);
            console.log(`Direction de la vitesse maximale : ${decodedPayload.maxSpeedDirection}`);
            console.log(`Direction cardinale de la vitesse maximale : ${decodedPayload.maxSpeedDirectionCardinal}`);
            console.log(`Pression : ${decodedPayload.pressure}hPa`);
            console.log(`Précipitations : ${decodedPayload.rainfall}mm`);
            console.log(`Température (DS18B20) : ${decodedPayload.tempDS18B20}°C`);
            console.log(`Température : ${decodedPayload.temperature}°C`);
        }
    } catch (error) {
        console.error(`Erreur lors du traitement du message sur ${topic}`, error);
    }
});

// Route pour récupérer les données des capteurs depuis InfluxDB
app.get('/api/data/:field', async (req, res) => {
    const field = req.params.field; // Champ (grandeur météo) demandé
    const duration = req.query.duration || '-1h'; // Durée spécifiée par l'utilisateur (par défaut, la dernière heure)

    const query = `from(bucket: "${influxBucket}")
        |> range(start: ${duration})
        |> filter(fn: (r) => r._measurement == "sensor_data" and r._field == "${field}")
        |> yield(name: "mean")`;

    try {
        const queryApi = influxDB.getQueryApi(influxOrg);
        let result = [];
        
        queryApi.queryRows(query, {
            next(row, tableMeta) {
                const o = tableMeta.toObject(row);
                result.push(o);
            },
            error(error) {
                console.error(error);
                res.status(500).send(error.toString());
            },
            complete() {
                res.json(result);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.toString());
    }
});

// Fermer writeApi proprement lors de la fermeture de l'application
process.on('SIGINT', () => {
    writeApi
        .close()
        .then(() => {
            console.log('InfluxDB writeApi closed.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error closing InfluxDB writeApi', err);
            process.exit(1);
        });
});

// Démarrer le serveur Express
app.listen(port, () => {
    console.log(`Serveur API démarré sur http://localhost:${port}`);
});
