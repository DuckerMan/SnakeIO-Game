var express = require('express');
app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);

function randomInt(min, max){
  return Math.floor(Math.random() * (max - min)) + min;
}

var Game = function (server){
  this.server = server;
  this.width = 100;
  this.height = 100;
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
    reList.push(items[i].getData());
  }
  return reList;
};

Game.prototype.startGame = function () {
  setInterval(() => {
    this.update();
  }, 50);
};

Game.prototype.update = function () {
  this.checkCollision();
  this.move();
  this.server.emit("update", this.getGameData());

  if (Math.random() < 0.1){
    this.food.push(new Food(randomInt(0, this.width), randomInt(0, this.height)));
  }
};

Game.prototype.dead = function (player) {
  console.log(player.id);
  player.emit("dead", player.id);
  this.removePlayer(player);
};

Game.prototype.checkCollision = function () {
  for (var i = 0; i < this.players.length; i++) {
    if (this.checkTail(this.players[i].player, this.getPlayerList()) || this.checkOutSide(this.players[i].player)){
      this.dead(this.players[i]);
      i--;
    }
    else if (this.players[i].player.checkCollision(this.food)){
      this.players[i].player.addTail();
    }
  }
};

Game.prototype.checkTail = function (player, playerList) {
  for (var i = 0; i < playerList.length; i++) {
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

Game.prototype.checkOutSide = function (ply) {
  if (ply.x >= 0 && ply.x < this.width && ply.y >= 0 && ply.y < this.height){
    return false;
  }
  return true;
};

Game.prototype.addPlayer = function (socketPlayer) {
  socketPlayer.player = new Player(socketPlayer.id);
  console.log(socketPlayer.id)
  socketPlayer.player.x = randomInt(0, this.width);
  socketPlayer.player.y = randomInt(0, this.height);
  socketPlayer.player.xSpeed = 0;
  socketPlayer.player.ySpeed = 1;
  socketPlayer.player.color = "#00FF00";
  this.players.push(socketPlayer);
};

Game.prototype.removePlayer = function (socketPlayer) {
  this.players[this.players.indexOf(socketPlayer)].player.destroy();
  this.players.splice(this.players.indexOf(socketPlayer), 1);
};

Game.prototype.getPlayerList = function () {
  var reList = [];
  for (var i = 0; i < this.players.length; i++) {
    reList.push(this.players[i].player)
  }
  return reList;
};

var Food = function (x, y){
  this.x = x;
  this.y = y;
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

var Player = function (id) {
  this.tail = [];
  this.id = id;
}

Player.prototype.checkCollision = function (points) {
  for (var i = 0; i < points.length; i++) {
    if (this.x === points[i].x && this.y === points[i].y){
      if (points[i] instanceof Food){
        points.splice(i, 1);
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
    id: this.id,
    color: this.color
  }
};

Player.prototype.destroy = function () {

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
  console.log("Connected on: " + socket.id)
  socket.emit("id", socket.id);
  socket.on('newPlayer', function() {
    game.addPlayer(socket);
  });

  socket.on('move', (key) => {
    switch (key) {
      case 38:
        socket.player.xSpeed = 0;
        socket.player.ySpeed = -1;
        break;
      case 39:
        socket.player.xSpeed = 1
        socket.player.ySpeed = 0
        break;
      case 40:
        socket.player.xSpeed = 0
        socket.player.ySpeed = 1
        break;
      case 37:
        socket.player.xSpeed = -1;
        socket.player.ySpeed = 0
        break;
      default:

    }
  });
});
