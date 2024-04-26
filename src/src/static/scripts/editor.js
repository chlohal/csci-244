const BLOCK_INFO_MAP = {};

async function main() {
    let my_id = location.pathname.split("/")[2];

    let canvas = document.getElementsByClassName("main-edit-canvas")[0];

    const req = await fetch(`/api/flowcharts/${my_id}`);
    const data = (await req.json()) || {};

    let editCanvas = {};

    await create_new_block_buttons(editCanvas);

    Object.assign(editCanvas, await create_edit_canvas(my_id, canvas, data));
}

async function create_new_block_buttons(editCanvas) {
    const parent = document.querySelector(".blockpicker");
    const categories = parent.querySelector(".catpicker");
    const buttons = parent.querySelector("div");

    categories.textContent = "";
    buttons.textContent = "";

    const req = await fetch(`/api/block_types`);
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
        if(blockdef.id.startsWith("canvas.") && !CANVAS_LOGGED_IN) {
            ensureCanvasLogin(() => {
                editCanvas.addBlock(blockdef);
            });
        } else {
            editCanvas.addBlock(blockdef);
        }
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

async function create_edit_canvas(id, canvas, data) {
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

    const trashCan = document.createElement("img");
    trashCan.src = "/static/imgs/trash.svg"
    trashCan.classList.add("trash");
    canvas.appendChild(trashCan);
    let desiredToDeleteCurrentBlock = false;

    trashCan.addEventListener("mouseenter", () => {
        desiredToDeleteCurrentBlock = true;
        console.log("MOUSE");
    });
    trashCan.addEventListener("mouseleave", () => {
        desiredToDeleteCurrentBlock = false;
        console.log("NOMOUSE");
    });
    window.addEventListener("mouseleave", () => {
        desiredToDeleteCurrentBlock = false;
    });

    function sync_perspective() {
        fetch(`/api/flowcharts/${id}/perspective`, {
            method: "PATCH",
            body: JSON.stringify(data.perspective),
        });
    }

    function sync_block(block_id) {
        fetch(`/api/flowcharts/${id}/blocks.${block_id}`, {
            method: "PATCH",
            body: JSON.stringify(data.blocks[block_id]),
        });
    }

    let create_flow_between = make_create_flow_between_func(canvasInner, data.blocks, sync_block);

    function check_block_onscreen_sync(id) {
        return function (block_elem) {
            let block = data.blocks[id];
            if (!block) return;

            if (desiredToDeleteCurrentBlock) {
                block_elem.remove();
                delete data.blocks[id];
            }

            sync_block(id);
        };
    }

    const flow_makers = [];
    for (const [id, block] of Object.entries(data.blocks)) {
        create_onscreen_block(
            block,
            check_block_onscreen_sync(id),
            canvasInner,
            create_flow_between
        );

        console.log(block);

        for(const [flow_id, flows] of Object.entries(block.flows)) {
            for(const flow of flows) {
                if(flow.direction == "out") {
                    flow_makers.push(() => {
                        make_flow_elem(canvasInner, data.blocks, id, flow_id, flow.block, flow.flow, sync_block);
                    });
                }
            }
        }
    }
    setTimeout(() => {
        for(const f of flow_makers) f();
    }, 0);

    return {
        addBlock: function (blockdef) {
            const block = blockdef_to_block(blockdef, data.perspective);
            block.x = -(data.perspective.x|0) + 100;
            block.y = -(data.perspective.y|0) + 100;

            create_onscreen_block(
                block,
                check_block_onscreen_sync(id),
                canvasInner,
                create_flow_between
            );
            data.blocks[block.id] = block;
            sync_block(block.id);
        },
    };
}

function blockdef_to_block(blockdef, perspective) {
    const id = (Date.now() + Math.random())
                .toString(36)
                .replace(".", "_");
    return {
        id,
        type: blockdef.id,
        x: perspective.x,
        y: perspective.y,
        data: {},
        flows: {}
    };
}

let ENSURING_CANVAS_LOGIN = null;
function ensureCanvasLogin(cb) {
    if(CANVAS_LOGGED_IN) {
        return cb(true);
    }
    if(ENSURING_CANVAS_LOGIN === null) {
        ENSURING_CANVAS_LOGIN = cb ? [] : [cb];
    } else {
        ENSURING_CANVAS_LOGIN.push(cb);
        return;
    }

    let shadowbox = document.createElement("div");
    shadowbox.classList.add("modal-shadowbox");

    let popup = document.createElement("dialog");
    popup.open = true;
    popup.classList.add("modal-popup");

    popup.innerHTML = `<h2>Canvas Integration</h2>
    <p>In order to connect properly with your Canvas account, you'll need to make a Canvas token and connect it with our system.</p>
    <p>We'll do our best to make sure you don't have to repeat this step, but sometimes, Canvas will invalidate tokens for arbitrary security.</p>
    <p>Please access <a href="https://canvas.clarku.edu/profile/settings#access_tokens_holder">this page</a> and create a new token 
    according to <a href="https://community.canvaslms.com/t5/Student-Guide/How-do-I-manage-API-access-tokens-as-a-student/ta-p/273">Canvas's official tutorial</a>
    </p>
    <p>Then, copy/paste your token into the box below.</p>
    <input placeholder="Token" class="token">
    <p>Please also enter your Canvas address. This is usually <code>https://canvas.youruniversity.edu</code></p>
    <input placeholder="Canvas URL" class="url">
    <button>Confirm</button>
    `;

    let token_input = popup.querySelector("input.token");
    let url_input = popup.querySelector("input.token");
    let button = popup.querySelector("button");

    button.addEventListener("click", () => {
        let token = token_input.value.trim();
        let api_url = url_input.value.trim();

        fetch("/api/integrate/canvas", {
            method: "POST",
            body: JSON.stringify({
                token, api_url
            })
        }).then(x=> {
            if(x.status == 201) {
                document.body.removeChild(shadowbox);
                CANVAS_LOGGED_IN = true;
                ENSURING_CANVAS_LOGIN.forEach(x=>x(true));
                ENSURING_CANVAS_LOGIN = null;
            } else {
                alert("Canvas token incorrect! Please ensure the token is correct and retry");
            }
        });
    })

    shadowbox.addEventListener("click", (e) => { 
        if(e.target === shadowbox) {
            document.body.removeChild(shadowbox);
            ENSURING_CANVAS_LOGIN.forEach(x=>x(false));
            ENSURING_CANVAS_LOGIN = null;
        }
    })

    shadowbox.appendChild(popup);
    document.body.appendChild(shadowbox);
}


const FLOW_CACHE = {}
const FLOW_CACHE_BY_BLOCKS_THAT_CARE = {}
function make_create_flow_between_func(canvas, blocks, sync_block) {
    return function create_flow_between(from_block_id, from_flow_id, to_block_id, to_flow_id) {
        if(to_block_id === undefined || to_flow_id === undefined) {
            return;
        }

        //if the flow already exists, don't recreate it
        if(FLOW_CACHE[`${from_block_id}:${from_flow_id}:${to_block_id}:${to_flow_id}`]) return;


        make_flow_elem(canvas, blocks, from_block_id, from_flow_id, to_block_id, to_flow_id, sync_block);


        if(!blocks[from_block_id].flows[from_flow_id]) blocks[from_block_id].flows[from_flow_id] = [];
        blocks[from_block_id].flows[from_flow_id].push({ block: to_block_id, flow: to_flow_id, direction: "out" });

        if(!blocks[to_block_id].flows[to_flow_id]) blocks[to_block_id].flows[to_flow_id] = [];
        blocks[to_block_id].flows[to_flow_id].push({ block: from_block_id, flow: from_flow_id, direction: "in" });

        sync_block(from_block_id);
        sync_block(to_block_id);
    }
}

function make_flow_elem(canvas, blocks, from_block_id, from_flow_id, to_block_id, to_flow_id, sync_block) {
    let from_block_elem = canvas.querySelector(`i[data-block-flow="${from_block_id}:output:${from_flow_id}"]`);
    let to_block_elem = canvas.querySelector(`i[data-block-flow="${to_block_id}:input:${to_flow_id}"]`);

    let from_block_def = blocks[from_block_id];
    let to_block_def = blocks[to_block_id];
    

    let trail_parent = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let trail = document.createElementNS("http://www.w3.org/2000/svg", "path");
    trail_parent.appendChild(trail);
    trail_parent.classList.add("flow-indicator")
    canvas.appendChild(trail_parent);

    let from_offset_x = from_block_elem.offsetLeft + from_block_elem.offsetWidth / 2;
    let from_offset_y = from_block_elem.offsetTop + from_block_elem.offsetHeight / 2;

    let to_offset_x = to_block_elem.offsetLeft + to_block_elem.offsetWidth / 2;
    let to_offset_y = to_block_elem.offsetTop + to_block_elem.offsetHeight / 2;

    let self = { update_flow_pos, remove }

    function remove() {
        if(trail_parent.parentElement) canvas.removeChild(trail_parent);
        delete FLOW_CACHE[`${from_block_id}:${from_flow_id}:${to_block_id}:${to_flow_id}`];

        FLOW_CACHE_BY_BLOCKS_THAT_CARE[from_block_id].delete(self);
        FLOW_CACHE_BY_BLOCKS_THAT_CARE[to_block_id].delete(self);

        let from_flows = from_block_def.flows[from_flow_id];
        for(let i = from_flows.length; i --> 0; ) {
            let flow = from_flows[i];
            console.log(flow,to_block_id, to_flow_id);
            if(flow.block === to_block_id && flow.flow === to_flow_id) {
                from_flows.splice(i, 1);
                break;
            }
        }

        let to_flows = to_block_def.flows[to_flow_id] || [];
        for(let i = to_flows.length; i --> 0; ) {
            let flow = to_flows[i];
            if(flow.block === from_block_id && flow.flow === from_flow_id) {
                to_flows.splice(i, 1);
                break;
            }
        }

        sync_block(from_block_id);
        sync_block(to_block_id);
    }

    let SVG_PADDING = 5;

    function update_flow_pos() {
        let from_pos_x = from_block_def.x + from_offset_x;
        let from_pos_y = from_block_def.y + from_offset_y;

        let to_pos_x = to_block_def.x + to_offset_x;
        let to_pos_y = to_block_def.y + to_offset_y;

        let span_x = Math.abs(to_pos_x - from_pos_x);
        let span_y = Math.abs(to_pos_y - from_pos_y);

        trail_parent.setAttribute("width", span_x + SVG_PADDING * 2);
        trail_parent.setAttribute("height", span_y + SVG_PADDING * 2);

        let orig_x = Math.min(from_pos_x, to_pos_x);
        let orig_y = Math.min(from_pos_y, to_pos_y);

        trail_parent.style.transform = `translate(${orig_x - SVG_PADDING}px, ${orig_y - SVG_PADDING}px)`;

        let svg_from_x = from_pos_x - orig_x + SVG_PADDING;
        let svg_from_y = from_pos_y - orig_y + SVG_PADDING;

        let svg_to_x = to_pos_x - orig_x + SVG_PADDING;
        let svg_to_y = to_pos_y - orig_y + SVG_PADDING;

        trail.setAttribute("d", `M${svg_from_x},${svg_from_y} C ${svg_to_x} ${svg_from_y} ${svg_from_x} ${svg_to_y} ${svg_to_x},${svg_to_y}`);
    }

    trail.addEventListener("click", () => {
        remove();
    });

    update_flow_pos();


    FLOW_CACHE_BY_BLOCKS_THAT_CARE[from_block_id].add(self);
    FLOW_CACHE_BY_BLOCKS_THAT_CARE[to_block_id].add(self);

    FLOW_CACHE[`${from_block_id}:${from_flow_id}:${to_block_id}:${to_flow_id}`] = self;

    return self;

}

function create_onscreen_block(block_info, sync_callback, parent, create_flow_between) {
    const block_parent = document.createElement("div");
    block_parent.classList.add("block-parent");

    FLOW_CACHE_BY_BLOCKS_THAT_CARE[block_info.id] = new Set();

    let self = {};
    self.remove = () => {
        parent.removeChild(block_parent);
        for(const flow of FLOW_CACHE_BY_BLOCKS_THAT_CARE[block_info.id]) {
            flow.remove();
        }
    }

    block_parent.style.zIndex = 1;

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
                block_parent.style.zIndex = 2;
            },
            stop_dragging: () => {
                block_parent.style.zIndex = 1;
            },
            when_dragging: (x,y) => {
                block_info.x = x;
                block_info.y = y;

                for(const flow of FLOW_CACHE_BY_BLOCKS_THAT_CARE[block_info.id]) {
                    flow.update_flow_pos();
                }
            }
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

    init_block_content(block_info, block_content, () => sync_callback(self), create_flow_between);
}

