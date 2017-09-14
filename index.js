var express = require('express');
app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);

function randomInt(min, max){
  return Math.floor(Math.random() * (max - min)) + min;
}

var Game = function (server){
  this.server = server;
  this.width = 10;
  this.height = 10;
  this.tileSize = 32;

  this.food = [];
  this.players = [];

  this.startGame();
}

Game.prototype.getGameData = function () {
  return {
    width: this.width,
    height: this.height,
    tileSize: this.tileSize,
    food: this.getData(this.food),
    players: this.getData(this.getPlayerList())
  };
};

Game.prototype.getData = function (items) {
  var reList = [];
  for (var i = 0; i < items.length; i++) {
    items[i].getData();
  }
  return reList;
};

Game.prototype.startGame = function () {
  setInterval(() => {
    this.update();
  }, 2000);
};

Game.prototype.update = function () {
  this.checkCollision();
  this.move();
  this.server.emit("update", this.getGameData());
};

Game.prototype.checkCollision = function () {
  for (var i = 0; i < this.players.length; i++) {
    console.log(this.getPlayerList());
    if (this.checkTail(this.players[i].player, this.getPlayerList())){
      this.players[i].emit("dead", true);
      break;
    }

    if (this.players[i].player.checkCollision(this.food)){
      this.players[i].player.addTail();
    }
  }
};

Game.prototype.checkTail = function (player, playerList) {
  for (var i = 0; i < playerList.length; i++) {
    console.log(playerList[i].tail);
    if (player.checkCollision(playerList[i].tail)){
      return true;
    }
  }
  return false;
};

Game.prototype.move = function () {
  for (var i = 0; i < this.players.length; i++) {
    this.players[i].player.move();
  }
};

Game.prototype.addPlayer = function (socketPlayer) {
  socketPlayer.player = new Player(socketPlayer.id);
  socketPlayer.player.x = randomInt(0, this.width);
  socketPlayer.player.y = randomInt(0, this.height);
  socketPlayer.player.xSpeed = 0;
  socketPlayer.player.ySpeed = 1;
  this.players.push(socketPlayer);
  console.log(this.getGameData());
};

Game.prototype.removePlayer = function (socketPlayer) {
  this.players[socketPlayer].player.destroy();
  this.players.splice(this.players.indexOf(socketPlayer), 1);
  console.log(this.getGameData());
};

Game.prototype.getPlayerList = function () {
  var reList = [];
  for (var i = 0; i < this.players.length; i++) {
    reList.push(this.players[i].player)
  }
  return reList;
};

var Food = function (){
  this.x;
  this.y;
}

Food.prototype.FindNewLocation = function (width, height) {
  this.x = randomInt(0, width);
  this.y = randomInt(0, height);
};

Food.prototype.getData = function () {
  return {
    x: this.x,
    y: this.y
  }
};

var Player = function () {
  this.tail = [];
}

Player.prototype.checkCollision = function (points) {
  for (var i = 0; i < points.length; i++) {
    if (this.x === points[i].x && this.y === points[i].y){
      if (points[i] instanceof Food){
        points[i].splice(i, 1);
      }
      return true;
    }
  }
  return false;
};

Player.prototype.addTail = function (x, y) {
  if (this.tail.length > 0){
    this.tail.push({
      x: this.tail[this.tail.length - 1].x,
      y: this.tail[this.tail.length - 1].y
    })
  }
  else{
    this.tail.push({
      x: this.x,
      y: this.y
    });
  }
};

Player.prototype.move = function () {
  this.moveTail();
  this.x += this.xSpeed;
  this.y += this.ySpeed;
};

Player.prototype.moveTail = function () {
  if (this.tail.length > 0){
    for (var i = this.tail.length - 1; i > 0; i--) {
      this.tail[i].x = this.tail[i - 1].x;
      this.tail[i].y = this.tail[i - 1].y;
    }

    this.tail[0].x = this.x;
    this.tail[0].y = this.y;
  }
};

Player.prototype.getData = function () {
  return {
    x: this.x,
    y: this.y,
    tail: this.tail,
    id: this.id
  }
};

Player.prototype.destory = function () {

};

app.use( express.static( __dirname + '/client' ));
app
  .get( '/', function( req, res ) {
    res.sendFile( path.join( __dirname, 'client', 'index.html' ));
  });

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var game = new Game(io);

io.on('connection', (socket) => {

  socket.on('newPlayer', function() {
    game.addPlayer(socket);
  });

  socket.on('onMove', function(data){

  });

  socket.on('disconnect', function(){
    if (socket.player){
      game.removePlayer(socket);
    }
  });
});
