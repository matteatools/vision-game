# めとあたまのゲームパーク

子どもも大人も、目と頭を使って遊べる無料Webゲームサイトです。

## 重要な開発資料

新しいゲームの追加や公開対応を始める前に、必ず次の文書を確認してください。

- [SEO・ゲーム公開仕様](docs/SEO_AND_GAME_PUBLISHING_SPEC.md)
- [新ゲーム追加チェックリスト](docs/NEW_GAME_CHECKLIST.md)
- [ゲーム開発共通仕様](GAME_DEVELOPMENT_GUIDE.md)

ゲーム情報の正本は [`data/games.json`](data/games.json) です。更新後は次を実行します。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-site.ps1
powershell -ExecutionPolicy Bypass -File scripts/check-seo.ps1
```

## 資格資料について

`資格/` は公開用フォルダではありません。認定証原本、登録情報の元ファイル、個人情報、利用条件資料などを公開リポジトリへアップロードしないでください。規約上の表示に必要で公開を承認した登録番号・有効期限は `data/qualification.json` で管理し、正式商標マーク1点だけを `assets/qualification/` へ公開します。公開マークは設定済みのSHA-256で検証するため、非公開の元フォルダがない環境でも改変を検出できます。

現在は資格表示を有効にしており、トップ、about、`vision-training/` に同一設定から正式表示を生成します。各ゲームはビジョントレーニング®として分類・提供しません。

公開・アップロード・デプロイは、明確な依頼があるまで行いません。
