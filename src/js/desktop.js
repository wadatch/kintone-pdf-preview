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

  function getMaxPageNum(url) {
    return pdfjsLib.getDocument(url).promise.then(pdfDoc => {
      return pdfDoc.numPages;
    });
  }

  function showPage(canvas, url, pageNum, scale) {
    // PDF.jsを使ってPDFを読み込み、canvasに描画
    pdfjsLib.getDocument(url).promise.then(pdfDoc => {
      pdfDoc.getPage(pageNum).then(page => {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: canvas.getContext('2d'),
          viewport: viewport
        };
        page.render(renderContext);
      });
    });
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
      for (const a of as) {
        (async () => {
          const maxPageNum = await getMaxPageNum(a.href);
          let pageNum = 1;
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
            modal.addEventListener('click', (e) => {
              e.stopPropagation();
              modal.remove();
            });

            // canvas要素を作成
            const canvas = document.createElement('canvas');
            canvas.id = 'pdf-canvas-' + pageNum;
            modal.appendChild(canvas);
            document.body.appendChild(modal);


            showPage(canvas, url, pageNum, 0.8);

            // modal画面に表示されている＋アイコンをクリックしたときに、次のページを表示する
            const nextPageIcon = document.createElement('button');
            nextPageIcon.textContent = "次のページ";
            nextPageIcon.style.width = '100px';
            nextPageIcon.style.height = '32px';
            nextPageIcon.style.cursor = 'pointer';
            nextPageIcon.style.position = 'fixed';
            nextPageIcon.style.right = '10px';
            nextPageIcon.style.bottom = '10px';
            nextPageIcon.addEventListener('click', (e) => {
              e.stopPropagation();
              if (pageNum >= maxPageNum) return;
              const prevPageNum = pageNum;
              pageNum++;
              showPage(canvas, url, pageNum, 0.8);
              pageNumberDisplay.textContent = `ページ: ${pageNum}`;
              console.log(pageNumberDisplay.textContent);
              console.log(pageNum, maxPageNum);
            });
            modal.appendChild(nextPageIcon);

            // ページ番号を表示する要素を作成
            const pageNumberDisplay = document.createElement('span');
            pageNumberDisplay.textContent = `ページ: ${pageNum}`;
            pageNumberDisplay.style.position = 'fixed';
            pageNumberDisplay.style.right = '140px'; // 位置を調整
            pageNumberDisplay.style.bottom = '15px';
            pageNumberDisplay.style.fontSize = '16px';
            pageNumberDisplay.style.color = 'white';
            pageNumberDisplay.style.fontWeight = 'bold';
            pageNumberDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modal.appendChild(pageNumberDisplay);

            // ぷらすアイコンの横にマイナスアイコンを表示して、クリックしたときに、前のページを表示する
            const prevPageIcon = document.createElement('button');
            prevPageIcon.textContent = "前のページ";
            prevPageIcon.style.width = '100px';
            prevPageIcon.style.height = '32px';
            prevPageIcon.style.cursor = 'pointer';
            prevPageIcon.style.position = 'fixed';
            prevPageIcon.style.right = '240px';
            prevPageIcon.style.bottom = '10px';
            prevPageIcon.addEventListener('click', (e) => {
              e.stopPropagation();
              if (pageNum <= 1) return;
              pageNum--;
              showPage(canvas, url, pageNum, 0.8);
              pageNumberDisplay.textContent = `ページ: ${pageNum}`;
              console.log(pageNum);
            });
            modal.appendChild(prevPageIcon);

            document.body.appendChild(modal);
          });
          a.insertAdjacentElement('afterend', icon);

          console.log(a.href);
          console.log(a.textContent);
        })();
      }
    });
  });
  return;
}) (kintone.$PLUGIN_ID);
