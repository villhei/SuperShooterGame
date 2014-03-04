/**
 * Created by Ville on 27.2.2014.
 */

(function (exports) {

    exports.GameState = function () {

        var players = [];
        var entities = [];
        var projectiles = [];
        var missiles = [];
        var sizeX = 800;
        var sizeY= 800;
        var ticks = 0;
        function playerById(id) {
            var i;
            for (i = 0; i < players.length; i++) {
                if (players[i].id == id)
                    return players[i];
            };
            return false;
        };

        return {
            players: players,
            entities: entities,
            missiles: missiles,
            projectiles: projectiles,
            ticks: ticks,
            playerById: playerById,
            sizeX: sizeX,
            sizeY: sizeY
        }

    }

})(typeof exports === 'undefined' ? this['GameState'] = {} : exports);