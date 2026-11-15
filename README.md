# 订阅价格表 v2

Static pricing landing page (ChatGPT + Grok) — deploy as-is to GitHub Pages or any static host (no build step).

- `index.html` – the whole page (HTML/CSS/JS inline), `img/` – customer feedback screenshots.
- Product switcher: `#gpt` (default) / `#grok` deep links, e.g. `.../pricing-site/#grok`.
- Sales WeChat ID: default `panplus5`; override with `?Sales=<wechatId>` (key is case-insensitive, also accepted in the hash, e.g. `#grok&Sales=JesseWen77`). Every `.wxid` element shows it and the 复制微信号 button (`#cp`) copies it.
- All asset paths are relative, so it works under a GitHub Pages subpath.
