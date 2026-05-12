from fastapi.testclient import TestClient


def test_task_crud_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_payload = {
        "title": "Ship TaskFlow MVP",
        "description": "Implement core APIs",
        "status": "todo",
        "priority": "high",
        "estimated_minutes": 120,
    }

    create_res = client.post("/api/v1/tasks", json=create_payload, headers=auth_headers)
    assert create_res.status_code == 201
    task = create_res.json()
    task_id = task["id"]
    assert task["title"] == "Ship TaskFlow MVP"

    list_res = client.get("/api/v1/tasks", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    get_res = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["priority"] == "high"

    update_res = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "in_progress", "priority": "medium"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "in_progress"
    assert updated["priority"] == "medium"

    delete_res = client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert delete_res.status_code == 204



def test_tasks_require_auth(client: TestClient) -> None:
    res = client.get("/api/v1/tasks")
    assert res.status_code == 401
