## 現行お手本について（0.7.0）

表示するお手本には Klee One SemiBold を使用します。仮名と長音符だけを収録した軽量Webフォントをサイトへ同梱するため、Chromebook・スマートフォン・PCで同じ字形になります。見本として読みやすくする目的で、表示時に輪郭を文字サイズの1.8%だけ太くしています。フォントファイルの字形自体は変更していません。書き順アニメーションと判定用中心線は `src/teaching-paths.js` の独自再作図曲線です。

### Klee One SemiBold

- 著作権者：Fontworks Inc.
- 配布元：https://github.com/fontworks-fonts/Klee
- ライセンス：SIL Open Font License 1.1
- 収録ファイル：`assets/fonts/KleeOne-SemiBold-kana.woff2`
- ライセンス全文：`assets/fonts/OFL-KleeOne.txt`
- 変更：SemiBoldから、ひらがな・カタカナ・約物・長音符の範囲だけを抽出してWOFF2形式へ変換。字形自体は変更していません。

以下のKanjiVGの記載は、保存されている旧版の出典データ・原本とその派生データに適用されます。これらの資料は出典・ライセンス表示とともに引き続き保持します。

# 文字データの出典と利用条件

追加した基本カタカナ37文字の運筆データは、KanjiVG の SVG をもとにしています。

- KanjiVG: https://kanjivg.tagaini.net/
- 原著作者: Ulrich Apel
- Copyright © 2009–2026 Ulrich Apel（各原本の著作権表示も保持）
- ライセンス: Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)
- ライセンスURL: https://creativecommons.org/licenses/by-sa/3.0/
- 原本: `vendor/kanjivg/*.svg`
- 取得日: 2026-10-31
- ファイル別URLとSHA-256: `src/kana-source.js`

本アプリでは、109×109座標を100×100に変換し、曲線を判定用点列と表示輪郭に変換しています。また、一部を縮小・移動して小書きにし、濁音・半濁音には基底字の縮小移動と濁点・半濁点の追加を行っています。これらのKanjiVGに由来する派生文字データもCC BY-SA 3.0で提供します。元データの作者が、本アプリの改変や認識精度を保証・推奨するものではありません。

既存のア・ロ・シ・ツ・ソ・ン・ヤ・ケ・ト、およびそれらを基にした小書き・濁音等、縦書きの長音は独自作成のデータです。アプリのプログラムコードと文字データは区別して管理しています。

本データセットに対する教育専門家の監修、および実際の児童入力を用いた認識精度の検証は未実施です。

## 単語の読み上げ音声

音声：VOICEVOX Nemo（女声1、スタイルID 10005）。本アプリ用に生成した合成音声で、人による収録音声ではありません。

- 公式サイト・音声利用規約：https://voicevox.hiroshiba.jp/nemo/term/
- 音声モデル利用規約：https://github.com/VOICEVOX/voicevox_vvm/blob/main/TERMS.txt
- 生成環境：VOICEVOX Core 0.17.1、Nemo n0.vvm 0.17.0、CPU実行。
- 形式：MP3、モノラル、24kHz、48kbps。生成時の話速0.95、再生時の速度変更なし。
- 音声の再利用・再配布時も「VOICEVOX Nemo」のクレジットを保持し、上記音声利用規約と音声モデル利用規約に従ってください。生成音声の利用を他者に許諾する場合も、これらの条件を引き継いでください。
- 音声作成専用のモデル・辞書・実行環境は `.local-tools/` にあり、アプリでは配信しません。

## ひらがな版の追加データ

基本ひらがな46文字もKanjiVGの筆順付きSVGから取り込みました。原著作者・ライセンスは上記と同じです。原本は `vendor/kanjivg/`、個別URL・SHA-256は `src/hiragana-source.js` に保持しています（取得日：2026-10-31）。座標変換、表示輪郭への変換、小書き・濁音・半濁音への派生を行い、合計75文字を収録しています。これらの派生文字データもCC BY-SA 3.0で提供します。

ひらがな48語の音声にも上記と同じVOICEVOX Nemo・生成条件・利用条件を適用します。保存先は `assets/hiragana-audio/`、カタカナ48語は `assets/audio/` です。
