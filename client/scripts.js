var socket = io();

window.addEventListener('keydown',this.check,false);

function check(e) {
  socket.emit("move", e.keyCode);
}

var players = [];
var food = [];

var midX = 0;
var midY = 0;
var scrollX = 0;
var scrollY = 0;
var tileSize = 0;
var mapWidth;
var mapHeight;
var backgroundColor = "#FFFFFF";

function setup(){
  createCanvas(windowWidth, windowHeight);
}

function draw(){
  background(color(backgroundColor));
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
  drawObject(food, drawCircle, color("#FF0000"));
  drawPlayers(players);
}

function renderBackground(){
  var tempScrollX = midX - width / 2;
  var tempScrollY = midY - height / 2;

  scrollX += ((tempScrollX - scrollX) * 0.02);
  scrollY += ((tempScrollY - scrollY) * 0.02);

  line(-scrollX,-scrollY, mapWidth * tileSize - scrollX,-scrollY);
  line( mapWidth * tileSize - scrollX,-scrollY, mapWidth * tileSize - scrollX,mapHeight * tileSize -scrollY);
  line(mapWidth * tileSize - scrollX,mapHeight * tileSize -scrollY, -scrollX,mapHeight * tileSize -scrollY);
  line(-scrollX,mapHeight * tileSize -scrollY, -scrollX,-scrollY);
}

function drawPlayers(players){
  for (var i = 0; i < players.length; i++) {
    drawRect(players[i].x, players[i].y, color(players[i].color));
    drawObject(players[i].tail, drawRect, color(players[i].color));
    textAlign(CENTER);
    textSize(20);
    fill(0);
    text(players[i].name, players[i].x * tileSize - scrollX + tileSize / 2, players[i].y * tileSize - scrollY + 50);
  }
}

function drawObject (posObject, obj, color){
  for (var i = 0; i < posObject.length; i++) {
    obj(posObject[i].x, posObject[i].y, color);
  }
}

function isInside(x,y){
  return (x * tileSize > scrollX - 30 && x * tileSize < scrollX + width + 30 && y * tileSize > scrollY -30 && y * tileSize < scrollY + height + 30);
}

function drawCircle(x, y, color){
  if (isInside(x,y)){
    fill(color);
    ellipse(x * tileSize - scrollX + tileSize / 2, y * tileSize - scrollY + tileSize / 2,tileSize);
  }
}

function drawRect(x, y, color){
  if (isInside(x,y)){
    fill(color);
    rectMode(CENTER);
    rect(x * tileSize - scrollX + tileSize / 2, y * tileSize - scrollY + tileSize / 2,tileSize,tileSize);
  }
}

function newPlayer(newName, newColor){
  socket.emit("newPlayer", {color: newColor, name: newName});
}

function createPlayer(){
  $("#new-user-modal").modal("show", "true")
}

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

$( ".modal-footer button" ).on( "click", function(){
  var name = $("#username-input").val();
  var color = $("#color-picker").val();
  backgroundColor = $("#color-picker-background").val();
  console.log(backgroundColor);
  newPlayer(name, color);
  $("#new-user-modal").modal("hide")
} );

$("#color-picker").spectrum({
  preferredFormat: "hex"
});

$("#color-picker-background").spectrum({
  preferredFormat: "hex"
});
