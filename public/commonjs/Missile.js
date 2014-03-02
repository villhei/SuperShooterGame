/**
 * Created by Ville on 1.3.2014.
 */
(function (exports) {

    exports.Projectile = Missile;

    function Missile(position, velocity) {
        this.position = position;
        this.velocity = velocity;
        this.lifetime = range || 250;
        this.turningspeed = 1;
        this.alive = true;
        this.damage = 40;
        this.id = "";
        this.size = 2;
    };

    Missile.prototype.getPosition = function() {
        return this.position;
    }

    Missile.prototype.setX = function(newValue) {
        this.position.x = newValue;
    }

    Missile.prototype.setY = function(newValue) {
        this.position.y = newValue;
    }

    Missile.prototype.move = function () {
        this.position = this.position.add(this.velocity);
        this.lifetime -= this.projectileVelocity;
        if(this.lifetime < 0) {
            this.alive = false;
        }

    };

    Missile.prototype.toJSON = function() {
        return {
            x: this.position.x,
            y: this.position.y,
            vel_x: this.velocity.x,
            vel_y: this.velocity.y
        }
    }

})(typeof exports === 'undefined' ? this['Missile'] = {} : exports);