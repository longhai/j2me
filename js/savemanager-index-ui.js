/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

'use strict';

/**
 * Khởi tạo UI trình quản lý save (dùng cho index.html)
 * Xử lý tương tác nhập/xuất save của người dùng
 */
(function() {
  var exportBtn = null;
  var importBtn = null;
  var importInput = null;

  // 等待DOM加载完成
  function initSaveManager() {
    exportBtn = document.getElementById('export-save-index-btn');
    importBtn = document.getElementById('import-save-index-btn');
    importInput = document.getElementById('importSaveFileIndex');

    // 如果按钮不存在，创建它们
    if (!exportBtn || !importBtn) {
      createSaveManagerButtons();
    }

    // 绑定事件
    bindEvents();

    console.log('SaveManager (index) initialized successfully');
  }

  /**
   * 创建存档管理按钮
   */
  function createSaveManagerButtons() {
    var buttonGroup = document.querySelector('.button-group');
    if (!buttonGroup) {
      console.warn('Button group container not found');
      return;
    }

    // 创建导出按钮
    exportBtn = document.createElement('button');
    exportBtn.id = 'export-save-index-btn';
    exportBtn.className = 'btn';
    exportBtn.textContent = (window.I18n && I18n.t) ? I18n.t('btn.exportSaves') : 'Xuất toàn bộ save';

    // 创建导入按钮
    importBtn = document.createElement('button');
    importBtn.id = 'import-save-index-btn';
    importBtn.className = 'btn';
    importBtn.textContent = (window.I18n && I18n.t) ? I18n.t('btn.importSaves') : 'Nhập saveZIP';

    // 添加到按钮组
    buttonGroup.appendChild(exportBtn);
    buttonGroup.appendChild(importBtn);

    importInput = document.getElementById('importSaveFileIndex');
  }

  /**
   * 绑定事件处理器
   */
  function bindEvents() {
    if (exportBtn) {
      exportBtn.addEventListener('click', function(e) {
        e.preventDefault();
        exportSaveData();
      });
    }

    if (importBtn) {
      importBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (importInput) {
          importInput.click();
        }
      });
    }

    if (importInput) {
      importInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
          importSaveData(e.target.files[0]);
        }
      });
    }
  }

  /**
   * Xuất save数据到ZIP文件
   */
  function exportSaveData() {
    // 显示导出提示
    showStatusMessage((window.I18n && I18n.t) ? I18n.t('save.exporting') : 'Đang xuất toàn bộ save...', 'info');

    // 调用SaveManager导出
    if (typeof SaveManager !== 'undefined' && SaveManager.exportSaveToZip) {
      SaveManager.exportSaveToZip('j2me-all-games', function(zipBlob) {
        if (zipBlob) {
          // 生成文件名
          var filename = generateSaveFilename('j2me-all-games');
          // 下载ZIP文件
          SaveManager.downloadZip(zipBlob, filename);
          showStatusMessage((window.I18n && I18n.t) ? I18n.t('save.exportOk') : 'Xuất save thành công!', 'success');
        } else {
          showStatusMessage((window.I18n && I18n.t) ? I18n.t('save.exportFail') : 'Xuất save thất bại, kiểm tra xem có dữ liệu save không!', 'error');
        }
      });
    } else {
      showStatusMessage((window.I18n && I18n.t) ? I18n.t('save.notReady') : 'Trình quản lý save chưa khởi tạo!', 'error');
    }
  }

  /**
   * 从ZIP文件Nhập save数据
   */
  function importSaveData(zipFile) {
    // 显示导入确认对话框
    var confirmed = confirm(
      (window.I18n && I18n.t) ? I18n.t('save.confirmImport') :
      'Nhập save sẽ ghi đè toàn bộ dữ liệu save hiện tại, tiếp tục?\n\nNên xuất save hiện tại làm bản sao lưu trước khi nhập!'
    );

    if (confirmed) {
      performImport(zipFile);
    }
  }

  /**
   * 执行实际的导入操作
   */
  function performImport(zipFile) {
    showStatusMessage((window.I18n && I18n.t) ? I18n.t('save.importing') : 'Đang nhập save...', 'info');

    if (typeof SaveManager !== 'undefined' && SaveManager.importSaveFromZip) {
      SaveManager.importSaveFromZip(zipFile, function(success) {
        if (success) {
          showStatusMessage((window.I18n && I18n.t) ? I18n.t('save.importOk') : 'Nhập save thành công! Trang sẽ tải lại...', 'success');
          // 延迟重新加载页面以应用新存档
          setTimeout(function() {
            location.reload();
          }, 2000);
        } else {
          showStatusMessage((window.I18n && I18n.t) ? I18n.t('save.importFail') : 'Nhập save thất bại! Kiểm tra định dạng file ZIP.', 'error');
        }
      });
    } else {
      showStatusMessage((window.I18n && I18n.t) ? I18n.t('save.notReady') : 'Trình quản lý save chưa khởi tạo!', 'error');
    }
  }

  /**
   * 生成存档文件名
   */
  function generateSaveFilename(gameName) {
    var now = new Date();
    var dateStr = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
    var timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return gameName + '_save_' + dateStr + '_' + timeStr + '.zip';
  }

  /**
   * 显示状态消息
   */
  function showStatusMessage(message, type) {
    type = type || 'info';
    console.log('[' + type.toUpperCase() + '] ' + message);

    // 创建一个简单的通知div
    var notification = document.createElement('div');
    notification.className = 'save-manager-notification';
    notification.textContent = message;

    // 设置样式
    notification.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); ' +
      'padding: 15px 25px; border-radius: 5px; color: white; font-weight: bold; ' +
      'z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';

    // 根据类型设置背景色
    if (type === 'success') {
      notification.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
      notification.style.backgroundColor = '#f44336';
    } else {
      notification.style.backgroundColor = '#2196F3';
    }

    document.body.appendChild(notification);

    // 3秒后自动关闭
    setTimeout(function() {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSaveManager);
  } else {
    initSaveManager();
  }
})();
