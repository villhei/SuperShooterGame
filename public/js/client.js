/**************************************************
 ** GAME VARIABLES
 **************************************************/
var canvas,			// Canvas DOM element
    ctx,			// Canvas rendering context
    keys,			// Keyboard input
    serverGameState,// The server game state global
    localPlayer,	// Local player
    window_active,  // is the window active
    socket;         // The socket

var GameState = exports.GameState;
var Game = exports.Game;
var Player = exports.Player;
var Ship = exports.Ship;
var Vector = exports.Vector;
var Projectile = exports.Projectile;
var Missile = exports.Missile;
var Planet = exports.Planet;


var planetImage = new Image();
planetImage.src = 'img/planet_glow.jpg'


var GAME;
var GRAPHICS;

/**************************************************
 ** Game INITIALISATION
 **************************************************/
function init() {
    // Declare the canvas and rendering context
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    // Maximise the canvas
    window_active = true;

    localPlayer = new Player("LOCAL_DUMMY");

    // Initialise keyboard controls
    keys = new Keys();

    try {
        socket = io.connect("http://localhost", {port: 8888, transports: ["websocket"]});
    } catch (ex) {
        console.log("Failed to instantiate Socket.IO ", ex.message);
    }
    serverGameState = new GameState();

    GAME = new Game();
    GAME.init();
    GAME.state.players.push(localPlayer);
    GAME.respawnShip(localPlayer);

    GRAPHICS = new Graphics(canvas);

    // Start listening for events
    setEventHandlers();
    //  GAME.run(function (gameState) {
    // EMPTY
    // });

};

function setName() {
    var name = document.getElementById('playerName').value;
    socket.emit("change name", {name: name});

}


/**************************************************
 ** Game EVENT HANDLERS
 **************************************************/
var setEventHandlers = function () {
    // Keyboard
    window.addEventListener("keydown", onKeydown, false);
    window.addEventListener("keyup", onKeyup, false);

    /*
     This could be a better handling too. These leaves KeyDowns active when re-entry
     */
    window.onblur = function () {
        window_active = false;
    };

    window.onfocus = function () {
        window_active = true;
    };


    // Window resize
    window.addEventListener("resize", GRAPHICS.onResize, false);

    if (socket) {
        socket.on("connect", onSocketConnected);
        socket.on("disconnect", onSocketDisconnect);
        socket.on("new player", onNewPlayer);
        socket.on("register client", onRegisterClient);
        socket.on("remove player", onRemovePlayer);
        socket.on("state update", onServerStateUpdate);

        socket.on('ping', function () {
            socket.emit('pong');
        });
    }
};

// Keyboard key down
function onKeydown(e) {
    if (localPlayer) {
        keys.onKeyDown(e);
        update();
    }
    ;
};

// Keyboard key up
function onKeyup(e) {
    if (localPlayer) {
        keys.onKeyUp(e);
        update();
    }
    ;
};

// Browser window resize

function onSocketConnected() {
    console.log("Connected to socket server");

    socket.emit("new player", {name: "Anonymous"});
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};


function onRegisterClient(data) {
    GAME.state.players = GAME.state.players.splice(1, 1);
    localPlayer = new Player(data.id);
    localPlayer.ship.position.setValue(data.ship.position);
    console.log("Registered remote id: " + data.id);
    localPlayer.id = data.id;
    localPlayer.setName(data.name);
    GAME.state.players.push(localPlayer);
    console.log("Client registerd: " + localPlayer);

}
function onNewPlayer(data) {
    var newPlayer = new Player(data.id);
    newPlayer.setJSON(data);
    console.log("New player connected: " + newPlayer);
    GAME.state.players.push(newPlayer);
};


function onRemovePlayer(data) {
    var removePlayer = GAME.state.playerById(data.id);

    if (!removePlayer) {
        console.log("Player not found for removal: " + data.id);
        return;
    }
    ;
    console.log("removing: " + data.id);
    console.log(removePlayer);
    GAME.state.players.splice(GAME.state.players.indexOf(removePlayer), 1);
};


/**************************************************
 ** Game UPDATE
 **************************************************/
