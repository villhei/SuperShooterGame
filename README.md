SuperShooterGame
================

The game is an HTML5 arcade multiplayer shooter game running at
http://ssg.plop.fi:8080

The game is a multiplayer game, where an open tab means an active game sessions, so try opening a second browser window or inviting a friend. If your window stays idle for one minute, you will receive a kick. Reconnect by refreshing the window.

The game runs on authoritative NodeJS server, which is reponsible for the game's state.

The client sends it's input decisions to the server and renderes the server-provided game state.

The server and the client communicate over a Socket.IO -based prototocol

TASKLIST
- [x] Replicate the game logic in the client
- [x] Add time stepping, server & client running on different speeds
- [x] Client-side state prediction with signed input packages
- [x] Implement asteroid / terrain system
- [ ] Improve asteroid / terrains
- [ ] Improve client-side prediction
- [ ] More game mechanic
- [ ] Sounds
