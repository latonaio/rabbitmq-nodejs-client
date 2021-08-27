import * as process from 'process';

import { RabbitmqClient } from 'rabbitmq-client';


const getTickInterval = () => {
  let interval = parseFloat(process.env.TICK_INTERVAL);
  if (Number.isNaN(interval)) {
    interval = 5;
  }
  interval = Math.floor(interval * 1000);
  return interval;
}


async function main() {
  // 環境変数から情報を読み込む
  const url = process.env.RABBITMQ_URL;
  const queueNameTo = process.env.QUEUE_TO;
  const tickInterval = getTickInterval();

  // 接続
  const client = await RabbitmqClient.create(url, [], [queueNameTo]);

  const intervalFunc = async () => {
    const now = new Date().toISOString();
    const data = {
      'time': now
    };
    await client.send(queueNameTo, data);
    console.log('sent:', data);
  };

  setInterval(intervalFunc, tickInterval);
  intervalFunc();
}


if (require.main === module) {
  main();
}
