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
                e.preventDefault();
                break;
            case 17: // Shift
                that.ctrl = true;
                e.preventDefault();
                break;
            case 32: // Spacebar
                that.space = true
                e.preventDefault();
                break;
            // Controls
            case 37: // Left
                that.left = true;
                e.preventDefault();
                break;
            case 38: // Up
                that.up = true;
                e.preventDefault();
                break;
            case 39: // Right
                that.right = true; // Will take priority over the left key
                e.preventDefault();
                break;
            case 40: // Down
                that.down = true;
                e.preventDefault();
                break;
        }
        ;
    };

    var onKeyUp = function (e) {
        e.preventDefault();

        var that = this,
            c = e.keyCode;
        switch (c) {
            case 16: // Shift
                that.shift = false;
                e.preventDefault();
                break;
            case 17: // Shift
                that.ctrl = false;
                e.preventDefault();
                break;
            case 32: // Spacebar
                that.space = false;
                e.preventDefault();
                break;
            case 37: // Left
                that.left = false;
                e.preventDefault();
                break;
            case 38: // Up
                that.up = false;
                e.preventDefault();
                break;
            case 39: // Right
                that.right = false;
                e.preventDefault();
                break;
            case 40: // Down
                that.down = false;
                e.preventDefault();
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