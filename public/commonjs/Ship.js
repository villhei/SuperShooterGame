(function (exports) {

    exports.Ship = Ship;

    function Ship(pos_x, pos_y, id) {
        this.pos_x = pos_x || 0;
        this.pos_y = pos_y || 0;
        this.MAX_SPEED = 10;
        this.accelspeed = 0.1;
        this.angle = 0.0;
        this.size = 15;
        this.id = id;
        this.turningspeed = 3;
        this.vel_x = 0;
        this.vel_y = 0;
        this.alive = true;
        this.health = 100;
        this.firing_primary = false;
    };

    Ship.prototype.angleTo = function (asteroid) {
        var dx = this.pos_x - asteroid.pos_x;
        var dy = this.pos_y - asteroid.pos_y;
        var angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return angle;
    };

    Ship.prototype.getPosition = function () {
        return new Vector(this.pos_x, this.pos_y);
    };

    Ship.prototype.getX = function() {
        return this.pos_x;
    }

    Ship.prototype.getY = function() {
        return this.pos_y;
    }

    Ship.prototype.setX = function(newX) {
        this.pos_x = newX;
    }

    Ship.prototype.setY = function(newY) {
        this.pos_y = newY;
    }

    Ship.prototype.getHead = function() {
        var x = Math.cos(this.angle * Math.PI / 180) * this.size;
        var y = Math.sin(this.angle * Math.PI / 180) * this.size;

        return new Vector(x + this.pos_x, y + this.pos_y);
    };


    Ship.prototype.getLeft = function() {
        var x = Math.cos((this.angle - 120)* Math.PI / 180) * this.size;
        var y = Math.sin((this.angle - 120)* Math.PI / 180) * this.size;

        return new Vector(x + this.pos_x, y + this.pos_y);
    };

    Ship.prototype.getRight = function() {
        var x = Math.cos((this.angle + 120)* Math.PI / 180) * this.size;
        var y = Math.sin((this.angle + 120)* Math.PI / 180) * this.size;

        return new Vector(x + this.pos_x, y + this.pos_y);
    };


    Ship.prototype.accelerate = function () {
        this.vel_x += Math.cos(this.angle * (Math.PI / 180)) * this.accelspeed;
        this.vel_y += Math.sin(this.angle * (Math.PI / 180)) * this.accelspeed;


    };

    Ship.prototype.move = function () {
        this.applySpeedLimit();
        this.pos_x += this.vel_x;
        this.pos_y += this.vel_y;


    }

    Ship.prototype.applySpeedLimit = function () {
        if (this.vel_x >= this.MAX_SPEED) {
            this.vel_x = this.MAX_SPEED;
        }
        else if (this.vel_x <= -this.MAX_SPEED) {
            this.vel_x = -this.MAX_SPEED;
        }
        if (this.vel_y >= this.MAX_SPEED) {
            this.vel_y = this.MAX_SPEED;
        }
        else if (this.vel_y <= -this.MAX_SPEED) {
            this.vel_y = -this.MAX_SPEED;
        }
    }


    Ship.prototype.turnRight = function () {
        this.angle += this.turningspeed;
        if (this.angle == 360) {
            this.angle = 0;
        }
    }

    Ship.prototype.turnLeft = function () {
        this.angle -= this.turningspeed;
        if (this.angle < 0) {
            this.angle = 360 - Math.abs(this.turningspeed);
        }
    }

})(typeof exports === 'undefined' ? this['Ship'] = {} : exports);