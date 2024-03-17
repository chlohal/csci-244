const BLOCK_INFO_MAP = {}

async function main() {
    let my_id = location.pathname.split("/")[2];

    let canvas = document.getElementsByClassName("main-edit-canvas")[0];

    let editCanvas = {};

    await create_new_block_buttons(editCanvas);

    Object.assign(editCanvas, await create_edit_canvas(my_id, canvas));
}

async function create_new_block_buttons(editCanvas) {
    const parent = document.querySelector(".blockpicker");
    const categories = parent.querySelector(".catpicker");
    const buttons = parent.querySelector("div");

    categories.textContent = "";
    buttons.textContent = "";

    const req = await fetch(`/api/bucket/blocks`);
    const data = (await req.json()).data;

    const cats_butts = [];

    for(const category of data) {
        const category_button = make_category_button(category.name, categories);
        const cat_butts = document.createElement("div");
        cats_butts.push(cat_butts);
        buttons.appendChild(cat_butts);

        category_button.addEventListener("click", () => {
            cats_butts.forEach(x=> x.style.display = "none");
            cat_butts.style.display = "block";
        });
        
        for(const block of category.blocks) {
            BLOCK_INFO_MAP[block.id] = block;

            block.color = category.color;
            add_create_block_button(block, cat_butts, editCanvas);
        }
    }

    cats_butts.forEach(x=> x.style.display = "none");
    cats_butts[0].style.display = "block";

}

function add_create_block_button(blockdef, parent, editCanvas) {
    const button = document.createElement("button");
    button.textContent = blockdef.name;
    button.style.backgroundColor = blockdef.color;

    button.addEventListener("click", function() {
        editCanvas.addBlock(blockdef)
    });

    parent.appendChild(button);
}

function make_category_button(name, parent) {
    const wrapper = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = name;

    wrapper.appendChild(button);
    parent.appendChild(wrapper);

    return button;
}

fetch("/api/bucket/blocks", {
    method: "PUT",
    body: JSON.stringify([
        {
            name: "Canvas",
            color: "#730e37",
            blocks: [
                {
                    name: "Attendance",
                    id: "canvas.attendance"
                },
                {
                    name: "List Students",
                    id: "canvas.students"
                },
                {
                    name: "Submit Assignment",
                    id: "canvas.submit"
                },
                {
                    name: "Check Grades",
                    id: "canvas.get_grades"
                },
            ]
        },
        {
            name: "Users",
            color: "#800080",
            blocks: [
                {
                    name: "QR Code Scan",
                    id: "user.qrcode_scan"
                },
            ]
        },
        {
            name: "Logic",
            color: "#1d7402",
            blocks: [
                {
                    name: "If",
                    id: "logic.if"
                },
            ]
        },
        {
            name: "Integrations",
            color: "#930000",
            blocks: [
                {
                    name: "Clark Login",
                    id: "integrate.login.sso.clark"
                }
            ]
        }
    ])
})

async function create_edit_canvas(id, canvas) {
    const req = await fetch(`/api/bucket/${id}`);
    const data = (await req.json()).data || {};

    if(!data.blocks) data.blocks = []; //TEMP FOR DEBUG

    const canvasInner = document.createElement("div");

    addDragging(canvasInner, (x,y) => {
        data.perspective = {x, y};
        sync();
    }, data.perspective);
    
    canvas.appendChild(canvasInner);

    function sync() {
        fetch(`/api/bucket/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        })
    }

    for (const block of data.blocks) {
        create_onscreen_block(block, sync, canvasInner);
    }

    return {
        addBlock: function(blockdef) {
            const block = {
                type: blockdef.id,
                x: 0,
                y: 0
            };
            create_onscreen_block(block, sync, canvasInner);
            data.blocks.push(block);
            sync();
        }
    }
}

function create_onscreen_block(block_info, sync_callback, parent) {
    const block_parent =document.createElement("div");
    block_parent.classList.add("block-parent");

    addDragging(block_parent, (x,y) => {
        block_info.x = x;
        block_info.y = y;
        sync_callback()
    }, {x: block_info.x, y: block_info.y});

    const blockdef = BLOCK_INFO_MAP[block_info.type];

    const blockHeader = document.createElement("h3");
    blockHeader.textContent = blockdef.name;
    blockHeader.style.backgroundColor = blockdef.color;

    block_parent.appendChild(blockHeader);

    parent.appendChild(block_parent);

    const block_content = document.createElement("div");
    block_content.classList.add("block-content");
    block_parent.appendChild(block_content);
}

/**
 *
 * @param {HTMLDivElement} element
 */
function addDragging(element, cb, {}) {
    if(!pos) pos = {};

    let dragging = false,
        originalX = 0,
        originalY = 0,
        x = pos.x || 0,
        y = pos.y || 0;

    element.style.transform = `translate(${x}px, ${y}px)`;

    element.addEventListener("mousedown", (e) => {
        dragging = true;
        originalX = e.clientX - x;
        originalY = e.clientY - y;
        
        e.preventDefault();
        e.stopPropagation();
    });
    element.addEventListener("mouseleave", (e) => {
        dragging = false;
    });
    element.addEventListener("mousemove", (e) => {
        if (dragging) {
            x = (e.clientX - originalX);
            y = (e.clientY - originalY);

            element.style.transform = `translate(${x}px, ${y}px)`;
        }
        e.preventDefault();
        e.stopPropagation();
    });

    element.addEventListener("mouseup", e => {
        dragging = false;
        e.preventDefault();
        e.stopPropagation();

        if(cb) cb(x, y)
    });
}

window.addEventListener("load", () => main());
