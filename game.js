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

var GAME = {};

var tickCount = 0;
function init() {

    config.init('gameconfig.json', function (resp) {
        if (resp != 0) {
            console.log('Could not load config file.');
            return;
        }
        GAME.area = {
            sizeX: config.sizeX || 800,
            sizeY: config.sizeY || 600
        }

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

    var gameTicks = setInterval(function () {
        gameTickCount++;
        updateClientStates();
    }, 1000 / 30);

};

var setEventHandlers = function () {
    socket.sockets.on("connection", onSocketConnection);
};

function onSocketConnection(clientSocket) {
    util.log("New player has connected: " + clientSocket.id);
    var startTime = 0;

    clientSocket.on("disconnect", onClientDisconnect);
    clientSocket.on("new player", onNewPlayer);
    clientSocket.on("move player", onMovePlayer);
    clientSocket.on("change name", onChangePlayerName);
    clientSocket.on('pong', function () {
        var player = gameState.playerById(clientSocket.id);

        var latency = Date.now() - startTime;
        player.setPing(latency);
        util.log("Ping for " + clientSocket.id + ": " + latency + "ms");
    });


    var ping = setInterval(function () {
        startTime = Date.now();
        clientSocket.emit('ping');
    }, 1000);
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
    targetPlayer.addVel_x(movementData.accel_x);
    targetPlayer.addVel_y(movementData.accel_y);

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

function onChangePlayerName(data) {
    util.log(this.id + " renamed to " + data.name);
    var player = gameState.playerById(this.id);
    player.setName(data.name);

}

function updateClientStates() {
    runGameCycle();
    var payload = packGameData();

    var clients = socket.sockets.clients(); // This returns an array with all connected clients

    for (i = 0; i < clients.length; i++) {
        clients[i].emit('gamestate_update', payload);
    }
}

function runGameCycle() {
    function movePlayers() {
        for (var i = 0; i < gameState.players.length; ++i) {
            var player = gameState.players[i];
            moveEntity(player);
        }
    }

    movePlayers();
}

function moveEntity(movableEntity) {

    var me = movableEntity;
    me.setX(me.getX() + me.getVel_x());
    me.setY(me.getY() + me.getVel_y());

    if (me.getX() < 0) {
        me.setX(GAME.area.sizeX);
    }
    if (me.getX() > GAME.area.sizeX) {
        me.setX(0);
    }
    if (me.getY() < 0) {
        me.setY(GAME.area.sizeY);
    }
    if (me.getY() > GAME.area.sizeY) {
        me.setY(0);
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

