(function (exports) {

    exports.Player = Player

    function Player(sessionId) {
        this.id = sessionId;
        this.name;
        this.ship = new Ship(0,0);
        this.score = 0;
        this.ping = 0;

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
    Player.prototype.getPosition = function() {
        return this.ship.getPosition();
    }


    Player.prototype.getPing = function () {
        return this.ping;
    }

    Player.prototype.toString = function () {
        return this.getName() + "[" + this.id + "]";
    };

    Player.prototype.setJSON = function (newValues) {
        this.ship.setX(newValues.x);
        this.ship.setY(newValues.y);
        this.id = newValues.id;
        this.name = newValues.name;

        this.score = newValues.score;

        this.ping = newValues.ping;
        this.ship.health = newValues.ship.health;
        this.ship.angle = newValues.ship.angle;
        this.ship.alive = newValues.ship.alive;
        this.ship.vel_x = newValues.ship.vel_x;
        this.ship.vel_y = newValues.ship.vel_y;
        this.ship.accelerating = newValues.ship.accelerating;
        this.ship.afterburner = newValues.ship.afterburner;

    }

    Player.prototype.toJSON = function () {
        return {
            x: this.ship.getX(),
            y: this.ship.getY(),
            id: this.id,
            name: this.name,
            score: this.score,
            ping: this.ping,
            ship: {
                x: this.ship.getX(),
                y: this.ship.getY(),
                health: this.ship.health,
                alive: this.ship.alive,
                angle: this.ship.angle,
                accelerating: this.ship.accelerating,
                afterburner: this.ship.afterburner,
                vel_x: this.ship.vel_x,
                vel_y: this.ship.vel_y
            }

        }
    }
})(typeof exports === 'undefined' ? this['Player'] = {} : exports);