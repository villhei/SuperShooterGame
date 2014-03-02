/**************************************************
 ** GAME KEYBOARD CLASS
 **************************************************/
var Keys = function (up, left, right, down, space, enter, shift, ctrl) {
    var up = up || false,
        left = left || false,
        right = right || false,
        down = down || false,
        space = space || false,
        enter = enter || false,
        shift = shift || false,
        ctrl = ctrl || false;

    var onKeyDown = function (e) {
        var that = this,
            c = e.keyCode;
        switch (c) {
            case 16: // Shift
                that.shift = true;
                break;
            case 17: // Shift
                that.ctrl = true;
                break;
            case 32: // Spacebar
                that.space = true;
                break;
            // Controls
            case 37: // Left
                that.left = true;
                break;
            case 38: // Up
                that.up = true;
                break;
            case 39: // Right
                that.right = true; // Will take priority over the left key
                break;
            case 40: // Down
                that.down = true;
                break;
        }
        ;
    };

    var onKeyUp = function (e) {
        var that = this,
            c = e.keyCode;
        switch (c) {
            case 16: // Shift
                that.shift = false;
                break;
            case 17: // Shift
                that.ctrl = false;
                break;
            case 32: // Spacebar
                that.space = false;
                break;
            case 37: // Left
                that.left = false;
                break;
            case 38: // Up
                that.up = false;
                break;
            case 39: // Right
                that.right = false;
                break;
            case 40: // Down
                that.down = false;
                break;
        }
        ;
    };

    return {
        up: up,
        left: left,
        right: right,
        down: down,
        space: space,
        ctrl: ctrl,
        shift: shift,
        onKeyDown: onKeyDown,
        onKeyUp: onKeyUp
    };
};