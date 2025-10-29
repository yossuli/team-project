## ディレクトリ構成

```sh
.
├── app
│   ├── global.d.ts
│   ├── index.tsx
│   ├── prisma
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── routes
│       └── api/
├── biome.json
├── client
│   ├── components
│   │   └── ui
│   ├── index.css
│   ├── index.tsx
│   ├── route.tsx
│   ├── routeTree.gen.ts
│   └── routes
│       ├── __root.tsx
│       └── index.lazy.tsx
├── cmd/
├── dist/
├── node_modules/
├── package.json
├── panda.config.ts
├── park-ui.json
├── pnpm-lock.yaml
├── postcss.config.cjs
├── styled-system
├── tsconfig.json
├── tsr.config.json
├── vite.config.ts
└── wrangler.jsonc

```

### app

裏の処理を記述します

#### app/global.d.ts

DB の型を環境変数の型に追加しています。
あまり気にしなくて大丈夫です。

#### app/index.tsx

アプリケーションのエントリーポイントです。
気にしなくていいです。

#### app/prisma/schema.prisma

Prisma のスキーマファイルです。
DB のモデルを定義します。
`pnpm prisma migration` コマンドを実行すると、マイグレーションファイルが `app/prisma/migrations/` に生成されます。
`pnpm prisma generate` コマンドを実行すると、Prisma クライアントが生成されます。

#### app/prisma/migrations/

Prisma のマイグレーションファイルが格納されます。
この sql ファイルを直接編集することはありません。
この sql ファイルを DB に適用することで、DB のスキーマが更新されます。
`pnpm prisma migrate:dev` コマンドを実行すると、最新のマイグレーションがローカル DB に適用されます。

#### app/routes/api/

API のエンドポイントを定義します。
例えば、`/api/hoge/fuga`という URL にリクエストを送ると、`app/routes/api/hoge/fuga.ts`が実行されます。

#### app/.assets-css.ts

ビルド時に生成される css ファイルのパスを格納しています。
デプロイ環境で CSS ファイルを正しく参照するために使用されます。
直接編集することはありません。
ベストプラクティスではないのでより良い方法を模索中です。

### client

ユーザーが見る画面の処理を記述します。

#### client/components/ui/

park-ui からインポートしたコンポーネントをまとめています。
`npx park-ui add` コマンドでコンポーネントを追加できます。
自動生成されるファイルですが git の管理下に置きます。

#### client/index.css

グローバルな CSS を記述します。

#### client/index.tsx

クライアントアプリケーションのエントリーポイントです。
ほとんど編集することはないと思います。

#### client/route.tsx

tanstack router のルート定義を記述します。
ほとんど編集することはないと思います。

#### client/routeTree.gen.ts

自動生成されるルート定義ファイルです。
直接編集することはありません。

#### client/.hc.type.ts

Hono Client 用の型定義ファイルです。
自動生成されるファイルです。
直接編集することはありません。

```ts
import type { Routes } from ".hc.type.ts";

const client = hc<Routes>("");
```

こんな感じで使うと型安全に API を呼び出せます。

#### client/routes/

WEB 上の URL とパスが対応しています。
例えば、`/hoge` という URL にアクセスすると、`client/routes/hoge.tsx` が実行されます。

##### client/routes/\_\_root.tsx

テンプレートファイルです。
全てのページで共通して使いたい処理をここに書きます。
例えば、ヘッダーやフッターのコンポーネントをここに書きます。
各ページのコンポーネントは、`<Outlet />` コンポーネントで表示されます。

##### client/routes/index.lazy.tsx

`/` にアクセスしたときに表示されるページです。
他のページを追加したい場合は、`client/routes/` にファイルを追加してください。

### cmd/

アプリケーションには直接関係のないコマンドっぽいものを置くディレクトリです。

### dist/

ビルド後のファイルが格納されます。
`pnpm build` コマンドを実行すると生成されます。
`pnpm preview` コマンドを実行すると、このディレクトリの内容がローカルサーバーでプレビューされます。

### styled-system/

pandaCSS によって自動で生成されます
`pnpm prepare` コマンドを実行すると生成されます。

### その他設定ファイル

#### .env, .dev.vars

環境変数を定義します。

#### biome.json

Biome の設定ファイルです。
コードフォーマットや静的解析のルールを定義します。

#### package.json

プロジェクトの依存関係やスクリプトを定義します。

#### panda.config.ts

PandaCSS の設定ファイルです。
テーマやユーティリティクラスを定義します。

#### park-ui.json

park-ui の設定ファイルです。

#### pnpm-lock.yaml

pnpm のロックファイルです。

#### postcss.config.cjs

PostCSS の設定ファイルです。

#### tsconfig.json

TypeScript の設定ファイルです。

#### tsr.config.json

tsr (tanstack router) の設定ファイルです。

#### vite.config.ts

Vite の設定ファイルです。

#### wrangler.jsonc

Cloudflare Workers の設定ファイルです。
