/**
 * Created by Ville on 1.3.2014.
 */
(function (exports) {

    exports.Missile = Missile;

    function Missile(position, velocity, angle) {
        this.position = position;
        this.speed = 30;
        this.velocity = velocity;
        this.lifetime = 15;
        this.angle = angle;
        this.accelspeed = 0.2;
        this.turningspeed = 4;
        this.alive = true;
        this.damage = 50;
        this.id = "";
        this.size = 7;
    };

    Missile.prototype.getPosition = function () {
        return this.position;
    }

    Missile.prototype.setX = function (newValue) {
        this.position.x = newValue;
    }

    Missile.prototype.setY = function (newValue) {
        this.position.y = newValue;
    }

    Missile.prototype.track = function (targets) {
        var shortest = 0;
        var newTarget;
        var missile = this;
        targets.forEach(function closestTarget(target) {
            if(target.id == missile.id) {
                return;
            }
            if(shortest == 0) {
                shortest = missile.getPosition().distance(target.getPosition());
                newTarget = target;
            } else {
                if(newValue = missile.getPosition().distance(target.getPosition()) < shortest) {
                    shortest = newValue;
                    shortest = target;
                }
            }
        });
        if(newTarget === undefined) {
            return;
        }
        var r = newTarget.getPosition();
        var p = missile.getPosition();
        var q = missile.getPosition().add(missile.velocity);

        var angle = r.subtract(p).cross2D(q.subtract(p));
        if(angle > 0) {
            this.turnLeft();
        } else if(angle < 0) {
            this.turnRight();
        }
    }

    Missile.prototype.move = function () {

        var vel = this.velocity.length();

        var movement_x = Math.cos(this.angle * (Math.PI / 180)) * vel;
        var movement_y  = Math.sin(this.angle * (Math.PI / 180)) * vel;

        this.position = this.position.add(new Vector(movement_x, movement_y));
        this.lifetime--;
        if (this.lifetime < 0) {
            this.alive = false;
        }
    };

    Missile.prototype.getHead = function() {
        var x = Math.cos(this.angle * Math.PI / 180) * this.size;
        var y = Math.sin(this.angle * Math.PI / 180) * this.size;

        return new Vector(x + this.position.x, y + this.position.y);
    };


    Missile.prototype.getLeft = function() {
        var x = Math.cos((this.angle - 160)* Math.PI / 180) * this.size;
        var y = Math.sin((this.angle - 160)* Math.PI / 180) * this.size;

        return new Vector(x + this.position.x, y + this.position.y);
    };

    Missile.prototype.getRight = function() {
        var x = Math.cos((this.angle + 160)* Math.PI / 180) * this.size;
        var y = Math.sin((this.angle + 160)* Math.PI / 180) * this.size;

        return new Vector(x + this.position.x, y + this.position.y);
    };

    Missile.prototype.turnRight = function () {
        var multiplier = this.afterburner && this.accelerating ? this.afterburnerMultiplier : 1;
        this.angle += this.turningspeed / multiplier;
        if (this.angle == 360) {
            this.angle = 0;
        }
    }

    Missile.prototype.turnLeft = function () {
        var multiplier = this.afterburner && this.accelerating ? this.afterburnerMultiplier : 1;
        this.angle -= this.turningspeed / multiplier;
        if (this.angle < 0) {
            this.angle = 360 - Math.abs(this.turningspeed / multiplier);
        }
    }

    Missile.prototype.toJSON = function () {
        return {
            x: this.position.x,
            y: this.position.y,
            vel_x: this.velocity.x,
            vel_y: this.velocity.y,
            angle: this.angle
        }
    }


})(typeof exports === 'undefined' ? this['Missile'] = {} : exports);