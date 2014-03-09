/**
 * Created by Ville on 9.3.2014.
 */
function Graphics(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.canvas.style.zIndex = "1";
    this.ctx.canvas.height = window.innerHeight-50;
    this.ctx.canvas.width = window.innerWidth-10;
    this.zoom = 1;

    this.camera = new Vector(0, 0);
    this.MAX = new Vector(0, 0);
    this.MIN = new Vector(0, 0);
    this.HEIGHT = window.innerHeight;
    this.WIDTH = window.innerWidth;

    this.index = 1;


    this.object_border_color = '#E9F2F7'
    this.thrust_color = 'rgba(3, 196, 255, 0.2)';
    this.afterburner_color = 'rgba(187, 242, 250, 0.2)';


}

Graphics.prototype.onResize = function(event) {
    this.canvas.height = window.innerHeight;
    this.canvas.width = window.innerHeight;


}

Graphics.prototype.draw = function () {
    this.clearScreen();
    this.fillBackGround("#000");
    this.updateDrawableLimits();
    this.updateCamera();
    //this.updateZoom();
    this.drawPlanets(GAME.state.planets);

    this.drawShips(GAME.state.players, 1);
    var graphics = this;
    GAME.state.projectiles.forEach(function (projectile) {
        graphics.drawProjectile(projectile);
    })
    GAME.state.missiles.forEach(function (missile) {
        graphics.drawMissile(missile);
    })


    this.drawDebugData();
    this.drawScores();
// this.drawMapDebugBoundaries();

}


function roundNumber(num, dec) {
    var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    return result;
}

Graphics.prototype.clearScreen = function () {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}


Graphics.prototype.fillBackGround = function(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
}


Graphics.prototype.drawShips = function (players, alpha) {
    for (var i in players) {
        var player = players[i];
        if (player.id === localPlayer.id) {
            var color = 'rgba(128,0,0,' + alpha + ')';
            this.drawShip( player.ship, color);
        } else {
            var color = 'rgba(128,128,0,' + alpha + ')';
            this.drawShip( player.ship, color);
        }
        if (player.ship.alive) {
            this.drawShipThrust( player.ship);
            this.drawHealthBox( player.ship);
        }
        // Draw the name label
        var namePos = player.ship.position.subtract(this.MIN).multiply(this.zoom)
        this.drawText(ctx, player.getName(), namePos.x - player.ship.size, namePos.y + 2.5 * player.ship.size);
    }
};
Graphics.prototype.drawShip = function(ship, shipColor) {
    var left = ship.getLeft().subtract(this.MIN).multiply(this.zoom);
    var right = ship.getRight().subtract(this.MIN).multiply(this.zoom);
    var head = ship.getHead().subtract(this.MIN).multiply(this.zoom);
    var position = ship.getPosition().subtract(this.MIN).multiply(this.zoom);
    var color = ship.alive ? shipColor : "#748599";
    this.ctx.strokeStyle = this.object_border_color;
    this.ctx.beginPath();
    this.ctx.moveTo(head.x, head.y);
    this.ctx.lineTo(left.x, left.y);
    this.ctx.lineTo(position.x, position.y);
    this.ctx.lineTo(right.x, right.y);
    this.ctx.lineTo(head.x, head.y);
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();

    function drawGlare() {
        var color = 'rgba(0,0,0,0.2)'
        this.ctx.beginPath();
        this.ctx.moveTo(head.x, head.y);
        this.ctx.lineTo(left.x, left.y);
        this.ctx.lineTo(position.x, position.y);
        this.ctx.lineTo(head.x, head.y);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawGlare();
}


Graphics.prototype.updateDrawableLimits = function () {

    var half_x = this.WIDTH * (1 / this.zoom) / 2;
    var half_y = this.HEIGHT * (1 / this.zoom) / 2;
    this.MIN.x = Math.floor(this.camera.x - half_x);
    this.MAX.x = Math.ceil(this.camera.x + half_x);
    this.MIN.y = Math.floor(this.camera.y - half_y);
    this.MAX.y = Math.ceil(this.camera.y + half_y);
};

Graphics.prototype.vectorWithinBounds = function (vector) {
    return this.xbounds(vector.x) && this.ybounds(vector.y)
};

Graphics.prototype.xbounds = function (x, modifier) {
    if (typeof modifier === 'undefined') {
        modifier = 1;
        if (x >= this.MIN.x && x <= this.MAX.x) {
            return true;
        }
        return false;
    }
    if (x >= this.MIN.x + (1 / modifier) * this.MIN.y && x <= this.MAX.x * modifier) {
        return true;
    }
};

Graphics.prototype.ybounds = function (y, modifier) {
    if (typeof modifier === 'undefined') {
        if (y >= this.MIN.y && y <= this.MAX.y) {
            return true;
        }
        return false;
    }
    if (y >= this.MIN.y + (1 / modifier) * this.MIN.y && y <= this.MAX.y * modifier) {
        return true;
    }
    return false;
};

Graphics.prototype.circularObjectWithinBounds = function (object) {
    var x = false, y = false;
    if (this.vectorWithinBounds(object.getPosition())) {
        x = true;
        y = true;
    }
    else if (this.xbounds(object.position.x - object.radius) || this.xbounds(object.position.x + object.radius)) {
        x = true;
    }
    if (x && (this.ybounds(object.position.y - object.radius) || this.ybounds(object.position.y + object.radius))) {
        y = true;
    }
    return x && y;
};

Graphics.prototype.updateCamera = function () {

    this.camera = localPlayer.getPosition();

};

Graphics.prototype.drawShipShield = function (ship) {
    var shieldRadius = ship.size * this.zoom;

    var position = ship.getPosition().subtract(this.MIN).multiply(this.zoom);
    this.ctx.beginPath();
    var gradient = this.ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, shieldRadius);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, 'rgba(0,128,255,0.2)');
    gradient.addColorStop(0.9, 'rgba(0,128,255,0.4)');
    gradient.addColorStop(1, 'rgba(0,212,255,0.2)');

    this.ctx.arc(position.x, position.y, shieldRadius, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    this.ctx.closePath();
};


