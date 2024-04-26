from django.shortcuts import render


def form_process(request, context, path_remaining, state, block_id):
    blockdata = state.flowchart.contents['blocks'][block_id]
    print(blockdata)

    if path_remaining == "submit_form":
        if "form_answers" not in state.state['accumulated_user_information']:
            state.state['accumulated_user_information']['form_answers'] = []
        state.state['accumulated_user_information']['form_answers'].append({
            "": ""
        })
        return True
    else:
        return render(request, "generic-form.html", {
            "title": "Form Question",
            "questions": [{
                "question": blockdata['data'].get("question") or "",
                "id": block_id
            }],
            "url": f"/userflow/{state.uuid}/submit_form"
        })