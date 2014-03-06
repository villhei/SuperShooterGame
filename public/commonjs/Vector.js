(function (exports) {

    exports.Vector = Vector;

        function Vector(x, y) {
        if (typeof x !== 'number') {
            throw new TypeError("Expected a number but  " +x);
        }
        if (typeof y !== 'number') {
            throw new TypeError("Expected a number but received " + y);
        }
        this.x = x;
        this.y = y;
    }

    Vector.prototype.setValue = function(params) {
        if (typeof params.x !== 'number') {
            throw new TypeError("Expected a number but received " +x);
        }
        if (typeof params.y !== 'number') {
            throw new TypeError("Expected a number but received " + y);
        }
        this.x = params.x;
        this.y = params.y;
    }

    Vector.prototype.equals = function (other) {
        return (this.x === other.x && this.y === other.y);
    }

    Vector.prototype.dot = function (other) {
        return this.x * other.x + this.y * other.y;
    };

    Vector.prototype.multiply = function (value) {
        return new Vector(this.x * value, this.y * value);
    };

    Vector.prototype.cross2D = function (vector) {
        return this.x*vector.y - this.y*vector.x;
    }

    Vector.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    Vector.prototype.squaredLength = function () {
        return (this.x * this.x + this.y * this.y);
    };

    Vector.prototype.normalize = function () {
        return new Vector(this.x / this.length(), this.y / this.length());
    };

    Vector.prototype.subtract = function (vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    };

    Vector.prototype.add = function (vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    };

    Vector.prototype.divide = function (value) {
        return new Vector(this.x / value, this.y / value)
    };

    Vector.prototype.isZero = function() {
        return this.x == 0 && this.y == 0;
    }

    Vector.prototype.distance = function (vector) {
        return this.subtract(vector).length();
    }

    Vector.prototype.squaredDistance = function (vector) {
        return this.subtract(vector).squaredLength();
    }

    Vector.prototype.lerp = function(vector, t) {
        return new Vector(this.x+(vector.x-this.x)*t, this.y+(vector.y-this.y)*t);
    }

    Vector.prototype.angle = function (vector) {
        var deltaX = vector.x - this.x;
        var deltaY = vector.y - this.y;
        return Math.atan2(deltaX, deltaY) * 180 / Math.PI;
    }

    Vector.prototype.toString = function () {
        return "Vector (" + this.x + "," + this.y + ")";

    }
})(typeof exports === 'undefined' ? this['Vector'] = {} : exports);