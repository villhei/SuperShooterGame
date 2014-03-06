var util = require("util"),
    io = require("socket.io"),
    fs = require("fs"),
    connect = require("connect"),
    config = require('./public/commonjs/config')

Ship = require("./public/commonjs/Ship").Ship;
Player = require("./public/commonjs/Player").Player;
Vector = require("./public/commonjs/Vector").Vector;
Game = require("./public/commonjs/Game").Game;
GameState = require('./public/commonjs/GameState').GameState;
Projectile = require('./public/commonjs/Projectile').Projectile;
Missile = require('./public/commonjs/Missile').Missile;
Asteroid = require('./public/commonjs/Asteroid').Asteroid;
var LOG_PING = false;

var socket,
    GAME,
    config;

function init() {

    GAME = new Game();
    GAME.serverInstance = true;

    config.init('gameconfig.json', function (resp) {
        if (resp != 0) {
            util.log('Could not load config file.');
            return;
        }
        util.log("**** CONFIG READ ****");
        util.log("SizeX: " + config.sizeX);
        util.log("SizeY: " + config.sizeY);
        util.log("RespawnTime: " + config.respawnTime);
        util.log("Updates/s  : " + config.updatesPerSecond);

        GAME.area = {
            sizeX: config.sizeX || 800,
            sizeY: config.sizeY || 600
        }

        GAME.cannon.velocity = config.cannon.velocity;
        GAME.cannon.fireDelay = config.cannon.fireDelay;
        GAME.cannon.reloadDelay = config.cannon.reloadDelay;
        GAME.missile.velocity = config.missile.velocity;
        GAME.missile.fireDelay = config.missile.fireDelay;

        GAME.respawnTime = config.respawnTime || 1000;
      GAME.updatesPerSecond = config.updatesPerSecond;
        GAME.max_speed = config.max_speed;
        GAME.max_idle_time = config.max_idle_time;
    });

    /*
     HOST the client files
     */

    connect.createServer(
        connect.static(__dirname + "/public")
    ).listen(8080);

    /*
     Set up socket.IO
     */

    socket = io.listen(8888);
    socket.configure(function () {
        socket.set("transports", ["websocket"]);
        socket.set("log level", 2);
    });

    setEventHandlers();
    GAME.spawnAsteroid();
    GAME.spawnAsteroid();
    GAME.spawnAsteroid();

    GAME.run(function clientStateUpdate(updatedGameState) {
        var clients = socket.sockets.clients(); // This returns an array with all connected clients
        clients.forEach(function (client) {
            client.volatile.emit('state update', updatedGameState)
        })
    });
};

var setEventHandlers = function () {
    socket.sockets.on("connection", onSocketConnection);
};

function onSocketConnection(clientSocket) {
    util.log("New player has connected: " + clientSocket.id);
    var startTime = 0;

    clientSocket.on("disconnect", onClientDisconnect);
    clientSocket.on("new player", onNewPlayer);
    clientSocket.on("update player", onUpdatePlayer);
    clientSocket.on("change name", onChangePlayerName);
    clientSocket.on('pong', function () {
        var player = GAME.state.playerById(clientSocket.id);
        var latency = Date.now() - startTime;
        player.setPing(latency);
        if (LOG_PING) {
            util.log("Ping for " + clientSocket.id + ": " + latency + "ms");
        }
    });


    var ping = setInterval(function () {
        startTime = Date.now();
        clientSocket.volatile.emit('ping');
    }, 1000);
};

function onClientDisconnect() {
    util.log("Player has disconnected: " + this.id);

    if (!GAME.removePlayer(this.id)) {
        util.log("Player not found for removal: " + this.id);
        return;
    }
    this.broadcast.emit("remove player", {id: this.id});
};

function onUpdatePlayer(movementData) {
    if (movementData.nothing) {
        idleCheck(this);
    }

    if (!GAME.updatePlayerInput(this.id, movementData)) {
        util.log("Player not found for input update: " + this.id);
        return;
    }
};

function idleCheck(socket) {
    var timeNow = new Date().getTime();
    if (!socket.lastUpdate) {
        socket.lastUpdate = timeNow;
    } else {
        if (socket.lastUpdate + GAME.max_idle_time <= timeNow) {
            util.log("Disconnecting client " + socket.id + " for inactivity, exceeded idle time: " + GAME.max_idle_time);
            socket.broadcast.emit("remove player", {id: socket.id});
            socket.disconnect();
        }
    }
}

function onNewPlayer(data) {

    var newPlayer = new Player(this.id);
    GAME.respawnShip(newPlayer);

    newPlayer.setName(data.name);
    console.log("New player connected: " + newPlayer);

    this.broadcast.emit("new player", newPlayer.toJSON());
    this.emit("register client", newPlayer.toJSON());

    var i, existingPlayer;
    for (i = 0; i < GAME.state.players.length; i++) {
        existingPlayer = GAME.state.players[i];
        this.emit("new player", existingPlayer.toJSON());
    }
    ;

    GAME.state.players.push(newPlayer);
};

function onChangePlayerName(data) {
    util.log(this.id + " renamed to " + data.name);
    var player = GAME.state.playerById(this.id);
    player.setName(data.name);

}


init();

