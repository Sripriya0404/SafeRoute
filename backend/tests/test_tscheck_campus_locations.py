

def test_locations_expose_fictional_campus_landmarks(client):
    response = client.get('/safety/locations')
    assert response.status_code == 200, response.text
    names = {item['name'] for item in response.json()}
    assert {'Main Library', 'Science Quad', 'Student Union', 'North Dorms', 'Engineering Hall', 'South Athletics', 'West Gate', 'Arts Center'} <= names
