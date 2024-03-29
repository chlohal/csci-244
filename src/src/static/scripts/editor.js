const BLOCK_INFO_MAP = {};

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
    const data = await req.json();

    const cats_butts = [];

    for (const category of data) {
        const category_button = make_category_button(category.name, categories);
        const cat_butts = document.createElement("div");
        cats_butts.push(cat_butts);
        buttons.appendChild(cat_butts);

        category_button.addEventListener("click", () => {
            cats_butts.forEach((x) => (x.style.display = "none"));
            cat_butts.style.display = "block";
        });

        for (const block of category.blocks) {
            BLOCK_INFO_MAP[block.id] = block;

            block.color = category.color;
            add_create_block_button(block, cat_butts, editCanvas);
        }
    }

    cats_butts.forEach((x) => (x.style.display = "none"));
    cats_butts[0].style.display = "block";
}

function add_create_block_button(blockdef, parent, editCanvas) {
    const button = document.createElement("button");
    button.textContent = blockdef.name;
    button.style.backgroundColor = blockdef.color;

    button.addEventListener("click", function () {
        editCanvas.addBlock(blockdef);
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
                    id: "canvas.attendance",
                    inputs: [
                        { label: "User", type: "logged_in_user<Clark>", id: "clark_user" }
                    ]
                },
                {
                    name: "List Students",
                    id: "canvas.students",
                },
                {
                    name: "Submit Assignment",
                    id: "canvas.submit",
                },
                {
                    name: "Check Grades",
                    id: "canvas.get_grades",
                },
            ],
        },
        {
            name: "Users",
            color: "#800080",
            blocks: [
                {
                    name: "QR Code Scan",
                    id: "user.qrcode_scan",
                    inputs: [],
                    outputs: [
                        { label: "Scan", type: "user", id: "user_scan" }
                    ]
                },
            ],
        },
        {
            name: "Logic",
            color: "#1d7402",
            blocks: [
                {
                    name: "If",
                    id: "logic.if",
                },
            ],
        },
        {
            name: "Integrations",
            color: "#930000",
            blocks: [
                {
                    name: "Clark Login",
                    id: "integrate.login.sso.clark",
                    inputs: [
                        { label: "User", type: "user", id: "user" }
                    ],
                    outputs: [
                        { label: "Success", type: "logged_in_user<Clark>", id: "success" },
                        { label: "Failure", type: "user", id: "failure" }
                    ]
                },
            ],
        },
    ]),
});

async function create_edit_canvas(id, canvas) {
    const req = await fetch(`/api/bucket/${id}`);
    const data = (await req.json()) || {};

    if (!data.perspective) data.perspective = { x: 0, y: 0 };
    if (!data.blocks) data.blocks = {}; //TEMP FOR DEBUG

    const canvasInner = document.createElement("div");

    addDragging(
        canvasInner,
        (x, y) => {
            data.perspective = { x, y };
            sync_perspective();
        },
        {
            x: data.perspective.x,
            y: data.perspective.y,
            control_elem: canvas,
        }
    );

    canvas.appendChild(canvasInner);

    function sync_perspective() {
        fetch(`/api/bucket/${id}/perspective`, {
            method: "PATCH",
            body: JSON.stringify(data.perspective),
        });
    }

    function sync_block(block_id) {
        fetch(`/api/bucket/${id}/blocks.${block_id}`, {
            method: "PATCH",
            body: JSON.stringify(data.blocks[block_id]),
        });
    }

    function check_block_onscreen_sync(id) {
        return function (block_elem) {
            let block = data.blocks[id];
            if (!block) return;

            let is_still_onscreen = data.perspective.x + block.x >= 0;
            if (is_still_onscreen) {
                sync_block(id);
            } else {
                block_elem.remove();
                delete data.blocks[id];
                sync_block(id);
            }
        };
    }

    for (const [id, block] of Object.entries(data.blocks)) {
        create_onscreen_block(
            block,
            check_block_onscreen_sync(id),
            canvasInner
        );
    }

    return {
        addBlock: function (blockdef) {
            const id = (Date.now() + Math.random())
                .toString(36)
                .replace(".", "_");

            const block = blockdef_to_block(blockdef, data.perspective);

            create_onscreen_block(
                block,
                check_block_onscreen_sync(id),
                canvasInner
            );
            data.blocks[id] = block;
            sync_block(id);
        },
    };
}

