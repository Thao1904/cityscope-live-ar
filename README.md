# CityScope Live AR

WebAR demo built on [8thwall/threejs-world-effects-example](https://github.com/8thwall/threejs-world-effects-example) (three.js + 8th Wall Engine, SLAM world tracking).

Place a CityScope planning table on your real floor, tap a spot, describe what you want ("add trees here", "thêm cây chỗ này"), watch it grow into place, then swipe between four layers:

| Layer | What you see |
|---|---|
| **Physical** | The table: blocks, roads, river, and every object residents added |
| **Mine** | Your home beacon, 5-minute walking radius, daily route, your own ideas |
| **Community** | Purple support bars rise as 25 simulated neighbors vote; demand glow |
| **Overview** | Common-ground ideas stay solid, contested ones turn into ghosts |

Understood requests: trees, benches, street lights, playground, fountain, flowers, shade umbrellas, bike lane, with quantities ("5 trees", "nhiều cây", "a few benches").

## Chạy thử nhanh nhất (không cần cài gì): GitHub Pages

1. Tạo một repo mới trên GitHub, upload toàn bộ thư mục này (trừ `node_modules`, `dist`).
2. Vào repo → **Settings → Pages → Source: GitHub Actions**.
3. Đợi workflow `Deploy to GitHub Pages` chạy xong (tab **Actions**, khoảng 1 phút).
4. Mở link `https://<tên-bạn>.github.io/<tên-repo>/` **trên điện thoại** (Safari trên iPhone, Chrome trên Android). Trên máy tính trang sẽ hiện mã QR để quét.
5. Cho phép camera → đi chậm cho máy nhận sàn → chạm vào sàn để đặt bàn.

## Chạy trên máy tính của bạn

```bash
npm install
npm run serve
```

Điện thoại cần HTTPS mới mở camera được. Cách dễ nhất là dùng ngrok (đã được cho phép sẵn trong `vite.config.js`):

```bash
ngrok http 5173
```

Mở link `https://....ngrok-free.dev` trên điện thoại.

## Cách dùng trong AR

1. Rê điện thoại chậm qua sàn nhà, vòng tròn vàng hiện ra → chạm để đặt bàn.
2. Chạm một chỗ trên bàn → ghim vàng rơi xuống.
3. Gõ yêu cầu hoặc bấm gợi ý → vật thể mọc lên.
4. Vuốt thanh **PHYSICAL · MINE · COMMUNITY · OVERVIEW** ở dưới để đổi lớp.
5. **Size** đổi kích thước: Table (≈1.4 m), Room (≈4 m), Walk-in (1:1, đi bộ vào trong thành phố). **Move table** để đặt lại.

## Files

- `index.html`: loads the 8th Wall engine, XRExtras, Landing Page, and the HUD
- `src/app.js`: camera pipeline (same as the original example)
- `src/cityscope-ar.js`: the table, objects, request parser, layers, voting simulation
- `src/index.css`: HUD styles

## Next steps toward a real deployment

- Replace the generated city with your district grid from CityScope cityIO.
- Replace simulated neighbors with a shared backend (Firebase / Supabase / WebSocket) so every phone and the table projector see the same proposals and votes.
- Swap the keyword parser for an LLM call to understand free-form requests.
