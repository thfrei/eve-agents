@ECHO OFF
ECHO This script will start a prodcution-plant example (Rabbit-MQ needed)
START "DF" nodemon ./../../DFInstance.js
pause
START "Filler1" nodemon Filler.js
START "Filler2" nodemon Filler.js
START "Printer" nodemon Printer.js
START "Input2" nodemon BottleInput.js
START "Input1" nodemon BottleInput.js
START "Input3" nodemon BottleInput.js
START "Output" nodemon BottleOutput.js
START "HandlingRobot" nodemon HandlingRobot.js
pause
START "Order" nodemon Order.js