@ECHO OFF
ECHO This script will start all showcase mi5 agents
ECHO Start the RabbitMQ Broker
pause
ECHO Starting the DF
START "DF" nodemon ./../../DFInstance.js
pause
ECHO Start the Agents for the production modules
START "Cocktail" nodemon Cocktail.js
START "Input" nodemon InputModule.js
START "Output" nodemon OutputModule.js
START "Cookie" nodemon Cookie.js
START "ToppingBeckhoff" nodemon ToppingBeckhoff.js
START "ToppingBosch" nodemon ToppingBosch.js
pause
ECHO Start the Agents for the transport modules
START "XTS" nodemon HandlingXTS.js
pause
START "Task" nodemon Task.js