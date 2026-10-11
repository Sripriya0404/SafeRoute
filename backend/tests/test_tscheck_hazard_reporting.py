import uuid


def test_create_hazard_is_returned_with_location_and_can_be_queried(client):
    description = f'tscheck-{uuid.uuid4().hex} dim walkway light'
    response = client.post('/safety/hazards', json={'category': 'Poor lighting', 'severity': 'High', 'location_id': 'arts-center', 'description': description})
    assert response.status_code == 200, response.text
    created = response.json()
    assert created['description'] == description
    assert created['location_name'] == 'Arts Center'
    listed = client.get('/safety/hazards')
    assert listed.status_code == 200
    assert any(item['id'] == created['id'] for item in listed.json())
