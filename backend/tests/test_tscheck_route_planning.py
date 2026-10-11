import uuid


def test_plan_route_returns_recommended_options(client):
    response = client.post('/safety/routes/plan', json={'origin_id': 'library', 'destination_id': 'north-dorms', 'priority': 'safety'})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['recommended_id'] == 'illuminated'
    assert len(body['options']) == 3
    assert {'safety_score', 'distance_m', 'minutes'} <= body['options'][0].keys()


def test_plan_route_rejects_same_origin_and_destination(client):
    response = client.post('/safety/routes/plan', json={'origin_id': 'library', 'destination_id': 'library'})
    assert response.status_code == 422
