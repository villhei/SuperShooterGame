(function (exports) {

    exports.Ship = Ship;

    function Ship(pos_x, pos_y, id) {
        this.position = new Vector(pos_x, pos_y);
        this.MAX_SPEED = 500;
        this.accelspeed = 8;
        this.afterburnerMultiplier = 2;
        this.angle = 0.0;
        this.size = 15;
        this.radius = 15;
        this.id = id;
        this.turningspeed = 270;
        this.velocity = new Vector(0, 0);
        this.alive = true;
        this.health = 100;
        this.mass = 100;
        this.firing_primary = false;
        this.firing_secondary = false;
        this.accelerationStart = 0;
        this.turnRightStart = 0;
        this.turnLeftStart = 0;
        this.accelspeed = 120;
        this.missile = {
            fireDelay: 200,
            lastFire: 0,
            clipSize: 3,
            clipContent: 3,
            reloadDelay: 2000,
            reloadAmount: 1,
            velocity: 600
        }
        this.cannon = {
            fireDelay: 10,
            lastFire: 0,
            clipSize: 20,
            clipContent: 20,
            reloadDelay: 300,
            reloadAmount: 5,
            velocity: 500
        }
        this.afterburner = false;
        this.accelerating = false;
        this.healthPerSecond = 0.5;
        this.thrust = [];
    };


    Ship.prototype.getPosition = function () {
        return this.position;
    };

    Ship.prototype.getThrustPosition = function () {
        var x = Math.cos(this.angle * Math.PI / 180) * -this.size;
        var y = Math.sin(this.angle * Math.PI / 180) * -this.size;
        return new Vector(x, y).add(this.position);
    }

    Ship.prototype.getWeaponPosition = function () {
        return this.getHead();
    }

    Ship.prototype.getVelocity = function () {
        return this.velocity;
    }

    Ship.prototype.regenerate = function (timeDelta) {
        var timeNow = new Date().getTime();

        checkReload(this.missile);
        checkReload(this.cannon);
        if (this.health < 100) {
            this.health += this.healthPerSecond * (timeDelta / 1000);
        }

        function checkReload(weapon) {
            if (timeNow - weapon.lastFire > weapon.reloadDelay) {
                if (weapon.clipContent < weapon.clipSize) {
                    weapon.clipContent += weapon.reloadAmount;
                }
            }
        }
    }

    Ship.prototype.getHead = function () {
        var x = Math.cos(this.angle * Math.PI / 180) * this.size;
        var y = Math.sin(this.angle * Math.PI / 180) * this.size;

        return new Vector(x + this.position.x, y + this.position.y);
    };


    Ship.prototype.getLeft = function () {
        var x = Math.cos((this.angle - 120) * Math.PI / 180) * this.size;
        var y = Math.sin((this.angle - 120) * Math.PI / 180) * this.size;

        return new Vector(x + this.position.x, y + this.position.y);
    };

    Ship.prototype.getRight = function () {
        var x = Math.cos((this.angle + 120) * Math.PI / 180) * this.size;
        var y = Math.sin((this.angle + 120) * Math.PI / 180) * this.size;

        return new Vector(x + this.position.x, y + this.position.y);
    };

    Ship.prototype.startAcceleration = function (latency) {
        if (this.accelerationStart == 0) {
            this.accelerationStart = this.resetClock(latency);
        }
    }

    Ship.prototype.startTurningLeft = function (latency) {
        if (this.turnLeftStart == 0) {
            this.turnLeftStart = this.resetClock(latency);
        }
    }


    Ship.prototype.startTurningRight = function (latency) {
        if (this.turnRightStart == 0) {
            this.turnRightStart = this.resetClock(latency);
        }
    }
    Ship.prototype.stopTurningRight = function () {
        this.turnRightStart = 0;
    }

    Ship.prototype.stopTurningLeft = function () {
        this.turnLeftStart = 0;
    }


    Ship.prototype.resetClock = function (latency) {
        return new Date().getTime();
    }

    Ship.prototype.stopAcceleration = function () {
        this.accelerationStart = 0;
    }

    Ship.prototype.accelerate = function () {
        var multiplier = this.afterburner ? this.afterburnerMultiplier : 1;

        var accelTime = (new Date().getTime() - this.accelerationStart) / 1000;
        this.velocity.x += Math.cos(this.angle * (Math.PI / 180)) * this.accelspeed * accelTime * multiplier;
        this.velocity.y += Math.sin(this.angle * (Math.PI / 180)) * this.accelspeed * accelTime * multiplier;

        this.accelerationStart = this.resetClock(2);
    };

    Ship.prototype.update = function (timeDelta) {
        this.applySpeedLimit();
        if (this.accelerationStart != 0) {
            this.accelerate();
        }
        if (this.turningLeft != 0 && this.turningLeft) {
            this.turnLeft();
        } else if (this.turningRight != 0 && this.turningRight) {
            this.turnRight();
        }

        this.position = this.position.add(this.velocity.multiply(timeDelta / 1000));

    }


    Ship.prototype.applySpeedLimit = function () {
        if (Math.abs(this.velocity.length()) > this.MAX_SPEED) {
            if (this.velocity.length() < 0) {
                this.velocity = -(this.velocity.normalize().multiply(this.MAX_SPEED));
            } else {
                this.velocity = (this.velocity.normalize().multiply(this.MAX_SPEED));
            }

        }
    }


    Ship.prototype.turnRight = function () {
        var accelTime = (new Date().getTime() - this.turnRightStart) / 1000;

        var multiplier = this.afterburner && this.accelerating ? this.afterburnerMultiplier : 1;
        this.angle += this.turningspeed * accelTime / multiplier;
        if (this.angle > 360) {
            this.angle -= 360;
        }
        this.turnRightStart = this.resetClock(0);
    }

    Ship.prototype.turnLeft = function () {
        var accelTime = (new Date().getTime() - this.turnLeftStart) / 1000;
        var multiplier = this.afterburner && this.accelerating ? this.afterburnerMultiplier : 1;
        this.angle -= this.turningspeed * accelTime / multiplier;
        if (this.angle < 0) {
            this.angle += 360;

        }
        this.turnLeftStart = this.resetClock(0);

    }
})(typeof exports === 'undefined' ? this['Ship'] = {} : exports);