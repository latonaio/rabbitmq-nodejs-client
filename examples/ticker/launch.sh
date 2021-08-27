#!/bin/bash

RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/%2F \
QUEUE_TO=test_a \
TICK_INTERVAL=5 \
	yarn start