function init_block_content(block_info, content, sync_callback, create_flow_between) {
    const blockdef = BLOCK_INFO_MAP[block_info.type];

    if(!blockdef.flows) blockdef.flows = {};

    init_block_flows(blockdef.flows.filter(x=>x.is_input), "input", content, block_info.id, create_flow_between);

    const inner = document.createElement("div");
    content.appendChild(inner);
    blockDragging(inner);
    inner.classList.add("block-inner-content");

    init_block_flows(blockdef.flows.filter(x=>!x.is_input), "output", content, block_info.id, create_flow_between);


    init_block_inner(block_info, inner, sync_callback);
}

async function init_block_inner(block_info, content_elem, sync_callback) {
    const type = block_info.type;

    if(BLOCK_INFO_MAP[type].init_content_function) {
        BLOCK_INFO_MAP[type].init_content_function(block_info, content_elem)
    } else {
        const get_content_function = await fetch(`/static/scripts/block_edits/${type}.js`);
        if(get_content_function.status !== 200) return false;

        const blocksLocalStorage = {
            getItem: (item) => block_info.data[item],
            setItem: (item,v) => {block_info.data[item] = v; sync_callback(); },
            removeItem: (item) => { delete block_info.data[item]; sync_callback(); },
        }
        const AsyncFunction = (async function () {}).constructor;
        const content_function_source = await get_content_function.text();
        const func = new AsyncFunction("localStorage", "block_info", "content_elem", content_function_source);
        BLOCK_INFO_MAP[type].init_content_function = func;
        func(blocksLocalStorage, block_info, content_elem);
    }
}

