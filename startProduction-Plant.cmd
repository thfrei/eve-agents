@ECHO OFF
ECHO This script will start a prodcution-plant example (Rabbit-MQ needed)

START "Filler" nodemon examples/production-plant/Filler.js
START "Input" nodemon examples/production-plant/BottleInput.js
START "Output" nodemon examples/production-plant/BottleOutput.js
START "HandlingRobot" nodemon examples/production-plant/HandlingRobot.js
pause
START "Order" nodemon examples/production-plant/Order.js