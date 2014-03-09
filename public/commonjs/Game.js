(function (exports) {

    exports.Game = Game;

    function Game() {
        this.respawnTime = 1000;
        this.gameRunner;
        this.serverInstance = false;
        this.max_idle_time = 60 * 1000;

        this.missile = {
            velocity: 10,
            fireDelay: 500,
            clipSize: 3,
            clipContent: 3,
            reloadDelay: 1500,
            reloadAmount: 1
        }
        this.cannon = {
            velocity: 20,
            clipSize: 40,
            clipContent: 3,
            reloadDelay: 150,
            reloadAmount: 10
        }
        this.area = {

        };
    }

    Game.prototype.init = function() {

        this.state = new GameState(this.area.size);

    }

    Game.prototype.removePlayer = function (playerId) {
        var removePlayer = this.state.playerById(playerId);
        if (removePlayer === undefined) {
            return false;
        }
        ;
        this.state.players.splice(this.state.players.indexOf(removePlayer), 1);
        return true;
    }

    Game.prototype.updateInput = function (player, movementData) {

        player.lastReceivedUpdate = movementData.packageNum;

        if (movementData.accel_x < 0) {
            player.ship.turningLeft = true;
            if (this.serverInstance && player.ping > 0) {
                player.ship.startTurningLeft(0);
            } else {
                player.ship.startTurningLeft();
            }
        } else {
            player.ship.turningLeft = false;
            player.ship.stopTurningLeft();
        }

        if (movementData.accel_x > 0) {
            player.ship.turningRight = true;
            if (this.serverInstance && player.ping > 0) {
                player.ship.startTurningRight(0);
            } else {
                player.ship.startTurningRight();
            }
        } else {
            player.ship.turningRight = false;
            player.ship.stopTurningRight();
        }

        if (movementData.accel_y == 1) {
            player.ship.accelerating = true;
            if (this.serverInstance && player.ping > 0) {
                player.ship.startAcceleration(player.ping/2);
            } else {
                player.ship.startAcceleration();
            }

        } else {
            player.ship.accelerating = false;
            player.ship.stopAcceleration();

        }

        if (movementData.firing) {
            player.ship.firing_primary = true;
        } else {
            player.ship.firing_primary = false;
        }

        if (movementData.firing_secondary) {
            player.ship.firing_secondary = true;
        } else {
            player.ship.firing_secondary = false;
        }

        if (movementData.afterburner) {
            player.ship.afterburner = true;
        } else {
            player.ship.afterburner = false;
        }
        return true;
    }

    Game.prototype.updateShip = function (ship, timeDelta) {
        if (ship.firing_primary) {
            var bullet = this.fireWeapon(ship, ship.cannon, Projectile);
            if (bullet) {
                this.state.projectiles.push(bullet);
            }
        }
        if (ship.firing_secondary) {
            ship.firing_secondary = true;
            var missile = this.fireWeapon(ship, ship.missile, Missile);
            if (missile) {
                missile.setTrackTraget(this.state.players);
                this.state.missiles.push(missile);
            }
        }

        this.state.planets.forEach(function(planet) {
          //  var gravityPull = planet.getGravityForce(ship.position);
         //   var pullAngle = ship.position.angle(planet.position);
        //    ship.applyPullForce(gravityPull/10, -pullAngle);
        })
    }

    Game.prototype.spawnPlanet = function (position) {
        if (!position) {
            return;
        }
        var velocity = new Vector(0, 0);

        var planet = new Planet(100, position, velocity);
        this.state.planets.push(planet);
    }

    Game.prototype.updatePlayerInput = function (playerId, movementData) {

        var targetPlayer = this.state.playerById(playerId);
        if (!targetPlayer) {
            return false;
        }
        this.updateInput(targetPlayer, movementData);
        return true;
    }

    Game.prototype.respawnShip = function (player) {
        var startX = Math.round(Math.random() * (this.area.size)),
            startY = Math.round(Math.random() * (this.area.size));
        player.ship = new Ship(500, 500, player.id);
    }

    Game.prototype.runGameCycle = function (timeDelta) {
        this.updateBallistics(timeDelta);
        this.updatePlayers(timeDelta);
        this.updatePlanets(timeDelta);
    }

    Game.prototype.updateBallistics = function (timeDelta) {
        this.state.projectiles = this.updateWeapon(timeDelta, this.state.projectiles);
        this.state.missiles = this.updateWeapon(timeDelta, this.state.missiles);
    }

    Game.prototype.updatePlanets = function (timeDelta) {
        var game = this;
        this.state.planets.forEach(function (planet) {
            if (!planet.alive) {
                console.log("kaboom!")
            } else {
                planet.move(timeDelta);
                game.checkAreaBounds(planet);
                game.state.players.forEach(function (player) {
                    if (player.ship.getPosition().subtract(planet.position).length() <= player.ship.size + planet.radius) {
                        planet.collision(player.ship);
                    }
                });

            }
        })
    }


    Game.prototype.updateWeapon = function (timeDelta, weaponType) {
        var livingProjectiles = weaponType.filter(function (element) {
            return element.alive;
        });
        for (var i = 0; i < livingProjectiles.length; ++i) {
            var projectile = livingProjectiles[i];
            if (projectile.alive) {
                projectile.move(timeDelta);
                this.checkAreaBounds(projectile);
                this.checkWeaponHits(projectile)
            }
        }
        return livingProjectiles;
    }

    Game.prototype.updatePlayers = function (timeDelta) {
        for (var i = 0; i < this.state.players.length; ++i) {
            var player = this.state.players[i];
            if (player.ship.alive) {

                player.ship.regenerate(timeDelta);
                player.ship.update(timeDelta);
                this.updateShip(player.ship, timeDelta);
                this.checkAreaBounds(player.ship);

            } else if (this.serverInstance) {
                var timeNow = new Date().getTime();
                if (player.ship.deathTime + this.respawnTime <= timeNow) {
                    console.log("Respawning player " + player);
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
                    if (player.ship.health < 0 && game.serverInstance) {
                        player.ship.alive = false;
                        player.ship.deathTime = new Date().getTime();
                        var killer = game.state.playerById(projectile.id);
                        if (killer) {
                            console.log(killer + " killed " + player.getName() + ", new score: " + killer.score);
                            killer.score++;
                        } else {
                            console.log(player.getName() + " died because of an unknown reason");
                        }
                    }
                    projectile.alive = false;
                }
            }
        });
        game.state.planets.forEach(function (planet) {
            if (projectile.position.distance(planet.getPosition()) <= planet.radius) {
                planet.health -= projectile.damage;
                if (planet.health <= 0) {
                    planet.alive = false;
                }
                projectile.alive = false;
            }
        });
    }

    Game.prototype.fireWeapon = function (weaponizedEntity, weapon, TypeFired) { // Such as ship
        var we = weaponizedEntity;
        var timeNow = new Date().getTime(); // GET current time, check if delay has been hit

        if (timeNow - weapon.lastFire < weapon.fireDelay) {
            return false;
        }

        if (weapon.clipContent < 1) {
            return false;
        }

        weapon.clipContent--; // Deduct a shot
        var projectileVelocity = weapon.velocity; // Weapon-specific launch velocity
        var launch_vel_x = we.velocity.x + (Math.cos(we.angle * Math.PI / 180) * projectileVelocity); // Take direction from velocity, multiply with projetilespeed
        var launch_vel_y = we.velocity.y + (Math.sin(we.angle * Math.PI / 180) * projectileVelocity);

        weapon.lastFire = new Date().getTime(); // Register time
        var projectile = new TypeFired(weaponizedEntity.getWeaponPosition(), new Vector(launch_vel_x, launch_vel_y), we.angle);
        projectile.id = we.id;

        return projectile;

    }

    Game.prototype.checkAreaBounds = function (movableEntity) {
        return;

        var me = movableEntity;
        try {
            if (me.getPosition().x < 0) {
                me.getPosition().x = this.state.sizeX;
            }
            if (me.getPosition().x > this.state.sizeX) {
                me.getPosition().x = 0;
            }
            if (me.getPosition().y < 0) {
                me.getPosition().y = this.state.sizeY;
            }
            if (me.getPosition().y > this.state.sizeY) {
                me.getPosition().y = 0;
            }
        } catch (ex) {
            console.log("Error with something area bounds: ", ex);
        }
    }

    Game.prototype.clientRunner = function (deltaTime) {
        this.state.ticks++;
        this.runGameCycle(deltaTime);
    }

    Game.prototype.runServer = function (gameStateUpdater) {
        var game = this;
        game.state.ticks = 0;
        var lastUpdate = new Date().getTime();
        var updateDelay = 1000 / 20;

        this.gameRunner = setInterval(function () {
            var beforeFrame = new Date().getTime();
            var measuredUpdateDelay = beforeFrame - lastUpdate;
            game.state.ticks++;
            game.runGameCycle(measuredUpdateDelay);
            gameStateUpdater(game.packGameData());
            lastUpdate = new Date().getTime();

        }, updateDelay);
    }

    Game.prototype.packGameData = function () {
        var players = [];
        var projectiles = [];
        var missiles = [];
        var scores = [];
        var planets = [];
        var tickCount = this.state.ticks;
        var size = this.area.size;

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
        this.state.missiles.forEach(function (missile) {
            missiles.push(missile.toJSON());
        });
        this.state.planets.forEach(function (planet) {
            planets.push(planet.toJSON());
        });
        return {
            size: size,
            players: players,
            scores: scores,
            ticks: tickCount,
            missiles: missiles,
            planets: planets,
            projectiles: projectiles
        }
    }


})
    (typeof exports === 'undefined' ? this['Game'] = {} : exports);