Graphics.prototype.drawShipThrust = function (ship) {
    if (ship.accelerating) {
        var position = ship.getThrustPosition().subtract(this.MIN).multiply(this.zoom);
        if (ship.afterburner) {
            var blob = ship.getThrustPosition().subtract(this.MIN).multiply(this.zoom);
            blob.color = this.afterburner_color;
        } else {
            var blob = new Vector(position.x, position.y);
            blob.color = this.thrust_color;
        }
        blob.lifeTime = 20;
        ship.thrust.push(blob);
    }
    var arc_size = 5;
    ship.thrust = ship.thrust.filter(function (element) {
        return element.lifeTime > 0
    });
    var multiplier = 0.1;
    ship.thrust.forEach(function (thrust) {
        thrust.lifeTime--;
        this.ctx.beginPath();
        this.ctx.arc(thrust.x, thrust.y, arc_size * multiplier, 2 * Math.PI, false);
        this.ctx.closePath();
        this.ctx.fillStyle = thrust.color;
        this.ctx.fill();
        multiplier *= 1.1
    })
};

Graphics.prototype.drawPlanets = function (planets) {

    for (var i = 0; i < planets.length; ++i) {
        if (!this.circularObjectWithinBounds(planets[i])) {
            continue;
        }
        var position = planets[i].position.subtract(this.MIN).multiply(this.zoom);
        this.ctx.drawImage(planetImage, position.x - 152, position.y - 152, 305, 305);

    }
};


Graphics.prototype.drawHealthBox = function(ship) {
    var boxwidth = 25;
    var boxheight = 6;
    var shipPos = ship.getPosition().subtract(this.MIN).multiply(this.zoom);
    var box_x = shipPos.x - ship.size * 0.5;
    var box_y = shipPos.y + ship.size * 1.2;
    this.ctx.strokeStyle = this.object_border_color;
    this.ctx.strokeWeight = 1;
    this.ctx.fillStyle = 'rgb(0, 0, 0)'
    this.ctx.strokeRect(box_x, box_y, boxwidth, boxheight);
    this.ctx.fillStyle = '#F6FF00'
    this.ctx.fillRect(box_x + 1, box_y + 2, (boxwidth - 2) * (ship.health / 100), boxheight - 4);
}

Graphics.prototype.drawText = function(ctx, text, x, y, color) {
    var fontSize = 12;
    var fontStyle = 'Arial';
    var fontColor = color || '#fff';

    this.ctx.font = fontSize + 'px ' + fontStyle;
    this.ctx.fillStyle = fontColor;

    this.ctx.fillText(text, x, y);
}




Graphics.prototype.drawProjectile = function(projectile) {
    var position = projectile.position.subtract(this.MIN).multiply(this.zoom);
    var projectile_size = 1;
    var projectile_color = '#fff'
    var oldStyle = ctx.fillStyle;
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, projectile_size, 0, 2 * Math.PI, false);
    this.ctx.fillStyle = projectile_color;
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = oldStyle;
}


Graphics.prototype.drawMissile = function(missile) {
    var color = '#fff'
    var left = missile.getLeft().subtract(this.MIN).multiply(this.zoom);
    var right = missile.getRight().subtract(this.MIN).multiply(this.zoom);
    var head = missile.getHead().subtract(this.MIN).multiply(this.zoom);
    this.ctx.beginPath();
    this.ctx.moveTo(head.x, head.y);
    this.ctx.lineTo(left.x, left.y);
    this.ctx.lineTo(right.x, right.y);
    this.ctx.lineTo(head.x, head.y);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
}

Graphics.prototype.drawDebugData = function() {
    var boxwidth = 200;
    var boxheight = 70;

    var box_x = (canvas.width - boxwidth) / 2;
    var box_y = 0;

    var padding = 5;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    this.ctx.fillRect(box_x, box_y, boxwidth, boxheight);

    var text = 'Game tick: ' + serverGameState.ticks;
    this.drawText(ctx, text, box_x + padding, box_y + 15);
    var text1 = 'Local tick: ' + GAME.state.ticks;
    this.drawText(ctx, text1, box_x + padding, box_y + 30);
    var text2 = 'Ping: ' + localPlayer.getPing() + " ms";
    this.drawText(ctx, text2, box_x + padding, box_y + 45);
    var text3 = 'Score: ' + localPlayer.score;

    this.drawText(ctx, text3, box_x + padding, box_y + 60);
}

Graphics.prototype.drawScores = function() {
    var boxwidth = 200;
    var boxheight = GAME.state.players.length * 20;

    var box_x = (canvas.width - boxwidth);
    var box_y = 0;

    var padding = 5;
    var rowsize = 15;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    var graphics = this;
    this.ctx.fillRect(box_x, box_y, boxwidth, boxheight);
    if (serverGameState.scores) {
        serverGameState.scores.forEach(function (score, index) {
            var text = score.name + " : " + score.score;
            graphics.drawText(ctx, text, box_x + padding, box_y + (index * rowsize + rowsize));
        })
    }
}