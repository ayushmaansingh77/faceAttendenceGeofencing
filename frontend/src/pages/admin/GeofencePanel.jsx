import { useEffect, useMemo, useState } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { createZone, deleteZone, listZones, updateZone } from "../../api.js";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import FormField from "../../components/ui/FormField.jsx";
import { useToast } from "../../components/ui/Toast.jsx";

// Vite doesn't resolve Leaflet's default marker icon URLs (baked in as
// relative paths in leaflet's own CSS/JS) the way a plain webpack/CRA setup
// does — this is the standard fix: point the default icon at the
// Vite-bundled asset URLs directly.
L.Marker.prototype.options.icon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER = [28.6139, 77.209]; // New Delhi, just a fallback map center
const MAP_HEIGHT = 420;

const emptyForm = { name: "", center_lat: "", center_lng: "", radius_meters: 100, is_active: true };

function ClickToSetCenter({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
}

export default function GeofencePanel() {
  const { showToast } = useToast();
  const [zones, setZones] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  async function refresh() {
    const data = await listZones();
    if (!data.ok) {
      setError(data.error || "Failed to load zones.");
      return;
    }
    setError("");
    setZones(data.zones || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  const mapCenter = useMemo(() => {
    if (form.center_lat !== "" && form.center_lng !== "" && !Number.isNaN(Number(form.center_lat)) && !Number.isNaN(Number(form.center_lng))) {
      return [Number(form.center_lat), Number(form.center_lng)];
    }
    if (zones.length > 0) {
      return [zones[0].center_lat, zones[0].center_lng];
    }
    return DEFAULT_CENTER;
  }, [form.center_lat, form.center_lng, zones]);

  function setCenter(lat, lng) {
    setForm((f) => ({ ...f, center_lat: lat, center_lng: lng }));
  }

  // Nominatim (OpenStreetMap's geocoder) — free, no key. Its usage policy
  // forbids autocomplete-style per-keystroke requests, so search runs only on
  // submit (Enter / Search button).
  async function onSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`Search failed (${res.status}).`);
      const results = await res.json();
      if (results.length === 0) setSearchError("No locations found. Try a more specific name.");
      setSearchResults(results);
    } catch (err) {
      setSearchError(err.message || "Search failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  function pickSearchResult(r) {
    setCenter(Number(r.lat), Number(r.lon));
    setSearchResults([]);
    setSearchQuery(r.display_name);
  }

  function startEdit(zone) {
    setEditingId(zone.id);
    setForm({
      name: zone.name,
      center_lat: zone.center_lat,
      center_lng: zone.center_lng,
      radius_meters: zone.radius_meters,
      is_active: zone.is_active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      center_lat: Number(form.center_lat),
      center_lng: Number(form.center_lng),
      radius_meters: Number(form.radius_meters),
      is_active: !!form.is_active,
    };

    if (!payload.name || Number.isNaN(payload.center_lat) || Number.isNaN(payload.center_lng) || !payload.radius_meters) {
      setError("Fill in a name, a center point (click the map or type lat/lng), and a radius.");
      return;
    }

    setSaving(true);
    const data = editingId ? await updateZone(editingId, payload) : await createZone(payload);
    setSaving(false);
    if (!data.ok) {
      setError(data.error || "Failed to save zone.");
      return;
    }
    showToast(editingId ? `${data.zone.name} updated.` : `${data.zone.name} created.`, "ok");
    cancelEdit();
    refresh();
  }

  async function onDelete(zoneId, zoneName) {
    if (!window.confirm("Delete this zone?")) return;
    await deleteZone(zoneId);
    showToast(`${zoneName} deleted.`, "ok");
    if (editingId === zoneId) cancelEdit();
    refresh();
  }

  return (
    <>
      <h1>Geofencing</h1>
      <p className="sub">
        Zones employees can check in/out from. Distance is checked with the Haversine formula against each active
        zone's radius. Map tiles are OpenStreetMap — no API key or billing account needed.
      </p>

      <Card style={{ marginBottom: 24 }}>
        <form onSubmit={onSearch} className="row" style={{ marginBottom: 8 }}>
          <input
            type="search"
            aria-label="Search for a location"
            placeholder="Search a place or address…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <Button type="submit" loading={searching}>Search</Button>
        </form>
        {searchError && <div className="result bad" style={{ marginBottom: 8 }}>{searchError}</div>}
        {searchResults.length > 0 && (
          <ul style={{ listStyle: "none", margin: "0 0 8px", padding: 0 }}>
            {searchResults.map((r) => (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => pickSearchResult(r)}
                  style={{ width: "100%", textAlign: "left", padding: "8px 10px", cursor: "pointer" }}
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ width: "100%", height: MAP_HEIGHT, borderRadius: 8 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToSetCenter onClick={setCenter} />
          <RecenterMap center={mapCenter} zoom={14} />
          {zones.map((z) => (
            <Circle
              key={z.id}
              center={[z.center_lat, z.center_lng]}
              radius={z.radius_meters}
              pathOptions={{
                color: z.is_active ? "#35c17a" : "#9aa0ac",
                fillColor: z.is_active ? "#35c17a" : "#9aa0ac",
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
          ))}
          {form.center_lat !== "" && form.center_lng !== "" && (
            <Marker position={[Number(form.center_lat), Number(form.center_lng)]} />
          )}
        </MapContainer>
        <p className="sub" style={{ marginTop: 8 }}>Search for a place or click the map to set the new/edited zone's center.</p>
      </Card>

      <Card style={{ maxWidth: 480, marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: "1.1rem" }}>{editingId ? "Edit Zone" : "New Zone"}</h2>
        <form onSubmit={onSubmit}>
          <FormField label="Zone name">
            <input
              type="text"
              placeholder="e.g. Main Office"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </FormField>
          <div className="row">
            <FormField label="Center latitude">
              <input
                type="number"
                step="any"
                value={form.center_lat}
                onChange={(e) => setForm({ ...form, center_lat: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Center longitude">
              <input
                type="number"
                step="any"
                value={form.center_lng}
                onChange={(e) => setForm({ ...form, center_lng: e.target.value })}
                required
              />
            </FormField>
          </div>
          <FormField label="Radius (meters)">
            <input
              type="number"
              step="any"
              value={form.radius_meters}
              onChange={(e) => setForm({ ...form, radius_meters: e.target.value })}
              required
            />
          </FormField>
          <label>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              style={{ width: "auto", marginRight: 8 }}
            />
            Active
          </label>
          <div className="row" style={{ marginTop: 12 }}>
            <Button type="submit" loading={saving}>{editingId ? "Save Changes" : "Create Zone"}</Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
          {error && <div className="result bad">{error}</div>}
        </form>
      </Card>

      <Card>
        {zones.length === 0 ? (
          <p className="sub">No zones yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Center</th>
                <th>Radius (m)</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id}>
                  <td>{z.name}</td>
                  <td>{z.center_lat.toFixed(5)}, {z.center_lng.toFixed(5)}</td>
                  <td>{z.radius_meters}</td>
                  <td>
                    <Badge tone={z.is_active ? "ok" : "bad"}>
                      {z.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td>
                    <div className="row">
                      <Button variant="secondary" onClick={() => startEdit(z)}>Edit</Button>
                      <Button variant="danger" onClick={() => onDelete(z.id, z.name)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
