var util = require("util"),
    io = require("socket.io"),
    fs = require("fs"),
    connect = require("connect"),
    config = require('./public/commonjs/config')

Ship = require("./public/commonjs/Ship").Ship;
Player = require("./public/commonjs/Player").Player;
Vector = require("./public/commonjs/Vector").Vector;
GameState = require('./public/commonjs/GameState').GameState;
Projectile = require('./public/commonjs/Projectile').Projectile;

var LOG_PING = false;

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
            util.log('Could not load config file.');
            return;
        }
        util.log("**** CONFIG READ ****");
        util.log("SizeX: " + config.sizeX);
        util.log("SizeY: " + config.sizeY);
        util.log("RespawnTime: " + config.respawnTime);

        GAME.area = {
            sizeX: config.sizeX || 800,
            sizeY: config.sizeY || 600
        }
        GAME.respawnTime = config.respawnTime || 1000;

    });
    gameState = new GameState();


    gameTickCount = 0;
    connect.createServer(
        connect.static(__dirname + "/public")
    ).listen(8080);

    socket = io.listen(8888);

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
    clientSocket.on("update player", onUpdatePlayer);
    clientSocket.on("change name", onChangePlayerName);
    clientSocket.on('pong', function () {
        var player = gameState.playerById(clientSocket.id);
        var latency = Date.now() - startTime;
        player.setPing(latency);
        if (LOG_PING) {
            util.log("Ping for " + clientSocket.id + ": " + latency + "ms");
        }
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

function onUpdatePlayer(movementData) {
    var targetPlayer = gameState.playerById(this.id);
    if (!targetPlayer) {
        util.log("Player not found: " + this.id);
        return;
    }
    ;
    if (movementData.accel_x < 0) {
        targetPlayer.ship.turnLeft();
    } else if (movementData.accel_x > 0) {
        targetPlayer.ship.turnRight();
    }
    if (movementData.accel_y == 1) {
        targetPlayer.ship.accelerate();
    }

    if (movementData.firing) {
        targetPlayer.ship.firing_primary = true;
    } else {
        targetPlayer.ship.firing_primary = false;
    }

};

function onNewPlayer(data) {
    // Player position comes here

    // Calculate a random start position for the local player
    // The minus 5 (half a player size) stops the player being
    // placed right on the egde of the screen


    // Initialise the new player
    var newPlayer = new Player(this.id);
    respawnShip(newPlayer);

    newPlayer.setName(data.name);
    console.log("New player connected: " + newPlayer);

    this.broadcast.emit("new player", newPlayer.toJSON());
    this.emit("register client", newPlayer.toJSON());

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
        clients[i].emit('state update', payload);
    }
}

function respawnShip(player) {
    var startX = Math.round(Math.random() * (GAME.area.sizeX)),
        startY = Math.round(Math.random() * (GAME.area.sizeY));
    player.ship = new Ship(startX, startY, player.id);
}

function runGameCycle() {
    function updatePlayers() {
        for (var i = 0; i < gameState.players.length; ++i) {
            var player = gameState.players[i];
            if (player.ship.alive) {
                player.ship.move();
                checkAreaBounds(player.ship);
                if (player.ship.firing_primary) {
                    fireProjectile(player.ship);
                }
            } else {
                var timeNow = new Date().getTime();

                if (player.ship.deathTime + GAME.respawnTime <= timeNow) {
                    util.log("Respawning player " + player);
                    respawnShip(player);
                }
            }
        }
    }

    function updateProjectiles() {
        var activeProjectiles = gameState.projectiles.filter(function (element) {
            return element.alive;
        });
        for (var i = 0; i < activeProjectiles.length; ++i) {
            var projectile = activeProjectiles[i];
            if (projectile.alive) {
                projectile.move();
                checkAreaBounds(projectile);
                checkProjectileCollision(projectile)
            }
        }
        gameState.projectiles = activeProjectiles;
    }

    function checkProjectileCollision(projectile) {
        gameState.players.forEach(function (player) {
            if (projectile.position.distance(player.ship.getPosition()) <= player.ship.size) {
                if (player.id != projectile.id && player.ship.alive) {
                    player.ship.health -= projectile.damage;
                    if (player.ship.health < 0) {
                        player.ship.alive = false;
                        player.ship.deathTime = new Date().getTime();
                        util.log("projectileid: " + projectile.id);
                        var killer = gameState.playerById(projectile.id);
                        if (killer) {
                            util.log(killer + " killed " + player.getName() + ", new score: " + killer.score);
                            killer.score++;
                        }
                    }
                    projectile.alive = false;
                }
            }
        })
    }

    function fireProjectile(weaponizedEntity) {
        var we = weaponizedEntity;

        var projectileVelocity = 20;
        var vel_x = we.vel_x + Math.cos(we.angle * Math.PI / 180) * projectileVelocity;
        var vel_y = we.vel_y + Math.sin(we.angle * Math.PI / 180) * projectileVelocity;

        var projectile = new Projectile(weaponizedEntity.getPosition(), new Vector(vel_x, vel_y), this.range, projectileVelocity);
        projectile.id = we.id;
        gameState.projectiles.push(projectile);
    }

    updateProjectiles();
    updatePlayers();
}

function checkAreaBounds(movableEntity) {

    var me = movableEntity;

    if (me.getPosition().x < 0) {
        me.setX(GAME.area.sizeX);
    }
    if (me.getPosition().x > GAME.area.sizeX) {
        me.setX(0);
    }
    if (me.getPosition().y < 0) {
        me.setY(GAME.area.sizeY);
    }
    if (me.getPosition().y > GAME.area.sizeY) {
        me.setY(0);
    }
}


function packGameData() {
    var players = [];
    var projectiles = [];

    var i;
    for (i = 0; i < gameState.players.length; ++i) {
        var playerData = gameState.players[i].toJSON();
        players.push(playerData);
    }
    for (i = 0; i < gameState.projectiles.length; ++i) {
        projectiles.push(gameState.projectiles[i].toJSON());
    }
    return {
        tick: gameTickCount,
        players: players,
        projectiles: projectiles
    }
}

init();

