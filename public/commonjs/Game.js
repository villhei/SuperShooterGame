(function (exports) {

    exports.Game = Game;

    var util = require("util");

    function Game() {
        this.area = {
            sizeX: 800,
            sizeY: 600
        }

        this.cannon = {
            bulletVelocity: 15
        };

        this.missile = {
            missileVelocity: 10,
            fireDelay: 500
        }
        this.max_speed = 15;
        this.respawnTime = 1000;
        this.tickCount = 0;
        this.state = new GameState();
        this.updatesPerSecond = 30;
        this.gameRunner;
        this.max_idle_time = 60*1000;
    }

    Game.prototype.removePlayer = function(playerId) {
        var removePlayer = this.state.playerById(playerId);
        if (removePlayer === undefined) {
            return false;
        } ;
        this.state.players.splice(this.state.players.indexOf(removePlayer), 1);
        return true;
    }

    Game.prototype.updatePlayerInput = function(playerId, movementData) {

        var targetPlayer = this.state.playerById(playerId);
        if(!targetPlayer) {
            return false;
        }
        if (movementData.accel_x < 0) {
            targetPlayer.ship.turnLeft();
        } else if (movementData.accel_x > 0) {
            targetPlayer.ship.turnRight();
        }
        if (movementData.accel_y == 1) {
            targetPlayer.ship.accelerating = true;
        } else {
            targetPlayer.ship.accelerating = false;
        }

        if (movementData.firing) {
            targetPlayer.ship.firing_primary = true;
        } else {
            targetPlayer.ship.firing_primary = false;
        }

        if (movementData.firing_secondary) {
            targetPlayer.ship.firing_secondary = true;
        } else {
            targetPlayer.ship.firing_secondary = false;
        }

        if (movementData.afterburner) {
            targetPlayer.ship.afterburner = true;
        } else {
            targetPlayer.ship.afterburner = false;
        }
        return true;
    }

    Game.prototype.respawnShip = function (player) {
        var startX = Math.round(Math.random() * (this.area.sizeX)),
            startY = Math.round(Math.random() * (this.area.sizeY));
        player.ship = new Ship(startX, startY, player.id);
    }

    Game.prototype.runGameCycle = function () {

        this.updateBallistics();
        this.updatePlayers();
    }

    Game.prototype.updateBallistics = function() {
        this.state.projectiles = this.updateWeapon(this.state.projectiles);
        this.state.missiles = this.updateWeapon(this.state.missiles);
    }


    Game.prototype.updateWeapon = function (weaponType) {
        var livingProjectiles = weaponType.filter(function (element) {
            return element.alive;
        });
        for (var i = 0; i < livingProjectiles.length; ++i) {
            var projectile = livingProjectiles[i];
            if (projectile.alive) {
                projectile.move();
                this.checkAreaBounds(projectile);
                this.checkWeaponHits(projectile)
            }
        }
        return livingProjectiles;
    }

    Game.prototype.updatePlayers = function () {
        for (var i = 0; i < this.state.players.length; ++i) {
            var player = this.state.players[i];
            if (player.ship.alive) {
                player.ship.regenerate();
                player.ship.update();
                this.checkAreaBounds(player.ship);
                if (player.ship.firing_primary) {
                    this.fireProjectile(player.ship);
                }
                if (player.ship.firing_secondary) {
                    this.fireMissile(player.ship);
                }
            } else {
                var timeNow = new Date().getTime();

                if (player.ship.deathTime + this.respawnTime <= timeNow) {
                    util.log("Respawning player " + player);
                    this.respawnShip(player);
                }
            }
        }
    }

    Game.prototype.checkWeaponHits = function (projectile) {
        var game = this;

        game.state.players.forEach(function (player) {
            if (projectile.position.distance(player.ship.getPosition()) <= player.ship.size) {
                if (player.id != projectile.id && player.ship.alive) {
                    player.ship.health -= projectile.damage;
                    if (player.ship.health < 0) {
                        player.ship.alive = false;
                        player.ship.deathTime = new Date().getTime();
                        var killer = game.state.playerById(projectile.id);
                        if (killer) {
                            util.log(killer + " killed " + player.getName() + ", new score: " + killer.score);
                            killer.score++;
                        }
                    }
                    projectile.alive = false;
                }
            }
        })
    }

    Game.prototype.fireProjectile = function (weaponizedEntity) { // Such as ship
        var we = weaponizedEntity;

        var projectileVelocity = this.cannon.bulletVelocity;
        var launch_vel_x = we.vel_x + (Math.cos(we.angle * Math.PI / 180) * projectileVelocity);
        var launch_vel_y = we.vel_y + (Math.sin(we.angle * Math.PI / 180) * projectileVelocity);

        var projectile = new Projectile(weaponizedEntity.getWeaponPosition(), new Vector(launch_vel_x, launch_vel_y));
        projectile.id = we.id;
        this.state.projectiles.push(projectile);
    }

    Game.prototype.fireMissile = function (weaponizedEntity) { // Such as ship
        var we = weaponizedEntity;
        var timeNow = new Date().getTime()

        if(timeNow - we.lastMissileFire < this.missile.fireDelay) {
            return;
        } else

        we.lastMissileFire = new Date().getTime();
        var missileVelocity = this.missile.missileVelocity;
        var launch_vel_x = we.vel_x + (Math.cos(we.angle * Math.PI / 180) * missileVelocity);
        var launch_vel_y = we.vel_y + (Math.sin(we.angle * Math.PI / 180) * missileVelocity);

        var missile = new Missile(weaponizedEntity.getWeaponPosition(), new Vector(launch_vel_x, launch_vel_y), we.angle);
        missile.id = we.id;
        missile.setTrackTraget(this.state.players);
        this.state.missiles.push(missile);
    }


    Game.prototype.checkAreaBounds = function (movableEntity) {

        var me = movableEntity;

        if (me.getPosition().x < 0) {
            me.setX(this.area.sizeX);
        }
        if (me.getPosition().x > this.area.sizeX) {
            me.setX(0);
        }
        if (me.getPosition().y < 0) {
            me.setY(this.area.sizeY);
        }
        if (me.getPosition().y > this.area.sizeY) {
            me.setY(0);
        }
    }

    Game.prototype.run = function (gameStateUpdater) {
        var game = this;
        this.gameRunner = setInterval(function () {
            game.tickCount++;
            game.runGameCycle();

            gameStateUpdater(game.packGameData());
        }, 1000 / this.updatesPerSecond);
    }


    Game.prototype.packGameData = function () {
        var players = [];
        var projectiles = [];
        var missiles = [];
        var scores = [];

        var i;
        for (i = 0; i < this.state.players.length; ++i) {
            var playerData = this.state.players[i].toJSON();
            players.push(playerData);
            scores.push({
                name: playerData.name,
                score: playerData.score
            })
        }
        for (i = 0; i < this.state.projectiles.length; ++i) {
            projectiles.push(this.state.projectiles[i].toJSON());
        }
        this.state.missiles.forEach(function(missile) {
            missiles.push(missile.toJSON());
        })
        return {
            tick: this.tickCount,
            players: players,
            scores: scores,
            missiles: missiles,
            projectiles: projectiles
        }
    }


})(typeof exports === 'undefined' ? this['Game'] = {} : exports);