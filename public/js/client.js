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

/**************************************************
 ** GAME INITIALISATION
 **************************************************/
function init() {
    // Declare the canvas and rendering context
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    // Maximise the canvas
    canvas.width = 800;
    canvas.height = 600;

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
    console.log(name);
    localPlayer.setName(name);
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

        if (playerInfo.name != player.getName()) {
            player.setName(playerInfo.name);
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

    var movement;
    if (localPlayer) {
        if (movement = updateClientInput(keys)) {
            movement.id = localPlayer.id;
            socket.emit("move player", movement);
        }
    }
};

function updateClientInput(keys) {

    var deltaX = 0,
        deltaY = 0;

    var moveAmount = localPlayer.moveAmount;

    // Up key takes priority over down
    if (keys.up) {
        deltaY -= moveAmount;
    } else if (keys.down) {
        deltaY += moveAmount;
    }
    ;

    // Left key takes priority over right
    if (keys.left) {
        deltaX -= moveAmount;
    } else if (keys.right) {
        deltaX += moveAmount;
    }
    ;
    return deltaX == 0 && deltaY == 0 ? false : {
        x: deltaX,
        y: deltaY
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

        var text = 'Game tick: ' + gameState.ticks.last_server;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.fillRect(box_x, box_y, boxwidth, boxheight);

        drawText(text, box_x + padding, box_y + 15)


    }

};