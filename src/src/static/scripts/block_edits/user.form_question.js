let input = document.createElement("input");

input.addEventListener("change", () => {
    localStorage.setItem("question", input.value);
});

let label = document.createElement("label");
label.textContent = "Question";
label.appendChild(input);

content_elem.appendChild(label);