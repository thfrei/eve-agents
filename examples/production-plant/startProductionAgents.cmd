@ECHO OFF
ECHO This script will start all production agents
START "Filler1" nodemon --watch Filler.js Filler.js
Timeout /T 1
START "Filler2" nodemon --watch Filler.js Filler.js
Timeout /T 1
START "Printer" nodemon --watch Printer.js Printer.js
Timeout /T 1
START "Input2" nodemon --watch BottleInput.js BottleInput.js
Timeout /T 1
START "Input1" nodemon --watch BottleInput.js BottleInput.js
Timeout /T 1
START "Input3" nodemon --watch BottleInput.js BottleInput.js
Timeout /T 1
START "Output" nodemon --watch BottleOutput.js BottleOutput.js
Timeout /T 1
START "HandlingRobot" nodemon --watch HandlingRobot.js HandlingRobot.js