function blockdef_to_block(blockdef, perspective) {
    return {
        type: blockdef.id,
        x: perspective.x,
        y: perspective.y,
        data: {},
        inputs: {},
        outputs: {}
    };
}
function create_onscreen_block(block_info, sync_callback, parent) {
    const block_parent = document.createElement("div");
    block_parent.classList.add("block-parent");

    let self = {};
    self.remove = () => parent.removeChild(block_parent);

    addDragging(
        block_parent,
        (x, y) => {
            block_info.x = x;
            block_info.y = y;
            sync_callback(self);
        },
        {
            x: block_info.x,
            y: block_info.y,
            start_dragging: () => {
                parent.style.zIndex = 2;
            },
            stop_dragging: () => {
                parent.style.zIndex = 0;
            },
        }
    );

    const blockdef = BLOCK_INFO_MAP[block_info.type];

    const blockHeader = document.createElement("h3");
    blockHeader.textContent = blockdef.name;
    blockHeader.style.backgroundColor = blockdef.color;

    block_parent.appendChild(blockHeader);

    parent.appendChild(block_parent);

    const block_content = document.createElement("div");
    block_content.classList.add("block-content");
    block_parent.appendChild(block_content);

    init_block_content(block_info, block_content);
}

function init_block_content(block_info, content) {
    const blockdef = BLOCK_INFO_MAP[block_info.type];

    init_block_flows(blockdef.inputs, "input", content);

    const inner = document.createElement("div");
    content.appendChild(inner);
    inner.classList.add("block-inner-content");

    init_block_flows(blockdef.outputs, "output", content);


    init_block_inner(block_info, inner);
}

async function init_block_inner(block_info, content_elem) {
    const type = block_info.type;

    if(BLOCK_INFO_MAP[type].init_content_function) {
        BLOCK_INFO_MAP[type].init_content_function(block_info, content_elem)
    } else {
        const get_content_function = await fetch(`/static/scripts/block_edits/${type}.js`);
        if(get_content_function.status !== 200) return false;

        const content_function_source = await get_content_function.text();
        const func = new Function("block_info", "content_elem", content_function_source);
        BLOCK_INFO_MAP[type].init_content_function = func;
        func(block_info, content_elem);
    }
}

function init_block_flows(flows, type, parent) {
    if(!flows) return; // THIS LINE FOR DEBUG

    const ul = document.createElement("ul");
    ul.classList.add("block-flow", type);
    for(const flow of flows) {
        const li = document.createElement("li");
        const indicator = document.createElement("button");
        li.appendChild(indicator);
        const label = document.createElement("span");
        label.textContent = flow.label;
        li.appendChild(label);
        ul.appendChild(li);
    }

    parent.appendChild(ul);
}

/**
 *
 * @param {HTMLDivElement} element
 */
function addDragging(element, cb, pos) {
    if (!pos) pos = {};

    let dragging = false,
        originalX = 0,
        originalY = 0,
        x = pos.x || 0,
        y = pos.y || 0;

    element.style.transform = `translate(${x}px, ${y}px)`;

    function mouseleave(e) {
        dragging = false;
        if (cb) cb(x, y);
    }

    function mousemove(e) {
        if (dragging) {
            x = e.clientX - originalX;
            y = e.clientY - originalY;

            element.style.transform = `translate(${x}px, ${y}px)`;
        }
        e.preventDefault();
        e.stopPropagation();
    }

    function mouseup(e) {
        dragging = false;
        if(pos.stop_dragging) pos.stop_dragging();
        
        e.preventDefault();
        e.stopPropagation();

        window.removeEventListener("mouseup", mouseup);
        window.removeEventListener("mouseleave", mouseleave);
        window.removeEventListener("mousemove", mousemove);

        if (cb) cb(x, y);
    }

    (pos.control_elem || element).addEventListener("mousedown", (e) => {
        dragging = true;
        originalX = e.clientX - x;
        originalY = e.clientY - y;

        if(pos.start_dragging) pos.start_dragging();

        e.preventDefault();
        e.stopPropagation();

        window.addEventListener("mouseup", mouseup);
        window.addEventListener("mouseleave", mouseleave);
        window.addEventListener("mousemove", mousemove);
    });
}

window.addEventListener("load", () => main());
