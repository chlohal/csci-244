let qr_id = localStorage.getItem("qr-record");

if(!qr_id) {
    let flowchart_id = window.location.pathname.split("/")[2];
    let qr_id_req = await fetch("/api/blocks/qrcode", {
        method: "POST",
        body: JSON.stringify({
            block_id: block_info.id,
            flowchart_id: flowchart_id
        })
    });
    if(qr_id_req.status != 201) {
        return false;
    }

    qr_id = await qr_id_req.json();
    localStorage.setItem("qr-record", qr_id);
}

content_elem.innerHTML = `
<a target="_blank" href="/qr/present/${qr_id}" style="display:flex;flex-direction:column"> 
<div>Download</div>
<img width="64" height="64" src="/qr/render/?&data=${
    encodeURIComponent(`http://localhost:8080/qr/flow/${qr_id}`)
}">
</a>
`