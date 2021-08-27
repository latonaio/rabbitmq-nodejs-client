import { RabbitmqClient } from 'rabbitmq-client';


async function main() {
  // 環境変数から情報を読み込む
  const url = process.env.RABBITMQ_URL;
  const queueNameFrom = process.env.QUEUE_FROM;
  const queueNameTo = process.env.QUEUE_TO;

  console.log('started:');

  // 接続
  const client = await RabbitmqClient.create(
    url,
    [queueNameFrom],
    [queueNameTo]
  );

  console.log('connected:');

  // 受け取り元キューからメッセージが届いたとき
  // この for 文が実行される
  for await (const message of client.iterator()) {
    try {
      console.log('received:');
      console.log('data:', message.data);

      // 受け渡し先キューにリレー (そのまま書き込み)
      await client.send(queueNameTo, message.data);
      console.log('sent:');

      // 処理完了を通知 (キューからメッセージ msg が消える)
      message.success();
      console.log('removed');
    } catch (e) {
      console.error('errored:', e);
      console.log(message);

      // 処理失敗を通知 (デッドレターに送られる (定義されている場合))
      message.fail();
    }
  }
}


if (require.main === module) {
  main();
}
