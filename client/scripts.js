var c = document.getElementById("canvas");
var ctx = c.getContext("2d");
var socket = io();

window.addEventListener('keydown',this.check,false);

function check(e) {
  socket.emit("move", e.keyCode);
}

var players = [];
var food = [];

var midX = 0;
var midY = 0;
var tileSize = 0;
var width;
var height;
var fpsCounter = 0;
var od = 0;

render();

function findSelf(){
  for (var i = 0; i < players.length; i++) {
    if (players[i].id === socket.id){
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
  drawObject(food, "#FF0000");

  var d = new Date().getTime();
  if (d >= od+1000){
    od = d;
    console.log(fpsCounter);
    fpsCounter = 0;
  }
  fpsCounter++;
  requestAnimationFrame(render);
}

function renderBackground(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  scrollX = midX - canvas.width / 2;
  scrollY = midY - canvas.height / 2;

  ctx.moveTo(-scrollX,-scrollY);
  ctx.lineTo(width * tileSize - scrollX,-scrollY);
  ctx.lineTo(width * tileSize - scrollX,height * tileSize -scrollY);
  ctx.lineTo(-scrollX,height * tileSize -scrollY);
  ctx.lineTo(-scrollX,-scrollY);
  ctx.stroke();
}

function drawPlayers(players){
  for (var i = 0; i < players.length; i++) {
    drawCircle(players[i].x, players[i].y, players[i].color);
    drawObject(players[i].tail, players[i].color);
  }
}

function drawObject (posObject, color){
  for (var i = 0; i < posObject.length; i++) {
    drawCircle(posObject[i].x, posObject[i].y, color);
  }
}

function drawCircle(x, y, color){
  if (x * tileSize > scrollX && x * tileSize < scrollX + canvas.width && y * tileSize > scrollY && y * tileSize < scrollY + canvas.height){
    ctx.beginPath();
    ctx.arc(x * tileSize - scrollX + tileSize / 2, y * tileSize - scrollY + tileSize / 2,16,0,2*Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
  }
}

function newPlayer(name){
  socket.emit("newPlayer", name);
}

function createPlayer(){
  $("#new-user-modal").modal("show", "true")
}

$( ".modal-footer button" ).on( "click", function(){
  var name = $("#username-input").value;
  newPlayer(name);
  $("#new-user-modal").modal("hide")
} );

socket.on("id", (newId) => {
  socket.id = newId;
  createPlayer();
});

socket.on("update", (data) => {
  players = data.players;
  food = data.food;
  tileSize = data.tileSize;
  width = data.width;
  height = data.height;
});

socket.on("dead", (data) =>{
  createPlayer();
});
