(function (PLUGIN_ID) {
  // PDF.jsをCDNから動的に読み込む関数
  function loadPdfJsFromCdn() {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js'; // PDF.jsのCDN URL
    script.onload = function() {
      console.log('PDF.jsがCDNから読み込まれました');
      // PDF.jsの設定
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
    };
    document.body.appendChild(script);
  }

  // PDF.jsをCDNから動的に読み込む
  loadPdfJsFromCdn();

  kintone.events.on('app.record.detail.show', (event) => {
    const fileFields = [];

    Object.entries(event.record).forEach(([key, value]) => {
      if (value.type === 'FILE') {
        fileFields.push(key);
      }
    });

    fileFields.forEach((fieldCode) => {
      const fileEl = kintone.app.record.getFieldElement(fieldCode);
      // fileElの下にあるaタグのテキストとURLを取得する
      const as = fileEl.querySelectorAll('a');
      as.forEach((a) => {
        const icon = document.createElement('img');
        icon.src = 'https://cdn-icons-png.flaticon.com/512/622/622669.png';
        icon.style.width = '16px';
        icon.style.height = '16px';
        icon.style.cursor = 'pointer';
        icon.style.marginLeft = '5px';
        icon.url = a.href;
        icon.addEventListener('click', (e) => {
          const url = e.target.url;
          console.log('preview', url);
          // pdf.jsを使ってPDFをモーダル表示する
          const modal = document.createElement('div');
          modal.style.position = 'fixed';
          modal.style.top = '0';
          modal.style.left = '0';
          modal.style.width = '100%';
          modal.style.height = '100%';
          modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          modal.style.display = 'flex';
          modal.style.justifyContent = 'center';
          modal.style.alignItems = 'center';
          modal.style.zIndex = '1000';
          modal.addEventListener('click', () => {
            modal.remove();
          });

          // canvas要素を作成
          const canvas = document.createElement('canvas');
          modal.appendChild(canvas);
          document.body.appendChild(modal);

          // PDF.jsを使ってPDFを読み込み、canvasに描画
          pdfjsLib.getDocument(url).promise.then(pdfDoc => {
            pdfDoc.getPage(1).then(page => {
              const viewport = page.getViewport({ scale: 1.0 });
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              const renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
              };
              page.render(renderContext);
            });
          }).catch(err => {
            console.error('Error loading PDF: ', err);
          });

          document.body.appendChild(modal);
        });
        a.insertAdjacentElement('afterend', icon);

        console.log(a.href);
        console.log(a.textContent);
      });
    });

    return event;
  });
})(kintone.$PLUGIN_ID);
