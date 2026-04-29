# 路線規劃

貼上任意文字，AI 自動抽取地址，一鍵開啟 Google Maps 路線。

## 使用方式

1. 貼上包含地址的任意文字（LINE 訊息、清單、表格等）
2. 點「解析地址」
3. 拖曳調整順序，或刪除不需要的地址
4. 點「開啟 Google Maps 路線」

## 技術

- 前端：HTML + CSS + Vanilla JS（PWA）
- AI 解析：Gemini 1.5 Flash
- 部署：Vercel

## AI 使用限制

本專案使用 Gemini 1.5 Flash 免費方案，請求數有上限。實際限制依帳號與使用情況而異，可至 [Google AI Studio](https://aistudio.google.com/rate-limit) 查看。

超過限制時會顯示錯誤，等下一分鐘或隔天再試即可。

> 參考：[Gemini API Rate Limits｜Google AI for Developers](https://ai.google.dev/gemini-api/docs/rate-limits)

## 部署

1. Fork 此 repo
2. 在 [Vercel](https://vercel.com) 匯入專案
3. 設定環境變數 `GEMINI_API_KEY`（填入你的 Gemini API Key）
4. 部署
