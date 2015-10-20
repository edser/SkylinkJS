var socket;
var output = document.getElementById('output');
var status = document.getElementById('status');

function update(event, data) {
  output.innerHTML += '<p><b>' + event +
    '</b> ' + JSON.stringify(data) + '</p>';
}

function clear() {
  output.innerHTML = '';
}

function failConnect() {
  socket = new Socket({
    server: document.getElementById('server').value,
    httpPorts: document.getElementById('http').value.split(','),
    httpsPorts: document.getElementById('https').value.split(',')
  });

  socket.connect();

  update('Connecting', '...');
}

function successConnect() {
  var socketType = document.getElementById('type').value;

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