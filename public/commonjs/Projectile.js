/**
 * Created by Ville on 1.3.2014.
 */
(function (exports) {

    exports.Projectile = Projectile;

    function Projectile(position, velocity, range, projectileVelocity) {
        this.position = position;
        this.velocity = velocity;
        this.lifetime = range || 200;
        this.projectileVelocity = projectileVelocity || 10;
        this.alive = true;
        this.damage = 5;
        this.id = "";
        this.size = 2;
    };

    Projectile.prototype.getPosition = function() {
        return this.position;
    }

    Projectile.prototype.setX = function(newValue) {
        this.position.x = newValue;
    }

    Projectile.prototype.setY = function(newValue) {
        this.position.y = newValue;
    }

    Projectile.prototype.move = function () {
        this.position = this.position.add(this.velocity);
        this.lifetime -= this.projectileVelocity;
        if(this.lifetime < 0) {
            this.alive = false;
        }

    };

    Projectile.prototype.toJSON = function() {
        return {
            x: this.position.x,
            y: this.position.y,
            vel_x: this.velocity.x,
            vel_y: this.velocity.y
        }
    }

})(typeof exports === 'undefined' ? this['Projectile'] = {} : exports);