
let tabrain = [];
window.addEventListener("load", load); //Lancement de la fonction load au chargement de la page

function load(){
const Url ='http://138.197.188.172:3000/api/wsclichy/72'; //Requête http vers l'api (chargement des 72 dernières valeurs).
  fetch(Url)
  .then(data=>{return data.json()})
  .then(res=>{let temperature=res.result[0].TEMP_REEL; //On lit la dernière valeur de tempérarure entrée dans la base 
console.log(res.result[0].WIN_DIRECTION)
let humidity=res.result[0].HUMIDITY; //On lit la dernière valeur d'humidité entrée dans la base 
let pression=res.result[0].PRESSURE; //On lit la dernière valeur de pression entrée dans la base 
let rain=res.result[0].RAIN; //On lit la dernière valeur de précipitation entrée dans la base 
let wind_speed=res.result[0].WIND_SPEED;  //On lit la dernière valeur de vitesse de vent entrée dans la base 
let wind_direction=res.result[0].WIN_DIRECTION; //On lit la dernière valeur de direction du vent entrée dans la base 
const humi=document.getElementById("hum");
const temp=document.getElementById("temp_reel");
const press=document.getElementById("pressure");
const rainf=document.getElementById("rainFall");
const windspeed=document.getElementById("windSpeed");
const windir=document.getElementById("calDirection");
humi.innerHTML=humidity; //on insére la valeur de l'humidité sur l'id hum
temp.innerHTML=temperature;

windspeed.innerHTML=wind_speed;
press.innerHTML=pression;
windir.innerHTML=wind_direction;

let today = new Date(); // On relève la date complète
let dd = today.getDate(); // On récupére la date  du jour
let time = [];
let days = [];
let day;

for(let i=0;i<res.result.length;i++){
    time.push(res.result[i].TIME);
    let date = new Date(time[i]);
  day = date.getUTCDate();
  days.push(day);
 
    if(day==dd){tabrain.push(res.result[i].RAIN);
  }
console.log(days);
console.log(tabrain);
let totalrain = Math.round((tabrain[0] - tabrain[tabrain.length-1])*10)/10;
if(totalrain<0){totalrain=tabrain[0];}
console.log(totalrain);
rainf.innerHTML=totalrain;
}
})

//const Url ='http://138.197.188.172:3000/api/wschioggia';
//  fetch(Url)
//  .then(data=>{return data.json()})
//  .then(res=>{let temperature_ch=res.result[0].TEMP_REEL_CH;
//console.log(res.result[0].WIN_DIRECTION_CH)
//let humidity_ch=res.result[0].HUMIDITY_CH;
//let pression_ch=res.result[0].PRESSURE_CH;
//let rain_ch=res.result[0].RAIN_CH;
//let wind_speed_ch=res.result[0].WIND_SPEED_CH;
//let wind_direction_ch=res.result[0].WIN_DIRECTION_CH;
//const humi_ch=document.getElementById("humCh");
//const temp_ch=document.getElementById("temp_reelCh");
//const press_ch=document.getElementById("pressureCh");
//const rainf_ch=document.getElementById("rainFallCh");
//const windspeed_ch=document.getElementById("windSpeedCh");
//const windir_ch=document.getElementById("calDirectionCh");
//humi_ch.innerHTML=humidity_ch;
//temp_ch.innerHTML=temperature_ch;
//rainf_ch.innerHTML=rain_ch;
//windspeed_ch.innerHTML=wind_speed_ch;
//press_ch.innerHTML=pression_ch;
//windir_ch.innerHTML=wind_direction_ch;
//})


}

  var socket = io('http://138.197.188.172:3000');

    socket.on("message-from-server-to-client", function(hum,temp_reel,pressure,rainFall,windSpeed,calDirection) {
      document.getElementById('hum').innerHTML = hum;
      document.getElementById('temp_reel').innerHTML = temp_reel;
      document.getElementById('pressure').innerHTML = pressure;
      totalrain = parseInt(rainFall)- parseInt(tabrain[tabrain.length-1]);
      if(totalrain<0){totalrain=rainFall;}
      document.getElementById('rainFall').innerHTML = totalrain;
      document.getElementById('windSpeed').innerHTML = windSpeed;
      document.getElementById('calDirection').innerHTML = calDirection;
    });


