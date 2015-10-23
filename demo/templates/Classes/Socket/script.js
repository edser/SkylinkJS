$(document).ready(function(){
  output = document.getElementById('output');
  status = document.getElementById('status');
  type = document.getElementById('type');
  server = document.getElementById('server');
  http = document.getElementById('http');
  https = document.getElementById('https');
});

var socket, output, status, type, server, http, https;

function update(event, data) {
  output.innerHTML += '<p><b>' + event +
    '</b> ' + JSON.stringify(data) + '</p>';
}

function clear() {
  output.innerHTML = '';
}

function failConnect() {
  socket = new Socket({
    type: type.value,
    server: server.value,
    httpPorts: http.value.split(','),
    httpsPorts: https.value.split(',')
  });

  socket.connect();

  socket.on('connected', function(){
    console.log('connected');
  });

  socket.on('error', function(error){
    console.log('error',error);
  });

  socket.on('disconnected', function(){
    console.log('disconnected');
  });

  socket.on('reconnect', function(attemtp){
    console.log('reconnect');
  });

  socket.on('reconnect_attempt', function(){
    console.log('reconnect_attempt');
  });  

  socket.on('reconnecting', function(attemtp){
    console.log('reconnecting', attemtp);
  });  

  socket.on('reconnect_error', function(error){
    console.log('reconnect_error', error);
  });  

  socket.on('reconnect_failed', function(){
    console.log('reconnect_failed');
  }); 

  socket.on('connect_error', function(error){
    console.log('connect_error',error);
  });    

  socket.on('connect_timeout', function(error){
    console.log('connect_timeout',error);
  }); 

}

function successConnect() {
  var socketType = type.value;

  socket = new Socket({
    server: 'sg-signaling.temasys.com.sg',
    httpPortList: [500, 6001],
    httpsPortList: [443],
    type: socketType
  });

  socket.connect();

  update('Connecting', socketType);
}

function disconnect() {
  if (socket) {
    socket.disconnect();
  }
}