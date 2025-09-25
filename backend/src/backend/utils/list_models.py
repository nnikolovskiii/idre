import requests
url = "https://openrouter.ai/api/v1/models"
response = requests.get(url)
for elem in response.json()["data"]:
    pricing = elem["pricing"]
    id = elem["id"]

    if pricing["prompt"] == '0' and pricing["completion"] == '0':
        print(f"{id} {pricing}")

    # print(elem)