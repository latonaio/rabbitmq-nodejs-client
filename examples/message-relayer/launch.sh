#!/bin/bash

RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/%2F \
QUEUE_ORIGIN=test_a \
QUEUE_TO=test_b \
	yarn start
