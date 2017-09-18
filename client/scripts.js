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
var mapWidth;
var mapHeight;
var fpsCounter = 0;
var od = 0;

function setup(){
  createCanvas(windowWidth, windowHeight);
}

function draw(){
  background(255);
  render();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

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
  findSelf();
  renderBackground();
  drawPlayers(players);
  drawObject(food, color("#FF0000"));
}

function renderBackground(){
  scrollX = midX - width / 2;
  scrollY = midY - height / 2;

  line(-scrollX,-scrollY, mapWidth * tileSize - scrollX,-scrollY);
  line( mapWidth * tileSize - scrollX,-scrollY, mapWidth * tileSize - scrollX,mapHeight * tileSize -scrollY);
  line(mapWidth * tileSize - scrollX,mapHeight * tileSize -scrollY, -scrollX,mapHeight * tileSize -scrollY);
  line(-scrollX,mapHeight * tileSize -scrollY, -scrollX,-scrollY);
}

function drawPlayers(players){
  for (var i = 0; i < players.length; i++) {
    drawCircle(players[i].x, players[i].y, color(players[i].color));
    drawObject(players[i].tail, color(players[i].color));
  }
}

function drawObject (posObject, color){
  for (var i = 0; i < posObject.length; i++) {
    drawCircle(posObject[i].x, posObject[i].y, color);
  }
}

function drawCircle(x, y, color){
  if (x * tileSize > scrollX && x * tileSize < scrollX + width && y * tileSize > scrollY && y * tileSize < scrollY + height){
    fill(color);
    ellipse(x * tileSize - scrollX + tileSize / 2, y * tileSize - scrollY + tileSize / 2,tileSize);
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
  mapWidth = data.width;
  mapHeight = data.height;
});

socket.on("dead", (data) =>{
  createPlayer();
});
