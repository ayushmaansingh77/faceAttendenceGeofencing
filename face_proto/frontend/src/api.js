const TOKEN_KEY = "token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(path, { headers, ...options });

    if (res.status === 401) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return res.json();
  } catch {
    // Network error (backend unreachable) — return null so callers can handle gracefully
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signup(name, email, password) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function getMe() {
  return request("/api/auth/me");
}

// ---------------------------------------------------------------------------
// Admin: employees
// ---------------------------------------------------------------------------
export function listEmployees() {
  return request("/api/admin/employees");
}

export function createEmployee(name, email, password) {
  return request("/api/admin/employees", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function setEmployeeActive(employeeId, isActive) {
  return request(`/api/admin/employees/${employeeId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function deleteEmployee(employeeId) {
  return request(`/api/admin/employees/${employeeId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Admin: geofence zones
// ---------------------------------------------------------------------------
export function listZones() {
  return request("/api/admin/geofence-zones");
}

export function createZone(zone) {
  return request("/api/admin/geofence-zones", {
    method: "POST",
    body: JSON.stringify(zone),
  });
}

export function updateZone(zoneId, updates) {
  return request(`/api/admin/geofence-zones/${zoneId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function deleteZone(zoneId) {
  return request(`/api/admin/geofence-zones/${zoneId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Admin: attendance overview
// ---------------------------------------------------------------------------
export function listAllAttendance(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  const qs = params.toString();
  return request(`/api/admin/attendance${qs ? `?${qs}` : ""}`);
}

// ---------------------------------------------------------------------------
// Face enrollment / recognition
// ---------------------------------------------------------------------------
export function enrollFace(image) {
  return request("/api/face/enroll", {
    method: "POST",
    body: JSON.stringify({ image }),
  });
}

export function recognizeFace(image) {
  return request("/api/face/recognize", {
    method: "POST",
    body: JSON.stringify({ image }),
  });
}

// ---------------------------------------------------------------------------
// Attendance (employee)
// ---------------------------------------------------------------------------
export function checkIn(image, lat, lng) {
  return request("/api/attendance/check-in", {
    method: "POST",
    body: JSON.stringify({ image, lat, lng }),
  });
}

export function checkOut(image, lat, lng) {
  return request("/api/attendance/check-out", {
    method: "POST",
    body: JSON.stringify({ image, lat, lng }),
  });
}

export function getMyAttendance() {
  return request("/api/attendance/me");
}
