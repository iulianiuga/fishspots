# Fishability Scoring Service

Batch‑scores a list of (lat, lon) fishing spots using weather‑derived features and simple habitat/time heuristics.

## Endpoints

- `POST /score` — Body:
```json
{
  "items": [
    { "lat": 44.18, "lon": 28.65, "species": "carp", "context": "lake" },
    { "lat": 45.43, "lon": 28.06, "species": "zander", "context": "river", "flow": 3200, "flow_med": 2800 }
  ]
}
```
Response:
```json
{
  "results": [
    {
      "lat": 44.18, "lon": 28.65, "dt_iso": "2025-09-09T10:00:00+00:00",
      "species": "carp", "context": "lake", "score": 71,
      "subscores": {"WATER": 0.68, "WEATHER": 0.73, "TIME": 0.81, "HABITAT": 0.70},
      "inputs_used": { "...": "..." },
      "notes": ["No water temperature provided; estimated from air temp (72h)."]
    }
  ]
}
```

## Run local

```bash
pip install -r requirements.txt
uvicorn fishability_service:app --host 0.0.0.0 --port 8000 --reload
```

## Docker

```bash
docker build -t fishability:dev .
docker run --rm -p 8000:8000 fishability:dev
```

## Notes

- Weather data via Open‑Meteo; water temperature is estimated from last 72h air temp unless you pass `water_temp`.
- For rivers, pass `flow` and `flow_med` when you have a gauge; otherwise a neutral 0.5 is used.
- For sea, tide/swell are **not** implemented in this minimal service; you can wire a tide provider and inject a `tide_speed_score` into `weather` if needed.
- Habitat defaults to `0.7` but can be provided per point to encode static GIS knowledge of the spot.
