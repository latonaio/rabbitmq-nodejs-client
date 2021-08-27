# ticker-nodejs

## 概要

環境変数 `TICK_INTERVAL` 秒おきに、環境変数 `QUEUE_TO` で指定されているキューに時刻情報を投入するサンプルプログラムです。

以下のようなオブジェクトの形式で投入されます。

```json
{
	"time": "2021-01-01T00:00:00Z"
}
```


## 実行

事前に RabbitMQ の Web UI 等で `QUEUE_TO` で指定されているキューを作成しておく必要があります。


### テスト実行

`launch.sh` 内の `RABBITMQ_URL` を適切な値に書き換え、実行してください。


### Kubernetes 上で実行

* `ticker-nodejs.yaml` 内の `RABBITMQ_URL` を適切な値に書き換えます。
* `make docker-build` コマンドで Docker イメージを作成します。
* `kubectl apply -f ticker-nodejs.yaml` コマンドで Deployment を作成します。