var update_seq = 0;
var inputHistory = [];
function update() {
    var movementData;
    if (localPlayer) {
        movementData = updateClientInput(keys);
        if (socket) {
            movementData.packageNum = update_seq++;
            socket.emit("update player", movementData);
        }
        movementData.timeStamp = new Date().getTime();
        inputHistory.push(movementData);
        GAME.updateInput(localPlayer, movementData);

    }

};

var lastClientUpdate = 0;
var lastPing = 0;
function onServerStateUpdate(data) {
    serverGameState.ticks = data.ticks;
    GAME.state.size = data.size;
    updatePlayers();
    updateProjectiles();
    updateMissiles();
    updatePlanets();
    updateScores();

    function updateProjectiles() {
        serverGameState.projectiles = [];
        for (var i = 0; i < data.projectiles.length; ++i) {
            var rp = data.projectiles[i];
            var projectile = new Projectile(new Vector(rp.x, rp.y), new Vector(rp.vel_x, rp.vel_y))
            serverGameState.projectiles.push(projectile);
        }
    }

    function updateMissiles() {
        serverGameState.missiles = [];
        data.missiles.forEach(function (missile) {
            var newMissile = new Missile(new Vector(missile.position.x, missile.position.y),
                new Vector(missile.velocity.x, missile.velocity.y), missile.angle);
            serverGameState.missiles.push(newMissile);
        })
    }

    function updatePlanets() {
        serverGameState.planets = [];
        data.planets.forEach(function (planetInfo) {
            var planet = new Planet();
            planet.setJSON(planetInfo);
            serverGameState.planets.push(planet);
        })
    }


    function updatePlayers() {
        serverGameState.players = [];
        for (var i = 0; i < data.players.length; ++i) {

            var playerInfo = data.players[i];
            var player = GAME.state.playerById(playerInfo.id);

            if (player) {
                if (playerInfo.id == localPlayer.id) {
                    localPlayer.setJSON(playerInfo);
                    lastClientUpdate = playerInfo.lastReceivedUpdate;
                    lastPing = playerInfo.ping;
                }
                else {
                    player.setJSON(playerInfo);
                }
            }
            else {
                console.log("No player found for state update: " + playerInfo.id);
            }
            var serverPlayer = new Player(playerInfo.id);
            serverPlayer.setJSON(playerInfo);
            serverGameState.players.push(serverPlayer);
        }
    }

    function updateScores() {
        serverGameState.scores = [];
        data.scores.forEach(function (score) {
            serverGameState.scores.push(score);
        });
        serverGameState.scores.sort(function (a, b) {
            return b.score - a.score;
        })
    }

    GAME.state.missiles = serverGameState.missiles;
    GAME.state.projectiles = serverGameState.projectiles;
    GAME.state.planets = serverGameState.planets;

    inputHistory = inputHistory.filter(function (element) {
        return element.packageNum >= lastClientUpdate;
    })
    var i = 0;
    var firstFrame = 0;
    inputHistory.forEach(function (element) {
        if (i == 0) {
            firstFrame = element.timeStamp;
        }
        i++
        GAME.updateInput(localPlayer, element);
    })
}

function updateClientInput(keys) {

    if (!window_active) {
        return {nothing: true};
    }

    var vertical_accel = 0,
        horizontal_accel = 0,
        firing = false,
        firing_secondary = false,
        afterburner = false;

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

    // Others

    if (keys.ctrl) {
        firing_secondary = true;
    }

    if (keys.shift) {
        afterburner = true;
    }

    if (keys.space) {
        firing = true;
    }
    return {
        accel_x: vertical_accel,
        accel_y: horizontal_accel,
        firing: firing,
        firing_secondary: firing_secondary,
        afterburner: afterburner
    }
};


/**************************************************
 ** Game ANIMATION LOOP
 **************************************************/

var lastFrame = null;
function animate() {
    if (lastFrame == null) {
        lastFrame = new Date().getTime();
    }
    var timeNow = new Date().getTime();
    if (GAME) {
        GAME.clientRunner((timeNow - lastFrame) - lastPing / 2);
    }
    GRAPHICS.draw();

    lastFrame = new Date().getTime();
    // Request a new animation frame using Paul Irish's shim
    window.requestAnimFrame(animate);
};
