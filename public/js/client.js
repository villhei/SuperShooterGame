/**************************************************
 ** GAME VARIABLES
 **************************************************/
var canvas,			// Canvas DOM element
    ctx,			// Canvas rendering context
    keys,			// Keyboard input
    gameState,      // The game state global
    localPlayer,	// Local player
    socket;         // The socket

var GameState = exports.GameState;
var Player = exports.Player;
var Ship = exports.Ship;
var Vector = exports.Vector;
var Projectile = exports.Projectile;

var canvas_width = 800;
var canvas_height = 600;

/**************************************************
 ** GAME INITIALISATION
 **************************************************/
function init() {
    // Declare the canvas and rendering context
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    // Maximise the canvas
    canvas.width = canvas_width;
    canvas.height = canvas_height;

    localPlayer = new Player();
    // Initialise keyboard controls
    keys = new Keys();

    socket = io.connect("http://tunkki.plop.fi", {port: 8888, transports: ["websocket"]});

    gameState = new GameState();

    gameState.players.push(localPlayer);

    // Start listening for events
    setEventHandlers();
};

function setName() {
    var name = document.getElementById('playerName').value;
    socket.emit("change name", {name: name});

}


/**************************************************
 ** GAME EVENT HANDLERS
 **************************************************/
var setEventHandlers = function () {
    // Keyboard
    window.addEventListener("keydown", onKeydown, false);
    window.addEventListener("keyup", onKeyup, false);

    // Window resize
    //  window.addEventListener("resize", onResize, false);

    socket.on("connect", onSocketConnected);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("new player", onNewPlayer);
    socket.on("clientUpdate", onClientUpdate);
    socket.on("update player", onUpdatePlayer);
    socket.on("remove player", onRemovePlayer);
    socket.on("state update", onGameStateUpdate);

    socket.on('ping', function () {
        socket.emit('pong');
    });
};

// Keyboard key down
function onKeydown(e) {
    if (localPlayer) {
        keys.onKeyDown(e);
    }
    ;
};

// Keyboard key up
function onKeyup(e) {
    if (localPlayer) {
        keys.onKeyUp(e);
    }
    ;
};

// Browser window resize
function onResize(e) {
    // Maximise the canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

function onSocketConnected() {
    console.log("Connected to socket server");
    socket.emit("new player", {name: "WebClient"});
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};


function onClientUpdate(data) {
    localPlayer.setX(data.x);
    localPlayer.setY(data.y);
    localPlayer.id = data.id;
    localPlayer.setName(data.name);

}
function onNewPlayer(data) {
    var newPlayer = new Player(data.id, data.x, data.y);
    newPlayer.id = data.id;

    console.log("New player connected: " + newPlayer);
    gameState.players.push(newPlayer);
};

function onUpdatePlayer(data) {
    var movePlayer = gameState.playerById(data.id);

    if (!movePlayer) {
        console.log("Player not found: " + data.id);
        return;
    }
    ;

    movePlayer.setX(data.x);
    movePlayer.setY(data.y);
};

function onRemovePlayer(data) {
    var removePlayer = gameState.playerById(data.id);

    if (!removePlayer) {
        console.log("Player not found: " + data.id);
        return;
    }
    ;

    gameState.players.splice(gameState.players.indexOf(removePlayer), 1);

};

function onGameStateUpdate(data) {
    gameState.ticks.last_server = data.tick;
    updatePlayers();
    updateProjectiles();
    function updateProjectiles() {
        gameState.projectiles = [];
        for (var i = 0; i < data.projectiles.length; ++i) {
            var rp = data.projectiles[i];
            var projectile = new Projectile(new Vector(rp.x, rp.y), new Vector(rp.vel_x, rp.vel_y))
            gameState.projectiles.push(projectile);
        }
    }

    function updatePlayers() {
        for (var i = 0; i < data.players.length; ++i) {
            var playerInfo = data.players[i];
            var player = gameState.playerById(playerInfo.id);
            if (player) {
                player.setJSON(playerInfo);
                console.log(playerInfo.score);
            }
        }
    }

}


/**************************************************
 ** GAME ANIMATION LOOP
 **************************************************/
function animate() {
    draw();
    // Request a new animation frame using Paul Irish's shim
    window.requestAnimFrame(animate);
};


function runGame() {
    window.setInterval(update, 1000 / 30);
}


/**************************************************
 ** GAME UPDATE
 **************************************************/
function update() {

    var payload;
    if (localPlayer) {
        payload = updateClientInput(keys);
        socket.emit("update player", payload);
    }

};

function updateClientInput(keys) {

    var vertical_accel = 0,
        horizontal_accel = 0,
        firing = false;

    // Up key takes priority over down
    if (keys.up) {
        horizontal_accel = 1;
    } else if (keys.down) {
        horizontal_accel = -1;
    }

    // Left key takes priority over right
    if (keys.left) {
        vertical_accel = -1;
    } else if (keys.right) {
        vertical_accel = 1
    }

    if (keys.space) {
        firing = true;
    }
    return {
        accel_x: vertical_accel,
        accel_y: horizontal_accel,
        firing: firing
    }
};


/**************************************************
 ** GAME DRAW
 **************************************************/
function draw() {
    // Wipe the canvas clean
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function fillBackGround(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    /* Draw players */

    fillBackGround(ctx, "#000");

    var i;
    for (i = 0; i < gameState.players.length; i++) {
        var player = gameState.players[i];
        drawText(player.getName(), player.getX(), player.getY() + 2 * player.ship.size);

        if (player.id === localPlayer.id) {
            drawShip(ctx, player.ship, "#29C920");
        } else {
            drawShip(ctx, player.ship, "#33A0D6");
        }

    }
    for (i = 0; i < gameState.projectiles.length; i++) {
        drawProjectile(ctx, gameState.projectiles[i]);
    }

    drawDebugData();

    function drawText(text, x, y, color) {
        var fontSize = 12;
        var fontStyle = 'Arial';
        var fontColor = color || '#fff';

        ctx.font = fontSize + 'px ' + fontStyle;
        ctx.fillStyle = fontColor;

        ctx.fillText(text, x, y);
    }

    function drawShip(ctx, ship, shipColor) {
        var left = ship.getLeft();
        var right = ship.getRight();
        var head = ship.getHead();
        var position = ship.getPosition();
        var color = ship.alive ? shipColor : "#748599";

        ctx.strokeStyle = '#E9F2F7';
        ctx.beginPath();
        ctx.moveTo(head.x, head.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(position.x, position.y);
        ctx.lineTo(right.x, right.y);
        ctx.lineTo(head.x, head.y);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }


    function drawProjectile(ctx, projectile) {
        var position = projectile.position;
        var projectile_size = 2;
        var projectile_color = '#fff'
        var oldStyle = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(position.x, position.y, projectile_size, 0, 2 * Math.PI, false);
        ctx.fillStyle = projectile_color;
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = oldStyle;
    }

    function drawDebugData() {
        var boxwidth = 200;
        var boxheight = 50;

        var box_x = 300;
        var box_y = 0;

        var padding = 5;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fillRect(box_x, box_y, boxwidth, boxheight);

        var text = 'Game tick: ' + gameState.ticks.last_server;
        drawText(text, box_x + padding, box_y + 15);
        var text2 = 'Ping: ' + localPlayer.getPing() + " ms";
        drawText(text2, box_x + padding, box_y + 30);
        var text3 = 'Score: ' + localPlayer.score + " points";

        drawText(text3, box_x + padding, box_y + 45);

    }

};