function init_block_flows(flows, type, parent, block_id, create_flow_between) {
    if(!flows) return; // THIS LINE FOR DEBUG

    const ul = document.createElement("ul");
    ul.classList.add("block-flow", type);
    for(const flow of flows) {
        const li = document.createElement("li");
        const indicator_parent = document.createElement("i");
        const indicator = document.createElement("button");
        li.appendChild(indicator_parent);
        indicator_parent.appendChild(indicator);
        indicator_parent.setAttribute("data-block-flow", `${block_id}:${type}:${flow.id}`);

        let trail_parent = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        let trail = document.createElementNS("http://www.w3.org/2000/svg", "path");
        trail_parent.appendChild(trail);
        indicator_parent.appendChild(trail_parent);

        addDragging(indicator, (x,y)=>{
            let windowBox = indicator.getClientRects().item(0);
            let windowX = windowBox.x + windowBox.width / 2;
            let windowY = windowBox.y + windowBox.height / 2;

            console.log(windowX, windowY);

            for(const elemAtPoint of document.elementsFromPoint(windowX, windowY)) {

                if (elemAtPoint != indicator && elemAtPoint.hasAttribute("data-block-flow")) {
                    const [other_block_id, other_flow_type, other_flow_id] = elemAtPoint.getAttribute("data-block-flow").split(":");
                    if (other_flow_type == type) {
                        continue;
                    }

                    if(other_flow_type === "input") {
                        create_flow_between(block_id, flow.id, other_block_id, other_flow_id);
                    } else {
                        create_flow_between(other_block_id, other_flow_id, block_id, flow.id);
                    }

                    return  {
                        x: 0, y: 0
                    };
                }
            }

            create_flow_between(block_id, flow.id, undefined, undefined);

            return {
                x: 0, y: 0
            }
        }, {
            when_dragging: function updateTrail(x,y) {
                let aX = Math.abs(x);
                let aY = Math.abs(y);
                trail_parent.setAttribute("width", aX);
                trail_parent.setAttribute("height", aY);


                let trans = "";
                if(x < 0) {
                    trans += "scaleX(-1) ";
                }
                if(y < 0) {
                    trans += "scaleY(-1) ";
                }

                trail_parent.style.transform = trans;

                trail.setAttribute("d", `M0,0 C ${aX} 0 0 ${aY} ${aX},${aY}`);
            }
        });

        const label = document.createElement("span");
        label.textContent = flow.label;
        li.appendChild(label);
        ul.appendChild(li);
    }

    parent.appendChild(ul);
}

