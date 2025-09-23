# 環境構築

## 開発環境を整える

### Ubuntu

開発では Ubuntu 22.04 を使用しています。
念のため現在の Ubuntu のバージョンを確認してください

```sh
$ lsb_release -a
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 22.04.5 LTS
Release:        22.04
Codename:       jammy
```

もしエラーが出る場合、コマンドを PowerShell で実行している可能性があります。
その場合は wsl に切り替えてください。

```sh
PS C:\Users\iniad> wsl
iniad@iniad /mnt/c/Users/iniad $
```

カレントディレクトリが Windows のままになっているので移動しましょう

```sh
iniad@iniad /mnt/c/Users/iniad $ cd ~
iniad@iniad ~ $
```

もし異なる場合はバージョンアップを推奨します。

```sh
$ sudo apt update
$ sudo apt upgrade
```

### Node.js

また、ランタイムは Node.js v23.x を使用しています。

> python3 のようなものです。

```sh
$ node -v
v23.11.0
```

もし異なる場合は volta などのバージョンマネージャーを使用して v23.x に切り替えてください。
volta は以下のコマンドでインストールできます。

```sh
$ curl https://get.volta.sh | bash
```

volta など、バージョンマネージャーをインストール出来たら、Node.js v23.x をインストールします。
volta を使用している場合は以下のコマンドでインストールできます。

```sh
$ volta install node@23
```

念のため、Node.js のバージョンを確認してください。

```sh
$ node -v
```

### pnpm

また、パッケージマネージャーは pnpm を使用しています。

> python でいうところの pip にあたります。

以下のコマンドでインストールできます。

```sh
$ npm install -g pnpm
```

うまくいかない場合は直接 curl でインストールすることもできます。

```sh
$ curl -fsSL https://get.pnpm.io/install.sh | sh -
```

念のため、pnpm のバージョンを確認してください。

```sh
$ pnpm -v
10.xx.x
```

もし異なる場合は、以下のコマンドでアップデートしてください。

```sh
$ volta install pnpm@10
```

## プロジェクトをクローンする

プロジェクトをクローンするには、git コマンドを使用します。
github デスクトップでもできますが、そんなに難しくないので CLI(コマンドラインインターフェース)でやってみることを勧めます。

> コマンドラインで実行すると
>
> - 実行したコマンドの履歴が残る
> - 過去のコマンドを呼び出せる
>   - 上下キーで一個前後のコマンドを呼び出せる
>   - ctrl + r で履歴から検索できる
> - tab キーで補完できる
>   といったメリットがあります。

```sh
git clone git@github.com:yossuli/team-project.git
```

クローンできたら、プロジェクトのディレクトリに移動します。

```sh
cd team-project
```

vscode でプロジェクトを開きます。

```sh
code .
```

## プロジェクトをクローンして初めて行うこと

まずはプロジェクトをクローンして最初におこなうことは、依存関係をインストールすることです。

> python でいうところの `pip install -r requirements.txt` にあたります。
> package.json は python の requirements.txt のようなものです。

vscode で `ctrl + shift + @`を押してターミナルを開きます。

```sh
iniad@iniad ~/team-project $
```

ここのターミナルとさっきまで使っていたターミナルは同じものです
このターミナルで以下のコマンドを実行します。

```sh
pnpm install
```

node_modules ディレクトリと pnpm-lock.yaml ファイルが生成されます。

次に環境変数を設定します
秘密の情報なので slack で共有します

```sh
pnpm dev
```

## 定期的に実行するもの

### DB 関係

初回や DB の定義を更新した場合に以下のコマンドを実行します。
変更がない時に実行しても基本的に問題ないのでエラーが出たら下の二つのコマンドはとりあえず実行して大丈夫です。

sql ファイルをもとに ローカルの DB を更新します(マイグレート)

```sh
pnpm migrate:dev
```

何か聞かれたらとりあえず y を押せばいいです

スキーマをもとに DB を扱うためのコード(prisma client)を生成します(ジェネレート)

```sh
pnpm generate
```

DB のスキーマを変更した場合、DB のスキーマの差分をもとに sql ファイルを生成する必要があります(マイグレーションファイルの作成)
このコマンドはあまり使用しないと思います。

```sh
pnpm migration
```

## 試しに動かしてみる

```sh
pnpm dev
```
[http://localhost:5173](http://localhost:5173) にアクセスしてみてください。

もし実行を止めたい場合は、ターミナルで `ctrl + c` を押してください。(2回押す必要があるかも)

