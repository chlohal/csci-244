def auth():
    with open('auth_token.txt') as f:
        return f.readlines()[0].rstrip()


def get_user_id(usr):
    url = 'https://canvas.instructure.com/api/v1/courses'
    course_id = requests.get(url, headers=heads).json()[0]['id']
    users = requests.get(url + f'/{course_id}/users', headers=heads).json()
    for user in users:
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
    
    url = 'https://canvas.instructure.com/api/v1/courses'
    print(url + f'/{course_id}/assignments/{assign_id}/submissions/{get_user_id("wil secord")}')
    # , data={'submission[posted_grade]': '100'}
    grade = requests.get(url + f'/{course_id}/assignments/{assign_id}/submissions/{get_user_id("wil secord")}', headers=heads).json()['grade']
    print(grade)
    print(requests.post(url + f'/{course_id}/assignments/{assign_id}/submissions', data={'submission[user_id]': get_user_id("wil secord"),
                                                                                         'submission[submission_type]': 'basic_lti_launch'}, headers=heads).json())
    # print(requests.post(url + f'/{course_id}/assignments/{assign_id}/submissions/update_grades', data={f'grade_data[{get_user_id("wil secord")}]': '10'}, headers=heads))

