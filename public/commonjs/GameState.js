/**
 * Created by Ville on 27.2.2014.
 */

(function (exports) {

    exports.GameState = GameState;

    function GameState() {

        this.players = [];
        this.projectiles = [];
        this.missiles = [];
        this.asteroids = [];
        this.sizeX = 800;
        this.sizeY = 800;
        this.ticks = 0;

    }

    GameState.prototype.playerById = function(id) {
        var i;
        for (i = 0; i < this.players.length; i++) {
            if (this.players[i].id == id)
                return this.players[i];
        };
        return false;
    }

})(typeof exports === 'undefined' ? this['GameState'] = {} : exports);