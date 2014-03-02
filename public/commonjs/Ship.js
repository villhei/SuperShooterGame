(function (exports) {

    exports.Ship = Ship;

    function Ship(pos_x, pos_y, id) {
        this.pos_x = pos_x || 0;
        this.pos_y = pos_y || 0;
        this.MAX_SPEED = 10;
        this.accelspeed = 0.2;
        this.afterburnerMultiplier = 3;
        this.angle = 0.0;
        this.size = 15;
        this.id = id;
        this.turningspeed = 5;
        this.vel_x = 0;
        this.vel_y = 0;
        this.alive = true;
        this.health = 100;
        this.firing_primary = false;
        this.firing_secondary = false;
        this.afterburner = false;
        this.accelerating = false;
        this.regenerationSpeed = 0.5;
        this.thrust = [];
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

    Ship.prototype.getThrustPosition = function() {
        var x = Math.cos(this.angle * Math.PI / 180) * -this.size;
        var y = Math.sin(this.angle * Math.PI / 180) * -this.size;
        return new Vector(x + this.pos_x, y + this.pos_y);
    }

    Ship.prototype.getWeaponPosition = function() {
        return this.getHead();
    }

    Ship.prototype.getX = function() {
        return this.pos_x;
    }

    Ship.prototype.getY = function() {
        return this.pos_y;
    }

    Ship.prototype.getVelocity = function() {
        return new Vector(this.vel_x, this.vel_y);
    }

    Ship.prototype.regenerate = function() {
        if(this.health < 100) {
            this.health += this.regenerationSpeed;
        }
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
        var multiplier = this.afterburner ? this.afterburnerMultiplier : 1;
        this.vel_x += Math.cos(this.angle * (Math.PI / 180)) * this.accelspeed*multiplier;
        this.vel_y += Math.sin(this.angle * (Math.PI / 180)) * this.accelspeed*multiplier;
    };

    Ship.prototype.update = function () {
        if(this.accelerating) {
            this.accelerate();
        }
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