SuperShooterGame
================

The game is an HTML5 arcade shooter game hosted at
http://ssh.plop.fi:8080

The game runs on authoritative NodeJS server, which is reponsible for the game's state.

The client sends it's input decisions to the server and renderes the server-provided game state.

TASKLIST
- Replicate the game logic in the client
- Add time stepping, server & client running on different speeds
- Client-side state prediction with signed input packages
