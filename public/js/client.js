/**************************************************
 ** GAME VARIABLES
 **************************************************/
var canvas,			// Canvas DOM element
    ctx,			// Canvas rendering context
    keys,			// Keyboard input
    gameState,      // The game state global
    localPlayer,	// Local player
    window_active,  // is the window active
    socket;         // The socket

var GameState = exports.GameState;
var Player = exports.Player;
var Ship = exports.Ship;
var Vector = exports.Vector;
var Projectile = exports.Projectile;
var Missile = exports.Missile;


var canvas_width = 800;
var canvas_height = 800;


var CLIENT = {
    state: {}
}

/**************************************************
 ** Game INITIALISATION
 **************************************************/
function init() {
    // Declare the canvas and rendering context
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    // Maximise the canvas
    canvas.width = canvas_width;
    canvas.height = canvas_height;
    window_active = true;

    localPlayer = new Player();
    // Initialise keyboard controls
    keys = new Keys();

    socket = io.connect("http://ssg.plop.fi::", {port: 8888, transports: ["websocket"]});

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
    window.addEventListener("resize", onResize, false);

    socket.on("connect", onSocketConnected);
    socket.on("disconnect", onSocketDisconnect);
    socket.on("new player", onNewPlayer);
    socket.on("register client", onRegisterClient);
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
    canvas.width = canvas_width;
    canvas.height = canvas_height;
};

function onSocketConnected() {
    console.log("Connected to socket server");
    socket.emit("new player", {name: "WebClient"});
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};


function onRegisterClient(data) {
    localPlayer.ship.setX(data.x);
    localPlayer.ship.setY(data.y);
    localPlayer.id = data.id;
    localPlayer.setName(data.name);

}
function onNewPlayer(data) {
    var newPlayer = new Player(data.id, data.x, data.y);
    newPlayer.id = data.id;

    console.log("New player connected: " + newPlayer);
    gameState.players.push(newPlayer);
};


function onRemovePlayer(data) {
    var removePlayer = gameState.playerById(data.id);

    if (!removePlayer) {
        console.log("Player not found: " + data.id);
        return;
    }
    ;
    console.log("removing: " + data.id);
    console.log(removePlayer);
    gameState.players.splice(gameState.players.indexOf(removePlayer), 1);

};

function onGameStateUpdate(data) {
    gameState.ticks.last_server = data.tick;

    updatePlayers();
    updateProjectiles();
    updateMissiles();
    updateScores();

    function updateProjectiles() {
        gameState.projectiles = [];
        for (var i = 0; i < data.projectiles.length; ++i) {
            var rp = data.projectiles[i];
            var projectile = new Projectile(new Vector(rp.x, rp.y), new Vector(rp.vel_x, rp.vel_y))
            gameState.projectiles.push(projectile);
        }
    }

    function updateMissiles() {
        gameState.missiles = [];

        data.missiles.forEach(function (missile) {
            var newMissile = new Missile(new Vector(missile.x, missile.y), new Vector(missile.vel_x, missile.vel_y), missile.angle);
            gameState.missiles.push(newMissile);
        })
    }

    function updatePlayers() {
        for (var i = 0; i < data.players.length; ++i) {
            var playerInfo = data.players[i];
            var player = gameState.playerById(playerInfo.id);
            if (player) {
                player.setJSON(playerInfo);
            }
        }
    }

    function updateScores() {
        gameState.scores = [];
        data.scores.forEach(function (score) {
            gameState.scores.push(score);
        });
        gameState.scores.sort(function(a, b) {
            return b.score - a.score;
        })
    }

}


/**************************************************
 ** Game ANIMATION LOOP
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
 ** Game UPDATE
 **************************************************/
function update() {

    var payload;
    if (localPlayer) {
        payload = updateClientInput(keys);
        socket.emit("update player", payload);
    }

};

