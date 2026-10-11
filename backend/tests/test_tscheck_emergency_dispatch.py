import uuid


def test_emergency_dispatch_returns_dispatch_confirmation(client):
    message = f'tscheck-{uuid.uuid4().hex}'
    response = client.post('/safety/emergency', json={'location_id': 'west-gate', 'message': message})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['status'] == 'Dispatched'
    assert body['location_name'] == 'Main Gate'
    assert body['message'] == message
    assert body['eta_minutes'] == 3
