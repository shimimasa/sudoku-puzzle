# Sudoku Puzzle（小学校向け） ファイル構成

## 目的
- 画面遷移の体験を「ねこもじなぞり／漢字ヨミタビ」と同様の ScreenManager 方式で統一する
- 3〜9の段階学習を実現し、学習が苦手な子でも進められる構造にする
- GitHub管理＆Vercelデプロイ（Vite）を前提とする

## ルート構成
- index.html: Viteエントリ
- package.json: Vite scripts
- vite.config.js: dist出力
- docs/FILE_STRUCTURE.md: この説明
- public/data: 問題JSON（後から追加しやすい）

## src配下
- main.js: 起動・Screen登録・初期画面遷移
- config.js: レベル定義／解放条件
- state/
  - gameState.js: 設定/進捗/セッション管理
  - storage.js: localStorage I/O
- screens/
  - ScreenManager.js: changeScreen/back
  - TitleScreen.js: タイトル
  - LevelSelectScreen.js: レベル選択（ロック）
  - SettingsScreen.js: 設定
  - GameScreen.js: プレイ画面（最初はダミー→次で数独実装）
  - PauseScreen.js: 一時停止
  - ResultScreen.js: クリア表示・解放更新
- ui/
  - dom.js: DOM生成ヘルパ
  - toast.js: 優しい通知
- styles/
  - globals.css: 基本スタイル
  - screens.css: 画面レイアウト
  - sudoku.css: 盤面スタイル（次で拡張）

## 次の実装（Phase1）
- public/data を読み込む PuzzleLoader を追加
- 盤面描画（renderer）と入力（input）を追加
- 最小のルール判定（engine）を追加
