import uuid


def test_demo_student_login_returns_profile(client):
    response = client.post('/auth/login', json={'email': 'student@anurag.edu.in', 'password': 'SafeRoute@2026'})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['student']['name'] == 'Aarav Reddy'
    assert body['student']['student_id'] == 'AU21CSE042'
    # session cookie must be set so the dashboard can be reached
    assert 'saferoute_session' in response.cookies


def test_login_rejects_wrong_password():
    import httpx
    with httpx.Client(base_url='http://localhost:8001/api', timeout=30.0) as anon:
        response = anon.post('/auth/login', json={'email': 'student@anurag.edu.in', 'password': 'wrong-password'})
        assert response.status_code == 401


def test_save_route_and_record_arrival_increment_profile_counts(client):
    login = client.post('/auth/login', json={'email': 'student@anurag.edu.in', 'password': 'SafeRoute@2026'})
    assert login.status_code == 200, login.text
    # The login cookie is marked Secure (production serves over https); over this plain
    # http test connection httpx's jar won't replay it automatically, so forward it manually.
    session_cookie = login.cookies.get('saferoute_session')
    client.cookies.set('saferoute_session', session_cookie)
    client.headers['Cookie'] = f'saferoute_session={session_cookie}'

    before = client.get('/auth/overview')
    assert before.status_code == 200, before.text
    before_body = before.json()
    saved_routes_before = len(before_body['saved_routes'])
    arrivals_before = before_body['safe_arrivals']

    route_name = f'tscheck-route-{uuid.uuid4().hex[:8]}'
    save_resp = client.post('/auth/saved-routes', json={
        'origin_id': 'library',
        'origin_name': 'Central Library',
        'destination_id': 'north-dorms',
        'destination_name': 'University Hostels',
        'route_name': route_name,
        'minutes': 8,
        'safety_score': 95,
    })
    assert save_resp.status_code == 200, save_resp.text
    assert save_resp.json()['route_name'] == route_name

    arrival_resp = client.post('/auth/arrivals')
    assert arrival_resp.status_code == 204, arrival_resp.text

    after = client.get('/auth/overview')
    assert after.status_code == 200, after.text
    after_body = after.json()
    assert len(after_body['saved_routes']) == saved_routes_before + 1
    assert any(r['route_name'] == route_name for r in after_body['saved_routes'])
    assert after_body['safe_arrivals'] == arrivals_before + 1


def test_hazard_report_increments_authenticated_student_report_count(client):
    login = client.post('/auth/login', json={'email': 'student@anurag.edu.in', 'password': 'SafeRoute@2026'})
    assert login.status_code == 200, login.text
    session_cookie = login.cookies.get('saferoute_session')
    client.headers['Cookie'] = f'saferoute_session={session_cookie}'

    before = client.get('/auth/overview')
    assert before.status_code == 200
    reports_before = before.json()['report_count']

    description = f'tscheck-{uuid.uuid4().hex} flickering lamp near walkway'
    hazard_resp = client.post('/safety/hazards', json={
        'category': 'Poor lighting',
        'severity': 'Medium',
        'location_id': 'arts-center',
        'description': description,
    })
    assert hazard_resp.status_code == 200, hazard_resp.text

    after = client.get('/auth/overview')
    assert after.status_code == 200
    assert after.json()['report_count'] == reports_before + 1
