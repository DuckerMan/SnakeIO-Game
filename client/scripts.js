var c = document.getElementById("canvas");
var ctx = c.getContext("2d");

var socket = io();

socket.on("update", (data) => {
  console.log(data);
});

var midX = 0;
var midY = 0;

var otherX = 0;
var otherY = 120;

initCanvas();
renderBackground();

function initCanvas() {
    $('#canvas').attr("width",$(window).width());
   $('#canvas').attr("height",$(window).height());
}

function renderBackground(){
  requestAnimationFrame(renderBackground);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  midX -= 0.5;
  midY -= 0.25;
  var scrollX = midX - canvas.width / 2;
  var scrollY = midY - canvas.height / 2;

  for (var i = 0; i < canvas.width / 64; i++) {
    ctx.beginPath();
    ctx.moveTo(64 * i - (scrollX % 64), 0);
    ctx.lineTo(64 * i - (scrollX % 64), canvas.height);
    ctx.stroke();
  }

  for (var i = 0; i < canvas.width / 64; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 64 * i - (scrollY % 64));
    ctx.lineTo(canvas.width, 64 * i - (scrollY % 64));
    ctx.stroke();
  }

  ctx.moveTo(0,0);
  ctx.beginPath();
  ctx.arc(midX - scrollX,midY - scrollY,50,0,2*Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(otherX - scrollX,otherY - scrollY,50,0,2*Math.PI);
  ctx.stroke();
}

function renderDirection(){

}
