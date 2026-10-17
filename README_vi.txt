TRANG CHƠI GAME J2ME — BẢN VIỆT HÓA ĐẦY ĐỦ (dựng từ bản mới nhất của java.zixing.fun/java/)
================================================================================

CÁCH DÙNG
- Chép toàn bộ nội dung lên host (giữ nguyên cấu trúc thư mục).
- Mở index.html: danh sách game + cài đặt.
- Mở main.html?jars=jar/<tên-game>.jar để chơi game (file jar đặt trong thư mục jar/ tự tạo).
- Trang index.html cũ (bản trước) vẫn mở được sang main.html này vì dùng chung
  tham số URL: jars= / localjar= / gamepad= / canvasSize= ...

CÁC TRANG
- index.html           : danh sách game, tìm kiếm, cài đặt chung, JAR trên máy
- indexbatch.html      : bản cài game hàng loạt
- main.html            : màn hình chơi game (player mới: thanh điều khiển, tốc độ
                         0.5-16×, xoay, ẩn/hiện phím, fullscreen, panel ⋯)
- keyboard-editor.html : trình sửa bố cục bàn phím ảo
- about.html           : trang giới thiệu (đã gỡ QR donate của chủ site)
- updatelog.html       : nhật ký cập nhật (đã dịch 64 mục)

ĐÃ VIỆT HÓA
- lang/vi.json: 223 chuỗi giao diện tiếng Việt (đủ 100% key của bản gốc).
- lang/manifest.json: đã khai báo thêm "Tiếng Việt".
  -> Trình duyệt để tiếng Việt sẽ TỰ ĐỘNG hiện tiếng Việt.
- Tên 39 game trong gamelist.js đã dịch sang tiếng Việt/Anh.
- Tên nút tay cầm, hộp thoại ánh xạ phím, thông báo save: tiếng Việt.

LƯU Ý QUAN TRỌNG
1. QUẢNG CÁO: đã GỠ SẠCH script Google AdSense của chủ site gốc khỏi cả 6 trang.
   Muốn gắn quảng cáo, bạn tự thêm script AdSense với ID của bạn vào <head>.
2. THEO DÕI: đã GỠ script Baidu analytics (hm.baidu.com) của chủ site gốc
   khỏi index.html và indexbatch.html.
3. QR ỦNG HỘ: trang about.html đã gỡ mã QR của chủ site. Muốn nhận ủng hộ,
   đặt ảnh QR của bạn vào img/donate-qr.jpg rồi bỏ comment dòng img trong
   about.html (có hướng dẫn trong file).
4. FILE GAME: không kèm sẵn file .jar. Bạn tự đặt vào thư mục jar/ (tự tạo),
   hoặc dùng chức năng "Chọn JAR trên máy" trong trang index.
5. Đây là bản mới (kiến trúc load-versioned.js), KHÁC bản cũ trong java-2.zip,
   đừng trộn file cũ/mới lẫn lộn.

CẤU TRÚC
- index.html / indexbatch.html / main.html / keyboard-editor.html / about.html / updatelog.html
- js/                  : theme, i18n, điều khiển player, tốc độ giả lập,
                         xuất/nhập save, cài đặt tay cầm... (bản mới từ web gốc)
- keyboard-layouts.js  : các bố cục bàn phím
- keymap.js            : ánh xạ phím (bản mới)
- bld/, config/, libs/ : engine j2me.js (bản mới từ web gốc)
- certs/               : chứng chỉ cho initFS
- style/               : main.css (trang chơi), index.css (trang danh sách)
- img/                 : 45 icon game
- lang/vi.json         : gói tiếng Việt (223 chuỗi)
- lang/manifest.json   : khai báo ngôn ngữ

================================================================================
FILE NÀO CẦN / FILE NÀO DƯ (bản web mới)
================================================================================
Gói này CHỈ gồm file cần thiết (96 file). Nếu bạn đang dùng bản trộn cũ+mới,
những file sau XÓA ĐƯỢC (không trang nào gọi tới):

- benchmark.js, gc.html, gc.js, timer.js : tool dev của bản cũ
- index2.html, manifest.webapp, startserver.bat
- bld/classes.jar.js, bld/shumway.js : engine bản cũ
- java/classes2.jar, java/classesold.jar, java/classes.jar.REMOVED.git-id
  (CHỈ GIỮ java/classes.jar — engine bản mới tải file này lúc chạy,
  thiếu nó là web không chạy được)
- js/midi/loader.js : bản mới dùng js/midiplayer.js + js/adlmidi-player.js
- libs/ : XÓA HẾT trừ libs/compiled-method-cache.js
  (BenzAMRRecorder.js, PicoAudio.js, encoding.js, load.js, promise-6.0.0.js,
  webaudio-tinysynth.js, webaudio.js bản mới đã nằm trong js/)
- polyfill/ : shim getAll đã nằm sẵn trong bld/main-all.js bản mới
- style/ : GIỮ style/index.css, style/main.css và style/emoji/ (12 ảnh emoji)
  (LƯU Ý: style/emoji/ BẮT BUỘC phải có — engine tải 12 ảnh này lúc khởi động,
  thiếu là game treo vì promise chỉ resolve khi ảnh onload)
  XÓA ĐƯỢC: confirm.css, drawer.css, headers.css, progress_activity.css,
  images/... (CSS Firefox OS của bản cũ, không trang nào dùng)
- certs/Makefile, certs/_main.ks, certs/_test.ks : file build, không cần khi chạy
- __pycache__/ : file rác của Python, xóa
- img/ckxt2.png, dlls3.png, kybc4.png, pes2020.png, sldwm.png,
  icon-128.png, icon-512.png : icon của game list cũ, bản mới không dùng

====================================================
THÊM GAME MỚI (không cần sửa gamelist.js thủ công)
====================================================
LƯU Ý: file gamelist.js KHÔNG ĐƯỢC để trống hay xóa!
Trang web cần file này để biết danh sách game.

Cách thêm game mới (3 bước):
1. Chép file .jar vào thư mục jar/
2. (Tùy chọn) Muốn tên tiếng Việt đẹp: mở tools/name-overrides.json
   bằng Notepad, thêm dòng:  "ten-file.jar": "Tên Tiếng Việt",
3. Mở file tools/gen-gamelist.html bằng trình duyệt, chọn các file
   .jar, bấm nút tải về rồi chép đè lên gamelist.js
4. F5 lại trang — game tự xuất hiện với icon bóc từ JAR!

Giải thích: script đọc MANIFEST.MF trong mỗi file JAR để lấy
tên game, phiên bản, nhà phát hành, class chính rồi ghi vào
gamelist.js. Icon thì trang web tự bóc lúc hiển thị.
