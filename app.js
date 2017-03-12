var serialport = require('serialport');
var sds011 = require('nova-sds011');
var serial = new serialport.SerialPort("/dev/ttyUSB0", {
    baudrate: 9600
});
var dweetClient = require("node-dweetio");

var express = require('express');
var dateTime = require('node-datetime');

var app = express();

var fs = require('fs');


var dweetio = new dweetClient();

const delay = 300000;
const delayBeforeMeasure = 20 ; //in secs
const delaybeforeSleep = 30000;



function sensorWake(){
  const buf = Buffer.from("01","hex");
  writeAndDrain(buf, function(err){
  });
}

var i  =0;

function sensorSleep(){
 var bytes = "AAB406010000000000000000000000FFFF05AB";
 const buf = Buffer.from(bytes,"hex");
 writeAndDrain(buf, function(err){
 });
 }

serial.on('data', function (data) {
    var pmValues = sds011(data)
    if (!pmValues) {
        log.error('failed to parse buffer [' + data.toString('hex') + ']')
        return
    }
    i= i+1;
    if (i>delayBeforeMeasure){
      if (pmValues.pm2_5 > 0 && pmValues.pm10 > 0){
      	dweetio.dweet_for("pm25thorignefouillardsainteanne", {some:pmValues.pm2_5}, function(err, dweet){
      	});
      	dweetio.dweet_for("pm10thorigneFouillardsainteanne", {some:pmValues.pm10}, function(err, dweet){
      	});
        console.info("pm2.5: " + pmValues.pm2_5 + "\tpm10: " + pmValues.pm10);
        var dt = dateTime.create();
        var formatted = dt.format('d-m-Y;H:M:S');

        fs.appendFile("static/data.csv", ""+pmValues.pm2_5 +";"+pmValues.pm10+";"+ formatted+"\n", function(err) {
            if(err) {
                return console.log(err);
            }
        });

  }
  }
});

function writeAndDrain(data, callback) {
  serial.write(data, function () {
    serial.drain(callback);
  });
}

setTimeout(function(){
  sensorWake();
},2000);


setTimeout(function(){
  sensorSleep();
},delaybeforeSleep);

setInterval(function(){
  sensorWake();
  setTimeout(function(){
    sensorSleep();
    i=0;
    },delaybeforeSleep);
},delay);

dweetio.listen_for("pm25thorignefouillardsainteanne", function(dweet){
	console.log(dweet);
});


dweetio.listen_for("pm10thorigneFouillardsainteanne", function(dweet){
	console.log(dweet);
});

app.use(express.static('static'));

app.listen(3000, function () {
  console.log('Dust Sensor listening on port 3000!');
});
