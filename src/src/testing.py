from src.models import Student
import requests


def auth() -> str:
    with open('auth_token.txt') as f:
        return f.readlines()[0].rstrip()


HEADS = {'Authorization': f'Bearer {auth()}'}
URL = 'https://canvas.instructure.com/api/v1/courses'


def get_user_ids(usrs: list) -> list:
    url = 'https://canvas.instructure.com/api/v1/courses'
    course_id = requests.get(url, headers=HEADS).json()[0]['id']
    users = requests.get(url + f'/{course_id}/users', headers=HEADS).json()
    ids = {stdnt['name']: stdnt['id'] for stdnt in users}
    attending = [ids[name] for name in usrs]
    return attending


def mark_present(name: str, uuid: str) -> None:
    Student.objects.create(name=name, uuid=uuid)


def submit(uuid: str) -> None:
    """
    :param uuid: string
    """

    course_id = requests.get(URL, headers=HEADS).json()[0]['id'] # MAKE MODULAR
    assign_url = URL + f'/{course_id}/assignments'

    assigns = requests.get(assign_url, headers=HEADS).json()

    if 'Attendance' not in [item['name'] for item in assigns]:
        requests.post(URL, data={'assignment[name]':'Attendance',
                                       'assignment[submission_types][]': 'external_tool',
                                       'assignment[grading_type]': 'points',
                                       'assignment[points_possible]:': 10,
                                       'assignment[published]': True}, headers=HEADS)

    assigns = requests.get(assign_url, headers=HEADS).json()

    for item in assigns:
        if item['name'] == 'Attendance':
            assign_id = item['id']

    students = Student.objects.filter(uuid=uuid)
    sids = get_user_ids(list(set([s.name for s in students])))
    print(sids)
    
    # print(requests.post(url + f'/{course_id}/assignments/{assign_id}/submissions/update_grades', json={
    #     "grade_data": {
    #         student_id: { "posted_grade": 100 } # {sid: {"posted_grade": 100} for sid in sids}
    #     }
    #     }, headers=HEADS).text)

