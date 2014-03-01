/**
 * Created by Ville on 27.2.2014.
 */

(function (exports) {

   exports.Player = function (sessionId, startX, startY) {
        var x = startX,
            y = startY,
            id = sessionId,
            vel_x = 0,
            vel_y = 0,
            acceleration = 0.1,
            turningspeed = 2,
            name,
            ping = 0;
            radius = 20,
            health = 100,
            score = 0,
            angle = 0;


       var getId = function() {
           return id;
       }

        var getX = function () {
            return x;
        };

        var getY = function () {
            return y;
        };

        var setX = function (newX) {
            x = newX;
        };

        var setY = function (newY) {
            y = newY;
        };

       var addVel_x = function(addition) {
           vel_x += addition;
       }

       var addVel_y = function(addition) {
           vel_y += addition;
       }

       var getVel_x = function () {
           return vel_x;
       };

       var getVel_y = function () {
           return vel_y;
       };

       var setVel_x = function (newX) {
           vel_x = newX;
       };

       var setVel_y = function (newY) {
           vel_y = newY;
       };

        var setName = function (newName) {
            name = newName;
        };

        var getName = function () {
            return name;
        };

       var setPing = function(newPing) {
           ping = newPing;
       }

       var getPing = function() {
           return ping;
       }

        var toString = function () {
            return getName() + "[" + id + "] @ (" + x + "," + y + ")"
        };

       var toJSON = function () {
           return {
               x: x,
               y: y,
               vel_x: vel_x,
               vel_y: vel_y,
               id: id,
               name: name,
               ping: ping
           }
       }

        return {
            getId: getId,
            getX: getX,
            getY: getY,
            setX: setX,
            setY: setY,
            getVel_x: getVel_x,
            setVel_x: setVel_x,
            getVel_y: getVel_y,
            setVel_y: setVel_y,
            addVel_x: addVel_x,
            addVel_y: addVel_y,
            toString: toString,
            toJSON: toJSON,
            getName: getName,
            setName: setName,
            getPing: getPing,
            setPing: setPing,
            acceleration: acceleration,
            id: id
        }
    };

})(typeof exports === 'undefined' ? this['Player'] = {} : exports);