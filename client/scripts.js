var c = document.getElementById("canvas");
var ctx = c.getContext("2d");

var socket = io();

socket.on("id", (newId) => {
  socket.id = newId;
});

socket.on("update", (data) => {
  console.log(data);
  players = data.players;
  food = data.food;
  tileSize = data.tileSize;
});

window.addEventListener('keydown',this.check,false);

function check(e) {
  socket.emit("move", e.keyCode);
  console.log(e.keyCode);
}

var players = [];
var food = [];

var midX = 0;
var midY = 0;
tileSize = 0;

newPlayer();
render();

function findSelf(){
  for (var i = 0; i < players.length; i++) {
    if (players[i].id === socket.id){
      console.log("Hey");
      midX = players[i].x * tileSize;
      midY = players[i].y * tileSize;
      break;
    }
  }
}

function render(){
  $('#canvas').attr("width",$(window).width());
  $('#canvas').attr("height",$(window).height());
  findSelf();
  renderBackground();
  drawPlayers(players);
  drawObject(food);
  requestAnimationFrame(render);
}

function renderBackground(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  scrollX = midX - canvas.width / 2;
  scrollY = midY - canvas.height / 2;
}

function drawPlayers(players){
  for (var i = 0; i < players.length; i++) {
    drawCircle(players[i].x, players[i].y);
    drawObject(players[i].tail);
  }
}

function drawObject (posObject){
  for (var i = 0; i < posObject.length; i++) {
    drawCircle(posObject[i].x, posObject[i].y);
  }
}

function drawCircle(x, y){
  ctx.beginPath();
  ctx.arc(x * tileSize - scrollX, y * tileSize - scrollY,16,0,2*Math.PI);
  ctx.stroke();
}

function newPlayer(){
  socket.emit("newPlayer", "Et navn");
}
