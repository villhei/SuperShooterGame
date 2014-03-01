/**************************************************
 ** GAME VARIABLES
 **************************************************/
var canvas,			// Canvas DOM element
    ctx,			// Canvas rendering context
    keys,			// Keyboard input
    gameState,      // The game state global
    localPlayer,	// Local player
    socket,         // The socket
    responseTime;   // Helper to measure ping time

var GameState = exports.GameState;
var Player = exports.Player;

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

    socket = io.connect("http://localhost", {port: 8000, transports: ["websocket"]});

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
    socket.on("gamestate_update", onGameStateUpdate);

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
    for (var i = 0; i < data.players.length; ++i) {
        var playerInfo = data.players[i];
        var player = gameState.playerById(playerInfo.id);
        player.setX(playerInfo.x);
        player.setY(playerInfo.y);
        player.setName(playerInfo.name);
        player.setPing(playerInfo.ping);
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

    movePlayers();

    function movePlayers() {
        var movement;
        if (localPlayer) {
            if (movement = updateClientInput(keys)) {
                movement.id = localPlayer.id;
                console.log(movement);
                socket.emit("move player", movement);
            }
        }
    }
};

function updateClientInput(keys) {

    var accel_x = 0,
        accel_y = 0;

    var acceleration = localPlayer.acceleration;

    // Up key takes priority over down
    if (keys.up) {
        accel_y -= acceleration;
    } else if (keys.down) {
        accel_y += acceleration;
    }
    ;

    // Left key takes priority over right
    if (keys.left) {
        accel_x -= acceleration;
    } else if (keys.right) {
        accel_x += acceleration    }
    ;
    return accel_x == 0 && accel_y == 0 ? false : {
        accel_x: accel_x,
        accel_y: accel_y
    }
};


/**************************************************
 ** GAME DRAW
 **************************************************/
function draw() {
    // Wipe the canvas clean
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Draw players */

    var i;
    for (i = 0; i < gameState.players.length; i++) {
        drawPlayer(gameState.players[i]);
    }
    ;

    drawDebugData();

    function drawText(text, x, y, color) {
        var fontSize = 12;
        var fontStyle = 'Arial';
        var fontColor = color || '#000';

        ctx.font = fontSize + 'px ' + fontStyle;
        ctx.fillStyle = fontColor;

        ctx.fillText(text, x, y);
    }

    function drawPlayer(player) {
        var fillStyle = player.id === localPlayer.id ? '#f00' : '#000';
        ctx.fillStyle = fillStyle;
        ctx.fillRect(player.getX() - 5, player.getY() - 5, 10, 10);
        drawText(player.getName(), player.getX(), player.getY())
    };

    function drawDebugData() {
        var boxwidth = 200;
        var boxheight = 50;

        var box_x = 300;
        var box_y = 0;

        var padding = 5;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.fillRect(box_x, box_y, boxwidth, boxheight);

        var text = 'Game tick: ' + gameState.ticks.last_server;
        drawText(text, box_x + padding, box_y + 15)
        var text2 = 'Ping: ' + localPlayer.getPing() + " ms";
        drawText(text2, box_x + padding, box_y + 30)


    }

};