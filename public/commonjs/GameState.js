/**
 * Created by Ville on 27.2.2014.
 */

(function (exports) {

    exports.GameState = function () {

        var players = [];
        var entities = [];
        var drawables = [];
        var ticks = {
            last_server: 0
        }

        function playerById(id) {
            var i;
            for (i = 0; i < players.length; i++) {
                if (players[i].id == id)
                    return players[i];
            }
            ;

            return false;
        };

        return {
            players: players,
            entities: entities,
            drawables: drawables,
            ticks: ticks,
            playerById: playerById
        }

    }

})(typeof exports === 'undefined' ? this['GameState'] = {} : exports);