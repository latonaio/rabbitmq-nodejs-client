# message-relayer-nodejs

## 概要

環境変数 `QUEUE_FROM` で指定されているキューからメッセージを取り出し、環境変数 `QUEUE_TO` で指定されているキューにメッセージをリレーするサンプルプログラムです。


## 実行

事前に RabbitMQ の Web UI 等で `QUEUE_FROM`, `QUEUE_TO` で指定されているキューを作成しておく必要があります。


### テスト実行

`launch.sh` 内の `RABBITMQ_URL` を適切な値に書き換え、実行してください。


### Kubernetes 上で実行

* `message-relayer-nodejs.yaml` 内の `RABBITMQ_URL` を適切な値に書き換えます。
* `make docker-build` コマンドで Docker イメージを作成します。
* `kubectl apply -f message-relayer-nodejs.yaml` コマンドで Deployment を作成します。
