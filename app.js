const http = require('http');
const url = require('url');
const https = require('https');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql');
const socketio = require('socket.io');

const port1= 3000;
const port2= 3001;

const options = {
    key: fs.readFileSync('./certkey/privkey.pem'),
    cert: fs.readFileSync('./certkey/cert.pem'),
    ca: fs.readFileSync('./certkey/chain.pem')
};


// create Web Server
const app = express();
var httpServer = http.createServer(app);
var httpsServer = https.createServer(options,app);

// http => https 리디렉션
app.use(function(request, response){
  if(!request.secure){
    response.redirect("https://" + request.headers.host + request.url);
  }
});

//run http server
httpServer.listen(port1,function(){
  console.log('$sync Server is running at localhost:' + port1);
});
// run https server
httpsServer.listen(port2,function(){
  console.log('$sync Server is running at localhost:' + port2);
});

//run socket server on httpServer
var ioh = socketio.listen(httpServer,console.log('http socket server listen'));
var io = socketio.listen(httpsServer,console.log('https socket server listen'));

//create mysql connection
var client = mysql.createConnection({
  host: '192.168.1.200',
  user: 'youngun',
  password: 'nice5734',
  database: 'LOCATION'
});

//tracker
app.get('/tracker',function(request,response){
  fs.readFile('views/tracker.ejs','utf8',function(error,data){
    response.send(data.toString());
  });
});
//observer
app.get('/observer',function(request,response){
  fs.readFile('views/observer.ejs','utf8',function(error,data){
    response.send(data.toString());
  });
});

// sockets connection 이벤트 연결
io.sockets.on('connection',function(socket){
  // join event 로 room 생성
  socket.on('join', function(roomName){
    socket.join(roomName);
    console.log('macjoin: '+ roomName);
  });//
  socket.on('location',function(data){
    client.query('INSERT INTO LOCATION(name, latitude, longitude, date) VALUES(?,?,?,now())',[data.roomName, data.latitude, data.longitude]);
    console.log(data.latitude);
    io.socket.in(data.roomName).emit('receive',{
      latitude: data.latitude,
      longitude: data.longitude,
      date: Date.now()
    });
  });
});

ioh.sockets.on('connection',function(socket){
  // join event 로 room 생성
  socket.on('join', function(roomName){
    socket.join(roomName);
    console.log('macjoin: '+ roomName);
  });//
  socket.on('location',function(data){
    client.query('INSERT INTO LOCATION(name, latitude, longitude, date) VALUES(?,?,?,now())',[data.roomName, data.latitude, data.longitude]);
    console.log(data.latitude);
    io.socket.in(data.roomName).emit('receive',{
      latitude: data.latitude,
      longitude: data.longitude,
      date: Date.now()
    });
  });
});
