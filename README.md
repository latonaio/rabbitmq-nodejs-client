# rabbitmq-nodejs-client
rabbitmq-nodejs-client は、RabbitMQ に接続し、メッセージを送受信するための Node.js 用クライアントライブラリです。


## 動作環境

* Node.js v12 以降
* TypeScript (オプション)


## 導入方法

yarn または npm でインストールしてください。

```sh
yarn add "git+https://github.com/latonaio/rabbitmq-nodejs-client.git#main"
```

または

```sh
npm install "git+https://github.com/latonaio/rabbitmq-nodejs-client.git#main"
```

TypeScript を利用する場合、`tsconfig.json` 中の `target` を `es2018` 以降、もしくは `esnext` に設定してください。

例:

```json
{
	"compilerOptions": {
		"target": "es2018"
	}
}
```


## 使用方法

### ライブラリの初期化

`RabbitmqClient` を import します。

```ts
import { RabbitmqClient } from 'rabbitmq-client';
```

`await RabbitmqClient.create('<URL>', ['<受信するキュー名>'...], ['<送信するキュー名>'...]);` でクライアントを作成します。

指定するキューは事前に存在している必要があります。存在しない場合は例外が発生します。

例:

```ts
const client = await RabbitmqClient.create(
	'amqp://username:password@hostname:5672/virtualhost',
	['queue_from'],
	['queue_to']
);
```


### キューからメッセージを受信

メッセージは次の 2 通りの方法で受け取ることができます。

メッセージの処理を終えたあとは、必ず結果を通知するメソッド (`message.success()`, `message.fail()` または `message.requeue()`) をコールしてください。`success()` の場合はキューからそのメッセージが正常に削除され、`fail()` の場合はそのメッセージがデッドレターに送られます (設定されている場合) 。

(何らかの理由で再度メッセージをキューに戻したいときは、`message.requeue()` をコールしてください。)

`message.queueName` に受け取り元キューの名前が、`message.data` に受信したデータが格納されています。


#### 方法 1 (推奨)

次のようなループでメッセージを処理します。

例:

```ts
for await (const message of client.iterator()) {
	try {
		// 何らかの処理
		console.log(`received from ${message.queueName}`);
		console.log('data:', message.data);

		// 成功時
		message.success();
	} catch (e) {
		// 失敗時
		message.fail();
	}
}
```


#### 方法 2

イベントリスナにてメッセージを処理します。

例:

```ts
// リスナの登録
client.on('message', message => {
	try {
		// 何らかの処理
		console.log(`received from ${message.queueName}`);
		console.log('data:', message.data);

		// 成功時
		message.success();
	} catch (e) {
		// 失敗時
		message.fail();
	}
});

// 受信開始
await client.startReceiving();

// 受信を終了するときは
// await client.stopReceiving();
```


### メッセージを送信する

`await client.send('<送信先キュー名>', <データ>)` のように呼び出してください。`<データ>` には JSON 化できるオブジェクトを渡します。

例:

```ts
const payload = {
	'hello': 'world'
};
await client.send('queue_to', payload);
```


### 接続を終了する

`close()` メソッドを呼び出してください。

```ts
await client.close();
```
