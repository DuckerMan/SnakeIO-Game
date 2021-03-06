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
  this.tileSize = 24;
  this.amountOfFood = 10;
  this.foodTimer = 0;
  this.foodLifetime = 250;

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
  }, 40);
};

Game.prototype.update = function () {
  this.checkCollision();
  this.move();
  // this.checkDead();
  this.updateFood();
  this.server.emit("update", this.getGameData());
};

Game.prototype.placeFood = function () {
  for (var i = 0; i < this.amountOfFood * this.players.length; i++) {
    var food = new Food(-10, -10, this.foodLifetime);
    food.FindNewLocation(this.width, this.height);
    this.food.push(food);
  }
};

Game.prototype.dead = function (player) {
  player.emit("dead", player.id);
  this.removePlayer(player);
};

Game.prototype.checkCollision = function () {
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].player != null) {
      if (this.checkTail(this.players[i].player, this.getPlayerList()) || this.checkOutSide(this.players[i].player)){
        this.dead(this.players[i]);
        i--;
      }
      else if (this.players[i].player.checkCollision(this.food, this.width, this.height)){
        this.players[i].player.addTail();
      }
    }
  }
};

Game.prototype.checkTail = function (player, playerList) {
  for (var i = 0; i < playerList.length; i++) {
    if (playerList[i] != null){
      if (player.checkCollision(playerList[i].tail)){
        return true;
      }
    }
  }
  return false;
};

Game.prototype.checkHead = function (playerOne) {
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].player != null && playerOne.player != null && this.players[i] != playerOne){
      if (playerOne.player.x == this.players[i].player.x && playerOne.player.y == this.players[i].player.y){
        var win = this.getWinner(playerOne, this.players[i]);

        if (Array.isArray(win)){
          for (var i = 0; i < win.length; i++) {
            win[i].player.dead = true;
          }
        }else{
          win.player.dead = true;
        }
      }
    }
  }
};

Game.prototype.getWinner = function (player1, player2) {
  if (player1.player.tail.length > player2.player.tail.length) return player2;
  else if (player1.player.tail.length < player2.player.tail.length) return player1;
  else return [player1, player2];
};



Game.prototype.move = function () {
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].player != null) {
      this.players[i].player.move();
      // this.checkHead(this.players[i]);
    }
  }
};

Game.prototype.updateFood = function () {
  for (var i = 0; i < this.food.length; i++) {
    this.food[i].update();

    if (this.food[i].lifetime <= 0){
      this.food.splice(i, 1);
      i--;
    }
  }

  if (this.foodTimer <= 0){
    this.placeFood();
    this.foodTimer = this.foodLifetime;
  }
  this.foodTimer--;
};

Game.prototype.checkOutSide = function (ply) {
  if (ply.x >= 0 && ply.x < this.width && ply.y >= 0 && ply.y < this.height){
    return false;
  }
  return true;
};

Game.prototype.addPlayer = function (socketPlayer, data) {
  socketPlayer.player = null;
  socketPlayer.player = new Player(socketPlayer.id, data.name, data.color);
  socketPlayer.player.x = randomInt(0, this.width);
  socketPlayer.player.y = randomInt(0, this.height);
  socketPlayer.player.tempXSpeed = 0;
  socketPlayer.player.tempYSpeed = 0;
  socketPlayer.player.xSpeed = 0;
  socketPlayer.player.ySpeed = 0;
  this.players.push(socketPlayer);
};

Game.prototype.checkDead = function () {
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].player != null){
      if (this.players[i].player.dead){
        this.dead(this.players[i]);
        i--;
      }
    }
  }
};

Game.prototype.removePlayer = function (socketPlayer) {
  this.players[this.players.indexOf(socketPlayer)].player.destroy(this.food, this.foodLifetime);
  this.players.splice(this.players.indexOf(socketPlayer), 1);
  socketPlayer.player = null;
};

Game.prototype.getPlayerList = function () {
  var reList = [];
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].player != null){
      reList.push(this.players[i].player)
    }
  }
  return reList;
};

var Food = function (x, y, lifetime){
  this.x = x;
  this.y = y;
  this.lifetime = lifetime;
}

Food.prototype.FindNewLocation = function (width, height) {
  this.x = randomInt(0, width);
  this.y = randomInt(0, height);
};

Food.prototype.update = function () {
  this.lifetime--;
};

Food.prototype.getData = function () {
  return {
    x: this.x,
    y: this.y
  }
};

var Player = function (id, name, color) {
  this.tail = [];
  this.id = id;
  this.name = name;
  this.color = color;
}

Player.prototype.checkCollision = function (points, width, height) {
  for (var i = 0; i < points.length; i++) {
    if (this.x === points[i].x && this.y === points[i].y){
      if (points[i] instanceof Food){
        points.splice(i, 1);
        i--;
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

  this.xSpeed = this.tempXSpeed;
  this.ySpeed = this.tempYSpeed;

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
    color: this.color,
    name: this.name
  }
};

Player.prototype.setSpeed = function (x, y) {
  if (this.xSpeed != x && this.ySpeed != y || this.tail.length <= 0){
    this.tempXSpeed = x;
    this.tempYSpeed = y;
  }
};

Player.prototype.destroy = function (food, lifetime) {
  for (var i = 0; i < this.tail.length; i++) {
    if (Math.random() < 0.7){
      var tempFood = new Food(0, 0, lifetime);
      tempFood.x = this.tail[i].x;
      tempFood.y = this.tail[i].y;
      food.push(tempFood);
    }
  }
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
  socket.on('newPlayer', function(data) {
    if (data.name == null || data.name.length === 0 || data.name.length > 20){
      data.name = "Noob";
    }
    game.addPlayer(socket, data);
  });

  socket.on('move', (key) => {
    if (socket.player != null){
      if (key == 87 || key == 38) socket.player.setSpeed(0,-1);
      else if (key == 68 || key == 39) socket.player.setSpeed(1,0);
      else if (key == 83 || key == 40) socket.player.setSpeed(0,1);
      else if (key == 65 || key == 37) socket.player.setSpeed(-1,0);
    }
  });

  socket.on("disconnect", () => {
    if (socket.player != null){
      game.removePlayer(socket);
    }
    else{
      console.log("Disconnected without player");
    }
    console.log("Socket: " + socket + " Disconneted");
  })
});
