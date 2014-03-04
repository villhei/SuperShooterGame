/**
 * Created by Ville on 1.3.2014.
 */
(function (exports) {

    exports.Missile = Missile;

    function Missile(position, velocity, angle) {
        this.position = position;
        this.speed = 30;
        this.velocity = velocity;
        this.lifetime = 600;
        this.angle = angle;
        this.accelspeed = 0.3;
        this.turningspeed = 10;
        this.trackTarget = null;
        this.alive = true;
        this.damage = 35;
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

    Missile.prototype.setTrackTraget = function(targets) {
        var missile = this;
        var shortest = 0;
        var newTarget = null;
        targets.forEach(function closestTarget(target) {
            if(target.id == missile.id ) {
                return;
            }
            if(shortest == 0) {
                shortest = missile.getPosition().distance(target.getPosition());
                newTarget = target;
            } else {
                var newValue = missile.getPosition().distance(target.getPosition());
                if(newValue < shortest) {
                    shortest = newValue;
                    newTarget = target;
                }
            }
        });
        if(newTarget === null) {
            return;
        }
        this.trackTarget = newTarget;
    }

    Missile.prototype.track = function(velocity) {
        if(!this.trackTarget) {
            return;
        }

        var flyingAngle = this.getPosition().angle(this.getPosition().add(velocity));
        var targetAngle = this.getPosition().add(velocity).angle(this.trackTarget.getPosition().add(this.trackTarget.getVelocity()));

        var correction = flyingAngle-targetAngle;

        if(correction > 0) {
            this.turnRight(Math.abs(correction));
        }else if (correction < 0) {
            this.turnLeft(Math.abs(correction));
        }
    }

    Missile.prototype.move = function (timeDelta) {

        var vel = this.velocity.length();

        var movement_x = Math.cos(this.angle * (Math.PI / 180)) * vel * timeDelta/1000;
        var movement_y  = Math.sin(this.angle * (Math.PI / 180)) * vel * timeDelta/1000;

        this.track(new Vector(movement_x, movement_y));

        this.position = this.position.add(new Vector(movement_x, movement_y));
        this.lifetime -= timeDelta;
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

    Missile.prototype.turnRight = function (degrees) {

        this.angle += degrees > this.turningspeed ? this.turningspeed : degrees;
        if (this.angle == 360) {
            this.angle = 0;
        }
    }

    Missile.prototype.turnLeft = function (degrees) {
        this.angle -= degrees > this.turningspeed ? this.turningspeed: degrees;
        if (this.angle < 0) {
            this.angle = 360 - Math.abs(this.turningspeed);
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