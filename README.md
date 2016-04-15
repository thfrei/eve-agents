Agent-based and decentralized control
========================

This project is implementing a multi-agent system.
The core lays in the GeneralAgent-class that implements communication patterns for distributed problem solving.
Further it implements a Directory Facilitator as a service directory.

To make it comparable to other agent solutions (e.g. JADE) it implements the often used book-trading example, where a
couple of agents are offering books, and another agents tires to buy the cheapest one comparing all seller agents offers.

This proejcts contains a lot of example code. Most importantly:
* book-trading (babble)
* production-plant
* showcase-mi5

The implementation of the agent is using ES6/ES2015 to benefit from a nice, generator-based control flow using promises
and the co-library

Installation
-------------

```
git clone https://github.com/thfrei/eve-agents
cd eve-agents
npm install
```

Usage
-------

* Rename the `config.sample.js` in `config.js`
* Adapt the `config.js` if needed.
* Start a local RabbitMQ Broker (if using another than localhost, you need to adapt the agent instances) (e.g.
http://www.rabbitmq.com/download.html)
* Go to examples/production-plant
* Start the agents in this order:
 * `startDF.cmd`
 * `startMinimalAgents.cmd` or `startProductionAgents.cmd`
 * `startOrderAgent.cmd`

Notes
-------
* If you want to use the sniffing feature, make sure, that the RabbitMQ Broker has the MQTT Plugin
(https://www.rabbitmq.com/mqtt.html) enabled.
* A rudimentary graphical visualization is done in this project: https://github.com/thfrei/eve-agents-gui
(with standard configuration it should work out of the box)
* Have a look at this video to see the setup up and running: https://youtu.be/pcjF0Kuo6LY