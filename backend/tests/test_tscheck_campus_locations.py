

def test_locations_expose_fictional_campus_landmarks(client):
    response = client.get('/safety/locations')
    assert response.status_code == 200, response.text
    names = {item['name'] for item in response.json()}
    assert {'Central Library', 'Pharmacy Block', 'Student Activity Centre', 'University Hostels', 'Engineering Block', 'Sports Complex', 'Main Gate', 'Administration Block'} <= names
