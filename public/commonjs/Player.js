
(function (exports) {

   exports.Player = function (sessionId, startX, startY) {
        var id = sessionId,
            name,
            score = 0,
            ping = 0,
            ship = new Ship(startX, startY, sessionId);


       var getId = function() {
           return id;
       }

        var getX = function () {
            return ship.getX();
        };

        var getY = function () {
            return ship.getY();
        };

        var setX = function (newX) {
            x = ship.setX(newX);
        };

        var setY = function (newY) {
            y = ship.setY(newY);
        };

        var setName = function (newName) {
            name = newName;
        };

        var getName = function () {
            return name;
        };

       var getScore = function() {
           return score;
       }

       var setPing = function(newPing) {
           ping = newPing;
       }

       var getPing = function() {
           return ping;
       }

        var toString = function () {
            return getName() + "[" + id + "] @ (" + ship.getX() + "," + ship.getY() + ")"
        };

       var setJSON = function(newValues) {
           ship.setX(newValues.x);
           ship.setY(newValues.y);
           id = newValues.id;
           name = newValues.name;
           score = newValues.score;
           ping = newValues.ping;
           ship.health = newValues.ship.health;
           ship.angle = newValues.ship.angle;
           ship.alive = newValues.ship.alive;
           ship.vel_x = newValues.ship.vel_x;
           ship.vel_y = newValues.ship.vel_y;

       }

       var toJSON = function () {
           return {
               x: ship.getX(),
               y: ship.getY(),
               id: id,
               name: name,
               score: score,
               ping: ping,
               ship: {
                   x: ship.getX(),
                   y: ship.getY(),
                   health: ship.health,
                   alive: ship.alive,
                   angle: ship.angle,
                   vel_x: ship.vel_x,
                   vel_y: ship.vel_y
               }

           }
       }

        return {
            getId: getId,
            getX: getX,
            getY: getY,
            setX: setX,
            setY: setY,
            toString: toString,
            toJSON: toJSON,
            setJSON: setJSON,
            getName: getName,
            setName: setName,
            getPing: getPing,
            setPing: setPing,
            ship: ship,
            id: id,
            score: score
        }
    };

})(typeof exports === 'undefined' ? this['Player'] = {} : exports);