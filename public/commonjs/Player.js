(function (exports) {

    exports.Player = Player

    function Player(sessionId) {
        this.id = sessionId;
        this.name;
        this.ship = new Ship(0, 0);
        this.score = 0;
        this.ping = 0;
        this.lastReceivedUpdate = 0;

    }

    Player.prototype.getId = function () {
        return this.id;
    }


    Player.prototype.setName = function (newName) {
        this.name = newName;
    };

    Player.prototype.getName = function () {
        return this.name;
    };

    Player.prototype.getScore = function () {
        return this.score;
    }

    Player.prototype.setScore = function (newScore) {
        this.score = newScore;
    }

    Player.prototype.addScore = function () {
        this.score++;
    }
    Player.prototype.setPing = function (newPing) {
        this.ping = newPing;
    }

    /**
     *  FIXME
     */
    Player.prototype.getPosition = function () {
        return this.ship.getPosition();
    }
    Player.prototype.getVelocity = function () {
        return this.ship.getVelocity();
    }


    Player.prototype.getPing = function () {
        return this.ping;
    }

    Player.prototype.toString = function () {
        return this.getName() + "[" + this.id + "]";
    };

    Player.prototype.setJSON = function (newValues) {
        this.ship.position.setValue(newValues.ship.position);
        this.ship.velocity.setValue(newValues.ship.velocity);
        //this.ship.velocity = this.ship.velocity.lerp(new Vector(newValues.ship.velocity.x, newValues.ship.velocity.y), 0.9);
        //  this.ship.position = this.ship.position.lerp(new Vector(newValues.ship.position.x, newValues.ship.position.y), 0.9);

        this.id = newValues.id;
        this.name = newValues.name;

        this.score = newValues.score;

        this.ping = newValues.ping;
        this.ship.health = newValues.ship.health;
        this.ship.angle = newValues.ship.angle;
        this.ship.alive = newValues.ship.alive;
        this.ship.vel_x = newValues.ship.vel_x;
        this.ship.vel_y = newValues.ship.vel_y;
        this.ship.angle = newValues.ship.angle;
        this.ship.turningLeft = newValues.ship.turningLeft;
        this.ship.turningRight = newValues.ship.turningRight;
        this.ship.accelerating = newValues.ship.accelerating;
        this.ship.afterburner = newValues.ship.afterburner;
        this.ship.radius = newValues.ship.radius;
        this.ship.size = newValues.ship.size;

    }

    Player.prototype.toJSON = function () {
        return {
            id: this.id,
            name: this.name,
            lastReceivedUpdate: this.lastReceivedUpdate,
            score: this.score,
            ping: this.ping,
            ship: {
                position: this.ship.position,
                velocity: this.ship.velocity,
                size: this.ship.size,
                radius: this.ship.radius,
                health: this.ship.health,
                lastReceivedUpdate: this.lastReceivedUpdate,
                alive: this.ship.alive,
                angle: this.ship.angle,
                accelerating: this.ship.accelerating,
                afterburner: this.ship.afterburner,
                turningLeft: this.turningLeft,
                turningRight: this.turningRight
            }

        }
    }
})(typeof exports === 'undefined' ? this['Player'] = {} : exports);