function blockDragging(element) {
    let cb = e => e.stopPropagation();
    element.addEventListener("mousedown", cb);
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

    function callUpdateCallback() {
        if(!cb) return;
        let cb_res = cb(x, y);

        if(!cb_res) return;

        if (typeof cb_res.x === "number") x = cb_res.x;
        if (typeof cb_res.y === "number") y = cb_res.y;

        element.style.transform = `translate(${x}px, ${y}px)`;
        if(pos.when_dragging) pos.when_dragging(x,y);
    }

    function mouseleave(e) {
        dragging = false;
        callUpdateCallback()
    }

    function mousemove(e) {
        if (dragging) {
            x = e.clientX - originalX;
            y = e.clientY - originalY;

            if(pos.when_dragging) pos.when_dragging(x,y);

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

        callUpdateCallback()
    }

    (pos.control_elem || element).addEventListener("mousedown", (e) => {
        dragging = true;
        originalX = e.clientX - x;
        originalY = e.clientY - y;

        if(document.activeElement) document.activeElement.blur();

        if(pos.start_dragging) pos.start_dragging();

        e.preventDefault();
        e.stopPropagation();

        window.addEventListener("mouseup", mouseup);
        window.addEventListener("mouseleave", mouseleave);
        window.addEventListener("mousemove", mousemove);
    });
}

window.addEventListener("load", () => main());
