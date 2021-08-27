/// <reference types="node" />
import { EventEmitter } from 'events';
import * as amqp from 'amqp-connection-manager';
import * as amqplib from 'amqplib';
export declare class RabbitmqMessage {
    #private;
    constructor(message: amqplib.ConsumeMessage, channelWrapper: amqp.ChannelWrapper);
    get _message(): amqplib.ConsumeMessage;
    get data(): any;
    get queueName(): string;
    get isResponded(): boolean;
    success(): void;
    fail(): void;
    requeue(): void;
}
export declare class RabbitmqClient extends EventEmitter {
    #private;
    private constructor();
    static create(url: string, receiveQueues?: Iterable<string> | null, sendQueues?: Iterable<string> | null, prefetchCount?: number): Promise<RabbitmqClient>;
    startReceiving(): void;
    stopReceiving(): void;
    iterator(stopOnExit?: boolean): AsyncGenerator<RabbitmqMessage, void, unknown>;
    send(queueName: string, data: any): Promise<void>;
    close(): Promise<void>;
}
