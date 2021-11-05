import { EventEmitter, on } from 'events';

import * as amqp from 'amqp-connection-manager';
import * as amqplib from 'amqplib';


export class RabbitmqMessage {
  #channelWrapper: amqp.ChannelWrapper;
  #message: amqplib.ConsumeMessage;
  #data: any;
  #isResponded: boolean;

  constructor(message: amqplib.ConsumeMessage, channelWrapper: amqp.ChannelWrapper) {
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


export class RabbitmqClient extends EventEmitter {
  #channelWrapper: amqp.ChannelWrapper;
  #receiveQueues: Set<string>;
  #sendQueues: Set<string>;
  #setupFunc: amqp.SetupFunc | null;

  private constructor(channelWrapper: amqp.ChannelWrapper, receiveQueues: Set<string>, sendQueues: Set<string>) {
    super();
    this.#channelWrapper = channelWrapper;
    this.#receiveQueues = receiveQueues;
    this.#sendQueues = sendQueues;
    this.#setupFunc = null;
  }

  static create(url: string, receiveQueues: Iterable<string> | null = null, sendQueues: Iterable<string> | null = null, prefetchCount = 1): Promise<RabbitmqClient> {
    return new Promise((resolve, reject) => {
      // 接続
      const connection = amqp.connect([url]);

      // 整形
      const receiveQueuesSet = new Set([...(receiveQueues || [])]);
      const sendQueuesSet = new Set([...(sendQueues || [])]);
      const queuesSet = new Set([...receiveQueuesSet, ...sendQueuesSet]);

      const channelWrapper = connection.createChannel({
        setup: async (channel: amqplib.ConfirmChannel) => {
          try {
            // メッセージを同時に受け取る個数をセット
            await channel.prefetch(prefetchCount);

            // キューの存在確認
            for (const queueName of queuesSet) {
              await channel.checkQueue(queueName);
            }

            resolve(self);
          } catch (e) {
            reject(e);
          }
        },
      });

      const self = new RabbitmqClient(channelWrapper, receiveQueuesSet, sendQueuesSet);
    });
  }

  async startReceiving() {
    if (this.#setupFunc) {
      return;
    }

    this.#setupFunc = async (channel: amqplib.ConfirmChannel) => {
      for (const queueName of this.#receiveQueues) {
        await channel.consume(queueName, (msgRaw: amqplib.ConsumeMessage | null) => {
          try {
            this.emit('message', new RabbitmqMessage(msgRaw!, this.#channelWrapper));
          } catch (e) {
            console.error('[RabbitmqClient] message parsing failed, ignoring!:', e);
            this.#channelWrapper.nack(msgRaw!, false, false);
          }
        }, {
          consumerTag: queueName
        });
      }
    };

    await this.#channelWrapper.addSetup(this.#setupFunc);
  }

  async stopReceiving() {
    if (!this.#setupFunc) {
      return;
    }

    await this.#channelWrapper.removeSetup(this.#setupFunc, async (channel: amqplib.ConfirmChannel) => {
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
      for await (const [ message ] of on(this, 'message')) {
        yield message as RabbitmqMessage;
      }
    } finally {
      // break されたとき
      stopOnExit && await this.stopReceiving();
    }
  }

  async send(queueName: string, data: any) {
    if (!this.#sendQueues.has(queueName)) {
      throw new Error(`queueName not passed to create(): ${queueName}`);
    }

    await this.#channelWrapper.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(data), 'utf-8'),
      {
        contentType: 'application/json',
        persistent: true,
      }
    );
  }

  async close() {
    await this.stopReceiving();
    await this.#channelWrapper.close();
  }
}