function updateClientInput(keys) {

    if(!window_active) {
        return {nothing:true};
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
 ** Game DRAW
 **************************************************/
function draw() {

    var object_border_color = '#E9F2F7'
    var thrust_color = 'rgba(3, 196, 255, 0.2)';
    var afterburner_color = 'rgba(187, 242, 250, 0.2)';

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
        drawPlayer(ctx, player);
    }

    gameState.projectiles.forEach(function (projectile) {
        drawProjectile(ctx, projectile);
    })
    gameState.missiles.forEach(function (missile) {
        drawMissile(ctx, missile);
    })

    drawDebugData();
    drawScores();

    function drawPlayer(ctx, player) {
        if (player.id === localPlayer.id) {
            drawShip(ctx, player.ship, "#29C920");
        } else {
            drawShip(ctx, player.ship, "#33A0D6");
        }
        if (player.ship.alive) {
            drawShipThrust(ctx, player.ship);
            drawHealthBox(ctx, player.ship);
        }
        drawText(ctx, player.getName(), player.ship.getX() - player.ship.size, player.ship.getY() + 2.5 * player.ship.size);
    }

    function drawHealthBox(ctx, ship) {
        var boxwidth = 25;
        var boxheight = 6;

        var box_x = ship.getX() - ship.size * 0.5;
        var box_y = ship.getY() + ship.size * 1.2;
        ctx.strokeStyle = object_border_color;
        ctx.strokeWeight = 1;
        ctx.fillStyle = 'rgb(0, 0, 0)'
        ctx.strokeRect(box_x, box_y, boxwidth, boxheight);
        ctx.fillStyle = '#F6FF00'
        ctx.fillRect(box_x + 1, box_y + 2, (boxwidth - 2) * (ship.health / 100), boxheight - 4);
    }

    function drawShipThrust(ctx, ship) {
        if (ship.accelerating) {
            var position = ship.getThrustPosition();
            if (ship.afterburner) {
                var velocity = ship.getVelocity();
                var blob = new Vector(position.x - velocity.x, position.y - velocity.y);
                blob.color = afterburner_color;
            } else {
                var blob = new Vector(position.x, position.y);
                blob.color = thrust_color;
            }
            blob.lifeTime = 20;
            ship.thrust.push(blob);
        }
        var arc_size = 5;
        ship.thrust = ship.thrust.filter(function (element) {
            return element.lifeTime > 0
        });
        var multiplier = 0.2;
        ship.thrust.forEach(function (thrust) {
            thrust.lifeTime--;
            ctx.beginPath();
            ctx.arc(thrust.x, thrust.y, arc_size * multiplier, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fillStyle = thrust.color;
            ctx.fill();
            multiplier *= 1.1
        })
    }

    function drawText(ctx, text, x, y, color) {
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
        ctx.strokeStyle = object_border_color;
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

        function drawGlare() {
            var color = 'rgba(0,0,0,0.2)'
            ctx.beginPath();
            ctx.moveTo(head.x, head.y);
            ctx.lineTo(left.x, left.y);
            ctx.lineTo(position.x, position.y);
            ctx.lineTo(head.x, head.y);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        drawGlare();
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

    function drawMissile(ctx, missile) {
        console.log(missile);
        var color = '#fff'
        var left = missile.getLeft();
        var right = missile.getRight();
        var head = missile.getHead();
        ctx.beginPath();
        ctx.moveTo(head.x, head.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.lineTo(head.x, head.y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawDebugData() {
        var boxwidth = 200;
        var boxheight = 50;

        var box_x = (canvas.width - boxwidth) / 2;
        var box_y = 0;

        var padding = 5;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fillRect(box_x, box_y, boxwidth, boxheight);

        var text = 'Game tick: ' + gameState.ticks.last_server;
        drawText(ctx, text, box_x + padding, box_y + 15);
        var text2 = 'Ping: ' + localPlayer.getPing() + " ms";
        drawText(ctx, text2, box_x + padding, box_y + 30);
        var text3 = 'Score: ' + localPlayer.score;

        drawText(ctx, text3, box_x + padding, box_y + 45);
    }

    function drawScores() {
        var boxwidth = 200;
        var boxheight = gameState.players.length*20;

        var box_x = (canvas.width - boxwidth);
        var box_y = 0;

        var padding = 5;
        var rowsize = 15;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fillRect(box_x, box_y, boxwidth, boxheight);
        if (gameState.scores) {
            gameState.scores.forEach(function (score, index) {
                var text = score.name + " : " + score.score;
                drawText(ctx, text, box_x + padding, box_y + (index*rowsize + rowsize));
            })
        }
    }

};