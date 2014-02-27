/**
 * Created by Ville on 27.2.2014.
 */

(function (exports) {

   exports.Player = function (sessionId, startX, startY) {
        var x = startX,
            y = startY,
            id = sessionId,
            moveAmount = 2,
            name,
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

        var move = function (deltaX, deltaY) {
            x += deltaX;
            y += deltaY;
        };

        var setName = function (newName) {
            name = newName;
        };

        var getName = function () {
            return name;
        };

        var toString = function () {
            return getName() + "[" + id + "] @ (" + x + "," + y + ")"
        };

       var toJSON = function () {
           return {
               x: x,
               y: y,
               id: id,
               name: name
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
            getName: getName,
            setName: setName,
            move: move,
            id: id,
            moveAmount: moveAmount

        }
    };

})(typeof exports === 'undefined' ? this['Player'] = {} : exports);