def auth():
    with open('auth_token.txt') as f:
        return f.readlines()[0].rstrip()


def get_user_id(usr):
    url = 'https://canvas.instructure.com/api/v1/courses'
    course_id = requests.get(url, headers=heads).json()[0]['id']
    users = requests.get(url + f'/{course_id}/users', headers=heads).json()
    for user in users:
        print(user)
        if usr.lower() == user['name'].lower():
            return user['id']


# keys.txt:
# course_id
# Attendance assignment_id


if __name__ == '__main__':
    import requests
    
    heads = {'Authorization': f'Bearer {auth()}'}
    
    url = 'https://canvas.instructure.com/api/v1/courses'
    
    
    course_id = requests.get(url, headers=heads).json()[0]['id']
    # print(course_id)
    # users = requests.get(url + f'/{course_id}/users', headers=heads).json()
    # print(users)

    assigns = requests.get(url := url + f'/{course_id}/assignments', headers=heads).json()
    if 'Attendance' not in [item['name'] for item in assigns]:
        print(requests.post(url, data={'assignment[name]':'Attendance',
                                       'assignment[submission_types][]': 'external_tool',
                                       'assignment[grading_type]': 'points',
                                       'assignment[points_possible]:': 10,
                                       'assignment[published]': True}, headers=heads))
    assigns = requests.get(url, headers=heads).json()
    for item in assigns:
        if item['name'] == 'Attendance':
            assign_id = item['id']
    
    url = 'https://canvas.instructure.com/api/v1/courses/'
    print(url + f'/{course_id}/gradebook/update_submission/{get_user_id("wil secord")}')
    # , data={'submission[posted_grade]': '100'}
    student_id = get_user_id("wil secord")
    grade = requests.get(url + f'/{course_id}/assignments/{assign_id}/submissions/{student_id}', headers=heads).json()['grade']

    print(requests.post(url + f'/{course_id}/assignments/{assign_id}/submissions/update_grades', json={
        "grade_data": {
            student_id: { "posted_grade": 2 }
        }
        }, headers=heads).text)
