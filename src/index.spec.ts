import { RabbitmqClient } from './index';
import * as amqp from 'amqp-connection-manager';

describe('RabbitmqClient', () => {
  beforeEach(async () => {
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const prefetchSpyOn = jest.fn();
  const checkQueueSpyOn = jest.fn();

  const url = 'amqp://username:password@hostname:5672/virtualhost';
  const receiveQueues = ['receive-queue'];
  const sendQueues = ['send-queue'];

  jest.spyOn(amqp, 'connect').mockImplementation(() => createChannelMock);

  let rabbitmqClient: RabbitmqClient;

  const messageResponse = {
    queueName: receiveQueues[0],
    isResponded: false,
    data: {
      test: 'test'
    }
  };

  const setupFunc = () => {
    rabbitmqClient.emit('message', messageResponse);
  }

  const removeSetupSpyOn = jest.fn();

  const createChannelMock: any = {
    createChannel: (opts: any) => {
      opts.setup({
        prefetch: prefetchSpyOn,
        checkQueue: checkQueueSpyOn
      })

      return {
        addSetup: setupFunc,
        removeSetup: removeSetupSpyOn
      }
    },
  };

  it('should can call create', async () => {
    rabbitmqClient = await RabbitmqClient.create(url, receiveQueues, sendQueues);

    expect(amqp.connect).toHaveBeenCalled();
    expect(prefetchSpyOn).toHaveBeenCalled();
    expect(checkQueueSpyOn).toHaveBeenCalled();
  });

  it('should can call iterator', async () => {
    for await (const message of rabbitmqClient.iterator()) {
      expect(message).toEqual(messageResponse);
      break;
    }
  });
});
