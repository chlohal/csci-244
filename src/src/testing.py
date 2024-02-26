import requests

url = "https://canvas.instructure.com/api/v1/courses"
with open('auth_token.txt') as f:
    auth = f.readlines()[0].rstrip()

print(requests.get(url, headers={'Authorization': f'Bearer {auth}'}))
