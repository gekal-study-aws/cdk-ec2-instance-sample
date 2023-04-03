# EC2インスタンス作成のCKDサンプルアプリ

## インフラ

![infra](images/infra.drawio.png)

## インスタンスへの接続

### EC2 Instance Connect

> [EC2 Instance Connect を使用して接続](https://docs.aws.amazon.com/ja_jp/AWSEC2/latest/UserGuide/ec2-instance-connect-methods.html)

1. AWS Consoleから接続
2. EC2 Instance Connect CLI

    ```bash
    mssh instance_id
    ```

### セッションマネージャー

> [Session Manager を通して SSH 接続のアクセス許可を有効にして制御する](https://docs.aws.amazon.com/ja_jp/systems-manager/latest/userguide/session-manager-getting-started-enable-ssh-connections.html)

1. AWS Consoleから接続
2. EC2 Instance Connect CLI

    ```bash
    aws ssm start-session --target instance-id
    ```

### SSH クライアント

通常なSSHの接続です。

### EC2 シリアルコンソール

シリアルコンソールに接続したら、起動、ネットワーク設定、およびその他の問題のトラブルシューティングに使用できます。

## おまけ

### SSH 

```text
# SSH over Session Manager
host i-* mi-*
    ProxyCommand sh -c "aws ssm start-session --target %h --document-name AWS-StartSSHSession --parameters 'portNumber=%p'"
```

ssh 

## 参照

1. [AWS CDKでEC2のキーペアを作成してみた](https://dev.classmethod.jp/articles/build-ec2-key-pair-with-aws-cdk/)
