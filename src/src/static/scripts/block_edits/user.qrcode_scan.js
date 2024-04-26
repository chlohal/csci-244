let qr_id = localStorage.getItem("qr-record");

if(!qr_id) {
    let qr_id_req = await fetch("/api/blocks/qrcode", {
        method: "POST"
    })
    qr_id = await qr_id_req.json();
}

content_elem.innerHTML = `
<div>Download</div>
<img width="64" height="64" src="https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(block_info.data.qrcode_data || Math.random())}">

`