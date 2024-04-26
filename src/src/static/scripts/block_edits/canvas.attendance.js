let kindSelector = document.createElement("select");
kindSelector.innerHTML = `<option value="Present">Mark as Present</option><option value="Absent">Mark as Absent</option>`;
kindSelector.addEventListener("change", () => {
    localStorage.setItem("mark_as", kindSelector.value);
});

content_elem.appendChild(kindSelector);
kindSelector.value = localStorage.getItem("mark_as") || "Present";

let sections = await (await fetch("/api/integrate/canvas/v1/courses")).json();

let activeSection = localStorage.getItem("section_id");

let lastSectionId;
let choice = document.createElement("select");
for(const section of sections) {
    if(section.name) {
        let opt = document.createElement("option");
        opt.textContent = section.name;
        opt.value = section.id;
        if(section.id == activeSection || activeSection === undefined) opt.selected = true;


        choice.appendChild(opt);
    }
}

if(activeSection === undefined) {
    localStorage.setItem("section_id", choice.value);
    activeSection = choice.value;
}

choice.addEventListener("change", () => {
    activeSection = choice.value;
    localStorage.setItem("section_id", choice.value);
});

let label = document.createElement("label");
label.textContent = "Section";

label.appendChild(choice);
content_elem.appendChild(label);


let heading = content_elem.parentElement.parentElement.querySelector("h3");
let edit_link = document.createElement("a");
let flowchart_id = window.location.pathname.split("/")[2];
edit_link.href = "/edit_attendance/" + flowchart_id;
edit_link.target = "_blank";
edit_link.style="margin-left:auto;margin-right:-0.5rem;";

let pencil = document.createElement("img");
pencil.style = "width:1em;height:1em";
pencil.src = "/static/imgs/pencil.svg";

edit_link.appendChild(pencil);
heading.appendChild(edit_link);