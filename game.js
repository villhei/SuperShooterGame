var util = require("util"),
    io = require("socket.io"),
    fs = require("fs"),
    connect = require("connect"),
    GameState = require('./public/commonjs/GameState').GameState,
    config = require('./public/commonjs/config')
Player = require("./public/commonjs/Player").Player;

var socket,
    gameState,
    gameTickCount,
    updateQueue,
    config;


var tickCount = 0;
function init() {

    config.init('gameconfig.json', function (resp) {
        if (resp != 0) {
            console.log('Could not load config file.');
            return;
        }
        console.log('sizeX, sizeY: ' + config.sizeX + ',' + config.sizeY);
    });
    gameState = new GameState();
    gameTickCount = 0;
    connect.createServer(
        connect.static(__dirname + "/public")
    ).listen(80);

    socket = io.listen(8000);

    socket.configure(function () {
        socket.set("transports", ["websocket"]);
        socket.set("log level", 2);
    });

    setEventHandlers();

    var gameTicks = setInterval(function() {
        gameTickCount++;
        updateClientStates();
    }, 1000/30);

};

var setEventHandlers = function () {
    socket.sockets.on("connection", onSocketConnection);
};

function onSocketConnection(clientSocket) {
    util.log("New player has connected: " + clientSocket.id);

    clientSocket.on("disconnect", onClientDisconnect);
    clientSocket.on("new player", onNewPlayer);
    clientSocket.on("move player", onMovePlayer);
};

function onClientDisconnect() {
    util.log("Player has disconnected: " + this.id);
    var removePlayer = gameState.playerById(this.id);

    if (!removePlayer) {
        util.log("Player not found: " + this.id);
        return;
    }
    ;

    gameState.players.splice(gameState.players.indexOf(removePlayer), 1);
    this.broadcast.emit("remove player", {id: this.id});
};

function onMovePlayer(movementData) {
    var targetPlayer = gameState.playerById(this.id);

    if (!targetPlayer) {
        util.log("Player not found: " + this.id);
        return;
    }
    ;

    targetPlayer.move(movementData.x, movementData.y);

    var response = targetPlayer.toJSON();

};

function onNewPlayer(data) {
    // Player position comes here

    // Calculate a random start position for the local player
    // The minus 5 (half a player size) stops the player being
    // placed right on the egde of the screen

    var startX = Math.round(Math.random() * (config.sizeX)),
        startY = Math.round(Math.random() * (config.sizeY));

    // Initialise the new player
    var newPlayer = new Player(this.id, startX, startY);

    newPlayer.setName(data.name);

    console.log("New player connected: " + newPlayer);

    this.broadcast.emit("new player", newPlayer.toJSON());
    this.emit("clientUpdate", newPlayer.toJSON());

    var i, existingPlayer;
    for (i = 0; i < gameState.players.length; i++) {
        existingPlayer = gameState.players[i];
        this.emit("new player", existingPlayer.toJSON());
    }
    ;

    gameState.players.push(newPlayer);
};

function updateClientStates() {

    var payload = packGameData();

    var clients = socket.sockets.clients(); // This returns an array with all connected clients

    for ( i = 0; i < clients.length; i++ ) {
        clients[i].emit('gamestate_update', payload);
    }
}


function packGameData() {
    var players = [];

    var i;
    for (i = 0; i < gameState.players.length; ++i) {
        players.push(gameState.players[i].toJSON());
    }
    return {
        tick: gameTickCount,
        players: players
    }
}

init();

