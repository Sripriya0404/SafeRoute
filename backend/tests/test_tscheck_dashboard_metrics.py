

def test_dashboard_has_status_metrics_and_recent_hazards(client):
    response = client.get('/safety/dashboard')
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['campus_status'] == 'ALL CLEAR'
    assert len(body['metrics']) >= 4
    assert len(body['recent_hazards']) >= 3
    assert {'severity', 'location_name', 'description', 'reported_at'} <= body['recent_hazards'][0].keys()
