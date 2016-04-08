@ECHO OFF
ECHO This script will start a prodcution-plant example (Rabbit-MQ needed)
START "DF" node ./../../DFInstance.js
pause
START "Filler1" nodemon --watch Filler.js Filler.js
Timeout /T 1
START "Filler2" nodemon --watch Filler.js Filler.js
START "Printer" nodemon --watch Printer.js Printer.js
START "Input2" nodemon --watch BottleInput.js BottleInput.js
Timeout /T 1
START "Input1" nodemon --watch BottleInput.js BottleInput.js
Timeout /T 1
START "Input3" nodemon --watch BottleInput.js BottleInput.js
START "Output" nodemon --watch BottleOutput.js BottleOutput.js
START "HandlingRobot" nodemon --watch HandlingRobot.js HandlingRobot.js
pause
START "Order" nodemon --watch Order.js Order.js