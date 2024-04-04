# from src.models import Student
import requests


def auth() -> str:
    with open('auth_token.txt') as f:
        return f.readlines()[0].rstrip()


HEADS = {'Authorization': f'Bearer {auth()}'}
URL = 'https://canvas.instructure.com/api/v1/courses'


def get_user_ids(usrs: list):
    url = 'https://canvas.instructure.com/api/v1/courses'
    course_id = requests.get(url, headers=HEADS).json()[0]['id']
    users = requests.get(url + f'/{course_id}/users', headers=HEADS).json()
    ids = {stdnt['name']: stdnt['id'] for stdnt in users}
    attending = [ids[name] for name in usrs]


def submit(id: str) -> None:
    """
    :param id: string
    """

    course_id = requests.get(url, headers=heads).json()[0]['id']
    assign_url = url + f'/{course_id}/assignments'

    assigns = requests.get(assign_url, headers=HEADS).json()
    if 'attendance' not in [item['name'] for item in assigns]:
        requests.post(url, data={'assignment[name]':'Attendance',
                                       'assignment[submission_types][]': 'external_tool',
                                       'assignment[grading_type]': 'points',
                                       'assignment[points_possible]:': 10,
                                       'assignment[published]': True}, headers=HEADS)
    assigns = requests.get(assign_url, headers=HEADS).json()
    for item in assigns:
        if item['name'] == 'Attendance':
            assign_id = item['id']

    students = Students.objects.filter(uuid=id)
    sid = [get_user_id(s) for s in students]
    
    print(requests.post(url + f'/{course_id}/assignments/{assign_id}/submissions/update_grades', json={
        "grade_data": {
            student_id: { "posted_grade": 100 }
        }
        }, headers=HEADS).text)



if __name__ == '__main__':
    get_user_ids(["Wil Secord"])
