"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitmqClient = exports.RabbitmqMessage = void 0;
const events_1 = require("events");
const amqp = require("amqp-connection-manager");
class RabbitmqMessage {
    #channelWrapper;
    #message;
    #data;
    #isResponded;
    constructor(message, channelWrapper) {
        this.#channelWrapper = channelWrapper;
        this.#message = message;
        this.#data = JSON.parse(message.content.toString('utf-8'));
        this.#isResponded = false;
    }
    // 念のため getter を公開
    // 利用は非推奨
    get _message() {
        return this.#message;
    }
    get data() {
        return this.#data;
    }
    get queueName() {
        return this.#message.fields.routingKey;
    }
    get isResponded() {
        return this.#isResponded;
    }
    success() {
        this.#channelWrapper.ack(this.#message);
        this.#isResponded = true;
    }
    fail() {
        this.#channelWrapper.nack(this.#message, false, false);
        this.#isResponded = true;
    }
    requeue() {
        this.#channelWrapper.nack(this.#message, false, true);
        this.#isResponded = true;
    }
}
exports.RabbitmqMessage = RabbitmqMessage;
class RabbitmqClient extends events_1.EventEmitter {
    #channelWrapper;
    #receiveQueues;
    #sendQueues;
    #setupFunc;
    constructor(channelWrapper, receiveQueues, sendQueues) {
        super();
        this.#channelWrapper = channelWrapper;
        this.#receiveQueues = receiveQueues;
        this.#sendQueues = sendQueues;
        this.#setupFunc = null;
    }
    static create(url, receiveQueues = null, sendQueues = null, prefetchCount = 1) {
        return new Promise((resolve, reject) => {
            // 接続
            const connection = amqp.connect([url]);
            // 整形
            const receiveQueuesSet = new Set([...(receiveQueues || [])]);
            const sendQueuesSet = new Set([...(sendQueues || [])]);
            const queuesSet = new Set([...receiveQueuesSet, ...sendQueuesSet]);
            const channelWrapper = connection.createChannel({
                setup: async (channel) => {
                    try {
                        // メッセージを同時に受け取る個数をセット
                        await channel.prefetch(prefetchCount);
                        // キューの存在確認
                        for (const queueName of queuesSet) {
                            await channel.checkQueue(queueName);
                        }
                        resolve(self);
                    }
                    catch (e) {
                        reject(e);
                    }
                },
            });
            const self = new RabbitmqClient(channelWrapper, receiveQueuesSet, sendQueuesSet);
        });
    }
    startReceiving() {
        if (this.#setupFunc) {
            return;
        }
        this.#setupFunc = async (channel) => {
            for (const queueName of this.#receiveQueues) {
                await channel.consume(queueName, (msgRaw) => {
                    try {
                        this.emit('message', new RabbitmqMessage(msgRaw, this.#channelWrapper));
                    }
                    catch (e) {
                        console.error('[RabbitmqClient] message parsing failed, ignoring!:', e);
                    }
                }, {
                    consumerTag: queueName
                });
            }
        };
        this.#channelWrapper.addSetup(this.#setupFunc);
    }
    stopReceiving() {
        if (!this.#setupFunc) {
            return;
        }
        this.#channelWrapper.removeSetup(this.#setupFunc, async (channel) => {
            for (const queueName of this.#receiveQueues) {
                await channel.cancel(queueName);
            }
        });
        this.#setupFunc = null;
    }
    async *iterator(stopOnExit = true) {
        // 先にイベントを購読したいので、受信開始は次の tick まで遅延
        setImmediate(() => {
            this.startReceiving();
        });
        try {
            for await (const [message] of events_1.on(this, 'message')) {
                yield message;
            }
        }
        finally {
            // break されたとき
            stopOnExit && this.stopReceiving();
        }
    }
    async send(queueName, data) {
        if (!this.#sendQueues.has(queueName)) {
            throw new Error(`queueName not passed to create(): ${queueName}`);
        }
        await this.#channelWrapper.sendToQueue(queueName, Buffer.from(JSON.stringify(data), 'utf-8'), {
            contentType: 'application/json',
            persistent: true,
        });
    }
    async close() {
        this.stopReceiving();
        await this.#channelWrapper.close();
    }
}
exports.RabbitmqClient = RabbitmqClient;
