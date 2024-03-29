content_elem.innerHTML = `
<div>Download</div>
<img width="64" height="64" src="https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(block_info.data.qrcode_data || Math.random())}">

`