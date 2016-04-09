@ECHO OFF
ECHO This script will start a prodcution-plant example (Rabbit-MQ needed)
START "DF" nodemon --watch ./../../DFInstance.js ./../../DFInstance.js
