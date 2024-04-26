from datetime import datetime
import re

from django.shortcuts import render

from src.models import AttendanceDayPolyfillRecordings


def record_attendance(request, context, path_remaining, state, block_specific_id):
    blockdata = state.flowchart.contents['blocks'][block_specific_id]['data']

    student_email = None

    if 'sso.clark' in state.state['accumulated_user_information']:
        student_email = (state.state['accumulated_user_information']
                        ['sso.clark']
                        ['serviceResponse']
                        ['authenticationSuccess']
                        ['attributes']['upn'][0]
                    ) + "@clarku.edu"
    elif path_remaining == "submit_attendance_email":
        student_email = request.GET.get("email", None)
        if not re.match(r"^\w+@clarku.edu$", student_email):
            student_email = None

    if student_email == None:
        return render(request, "generic-form.html", {
            "title": "Attendance",
            "questions": [{
                "question": "Please enter your Clark email",
                "id": "email"
            }],
            "url": f"/userflow/{state.uuid}/submit_attendance_email"
        })

    AttendanceDayPolyfillRecordings.objects.create(
        instructor_access=state.flowchart.user.canvastoken,
        recorded_at=datetime.now(),
        section=blockdata['section_id'],
        status=blockdata.get("mark_as") or "Present",
        student_email=student_email,
        by_flowchart=state.flowchart,
    )
    return True