@ECHO OFF
ECHO This script will start all production agents
Timeout /T 1
START "INPUT" nodemon --watch Input.js Input.js
Timeout /T 1
START "TOPPING" nodemon --watch Topping.js Topping.js
Timeout /T 1
START "COOKIE" nodemon --watch Cookie.js Cookie.js
Timeout /T 1
START "OUTPUT" nodemon --watch Output.js Output.js
Timeout /T 1
START "TRANSPORT" nodemon --watch HandlingRobot.js HandlingRobot.js