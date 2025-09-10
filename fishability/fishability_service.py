# fishability_service.py (v3 - robust against None values)
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timezone
from dataclasses import dataclass
import math
import requests

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator

app = FastAPI(title="Fishability Scoring Service", version="1.2.0")

def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))

def tri(x: float, left: float, peak: float, right: float) -> float:
    if x is None: return 0.0
    if x <= left or x >= right:
        return 0.0
    return (x - left) / (peak - left) if x < peak else (right - x) / (right - peak)

def bell(x: float, opt: float, tol_low: float, tol_high: float) -> float:
    if x is None: return 0.5
    if x < opt:
        return clamp01(1.0 - ((opt - x) / tol_low) ** 2)
    else:
        return clamp01(1.0 - ((x - opt) / tol_high) ** 2)

SPECIES_TEMP = {
    "trout":  (12.0, 6.0, 6.0),
    "pike":   (14.0, 6.0, 6.0),
    "zander": (15.0, 6.0, 6.0),
    "carp":   (23.0, 6.0, 5.0),
    "catfish":(25.0, 6.0, 5.0),
}

def water_temp_score(t: Optional[float], species: str = "carp") -> float:
    opt, tl, th = SPECIES_TEMP.get(species, SPECIES_TEMP["carp"])
    return bell(t, opt, tl, th)

def pressure_trend_score(dp_h: Optional[float]) -> float:
    if dp_h is None: return 0.6
    return math.exp(- (dp_h / 1.2) ** 2)

def wind_speed_score(ws: Optional[float]) -> float:
    if ws is None: return 0.5
    return tri(ws, 1.0, 4.0, 8.5)

def wind_alignment_score(wdir_deg: Optional[float], shore_az_deg: Optional[float]) -> float:
    w = wdir_deg if wdir_deg is not None else 0.0
    s = shore_az_deg if shore_az_deg is not None else 0.0
    ang = math.radians((w - s) % 360.0)
    co = math.cos(ang)
    return clamp01(0.5 + 0.5 * co)

def cloud_score(cloud_pct: Optional[float], sun_high: bool = True) -> float:
    if cloud_pct is None: return 0.5
    return tri(cloud_pct, 20.0 if sun_high else 0.0, 70.0 if sun_high else 30.0, 100.0 if sun_high else 60.0)

def precip_score(mm_last6h: Optional[float]) -> float:
    if mm_last6h is None: return 0.7
    if mm_last6h <= 0.2: return 1.0
    if mm_last6h <= 2.0: return 0.8
    if mm_last6h <= 8.0: return 0.5
    return 0.2

def river_flow_score(flow: Optional[float], median_flow: Optional[float]) -> float:
    if flow is None or median_flow is None or flow <= 0 or median_flow <= 0:
        return 0.5
    r = flow / median_flow
    return math.exp(- ((r - 1.0) / 0.4) ** 2)

def combine(weights: Dict[str, float], **scores: float) -> float:
    s = 0.0; w = 0.0
    for k, v in weights.items():
        if k in scores and scores[k] is not None:
            s += v * scores[k]; w += v
    return s / w if w > 0 else 0.0

@dataclass
class MeteoFeatures:
    water_temp: Optional[float]
    temp2m_now: Optional[float]
    dp_h: Optional[float]
    wind_ms: Optional[float]
    wind_dir: Optional[float]
    cloud_pct: Optional[float]
    rain_6h: Optional[float]
    is_day: Optional[bool]

def _last_num(arr):
    if not arr: return None
    for v in reversed(arr):
        if isinstance(v, (int, float)): return v
    return None

def _filter_num(arr):
    return [v for v in (arr or []) if isinstance(v, (int, float))]

def fetch_meteo(lat: float, lon: float) -> MeteoFeatures:
    base_url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "timezone": "auto",
        "hourly": ",".join([
            "temperature_2m",
            "surface_pressure",
            "wind_speed_10m",
            "wind_direction_10m",
            "cloud_cover",
            "precipitation",
            "is_day"
        ]),
        "past_hours": 72
    }
    try:
        r = requests.get(base_url, params=params, timeout=15)
        r.raise_for_status()
    except Exception as e:
        raise HTTPException(502, f"Open-Meteo error: {e}")

    data = r.json()
    h = data.get("hourly", {})

    temps = h.get("temperature_2m", []) or []
    surface_p = h.get("surface_pressure", []) or []
    wind_s = h.get("wind_speed_10m", []) or []
    wind_d = h.get("wind_direction_10m", []) or []
    clouds = h.get("cloud_cover", []) or []
    precip = h.get("precipitation", []) or []
    is_day_arr = h.get("is_day", []) or []

    # Water temp estimate from last 72h air temp
    temps_num = _filter_num(temps)
    water_est = None
    if temps_num:
        recent = temps_num[-72:] if len(temps_num) >= 72 else temps_num
        mean_air = sum(recent) / len(recent)
        water_est = max(0.0, min(30.0, 0.8 * mean_air + 1.0))

    # Pressure trend: robust against None by compressing to numeric-only series
    sp = _filter_num(surface_p)
    dp_h = None
    if len(sp) >= 4:
        dp_h = (sp[-1] - sp[-4]) / 3.0
    elif len(sp) >= 2:
        dt = len(sp) - 1
        dp_h = (sp[-1] - sp[0]) / float(dt)

    wind_ms = _last_num(wind_s)
    wind_dir = _last_num(wind_d)
    cloud_pct = _last_num(clouds)
    # sum last 6h precipitation ignoring None
    pr6 = [v for v in precip[-6:] if isinstance(v, (int, float))]
    rain_6h = sum(pr6) if pr6 else None
    is_day = bool(_last_num(is_day_arr)) if is_day_arr else None
    temp2m_now = _last_num(temps)

    return MeteoFeatures(
        water_temp=water_est,
        temp2m_now=temp2m_now,
        dp_h=dp_h,
        wind_ms=wind_ms,
        wind_dir=wind_dir,
        cloud_pct=cloud_pct,
        rain_6h=rain_6h,
        is_day=is_day,
    )

ContextType = Literal["lake", "river", "sea"]

class PointItem(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    dt_iso: Optional[str] = Field(None, description="ISO time; defaults to 'now'")
    species: Optional[str] = Field("carp")
    context: Optional[ContextType] = Field("lake")
    water_temp: Optional[float] = None
    turbidity_score: Optional[float] = None
    shore_az: Optional[float] = Field(0, description="shoreline azimuth in degrees (0..360)")
    flow: Optional[float] = None
    flow_med: Optional[float] = None
    habitat: Optional[float] = Field(0.7, ge=0.0, le=1.0)

    @validator("dt_iso")
    def _valid_dt(cls, v):
        if v is None:
            return v
        try:
            if v.endswith("Z"):
                datetime.fromisoformat(v.replace("Z", "+00:00"))
            else:
                datetime.fromisoformat(v)
            return v
        except Exception:
            raise ValueError("dt_iso must be ISO 8601 string")

class ScoreResult(BaseModel):
    lat: float
    lon: float
    dt_iso: str
    species: str
    context: ContextType
    score: int
    subscores: Dict[str, float]
    inputs_used: Dict[str, Any]
    notes: List[str] = []

class BatchRequest(BaseModel):
    items: List[PointItem]

class BatchResponse(BaseModel):
    results: List[ScoreResult]

def _sun_high(dt: datetime, is_day_flag: Optional[bool]) -> bool:
    if is_day_flag is not None:
        return is_day_flag and (10 <= dt.hour <= 16)
    return 10 <= dt.hour <= 16

def compute_scores_for_item(item: PointItem) -> ScoreResult:
    dt = datetime.now(timezone.utc)
    if item.dt_iso:
        if item.dt_iso.endswith("Z"):
            dt = datetime.fromisoformat(item.dt_iso.replace("Z", "+00:00"))
        else:
            dt = datetime.fromisoformat(item.dt_iso)

    mf = fetch_meteo(item.lat, item.lon)

    water_temp = item.water_temp if item.water_temp is not None else mf.water_temp
    turbidity_score = item.turbidity_score if item.turbidity_score is not None else 0.6

    if item.context == "river":
        water = combine({"temp":0.5,"turbidity":0.2,"debit":0.3},
                        temp=water_temp_score(water_temp, item.species),
                        turbidity=turbidity_score,
                        debit=river_flow_score(item.flow, item.flow_med))
    else:
        water = combine({"temp":0.7,"turbidity":0.3},
                        temp=water_temp_score(water_temp, item.species),
                        turbidity=turbidity_score)

    sun_high = _sun_high(dt, mf.is_day)
    weather_weights = {"press":0.35,"wind":0.35,"align":0.15,"cloud":0.1,"rain":0.05}
    if item.context == "sea":
        weather_weights = {"press":0.2,"wind":0.25,"align":0.15,"cloud":0.1,"rain":0.05,"tide":0.15,"swell":0.1}

    weather = combine(
        weather_weights,
        press=pressure_trend_score(mf.dp_h),
        wind=wind_speed_score(mf.wind_ms),
        align=wind_alignment_score(mf.wind_dir, item.shore_az),
        cloud=cloud_score(mf.cloud_pct, sun_high),
        rain=precip_score(mf.rain_6h),
        tide=None,
        swell=None
    )

    hour = dt.astimezone(timezone.utc).hour
    def crepuscul_score(h: int) -> float:
        s1 = 1.0 - min(abs(h - 6)/3.0, 1.0)
        s2 = 1.0 - min(abs(h - 19)/3.0, 1.0)
        return max(0.0, max(s1, s2))

    time_sub = combine(
        {"crepuscul":0.7,"luna":0.3},
        crepuscul=crepuscul_score(hour),
        luna=0.5
    )

    H = clamp01(item.habitat if item.habitat is not None else 0.7)
    C = combine({"water":0.6,"weather":0.4}, water=water, weather=weather)
    T = clamp01(time_sub)
    a,b,c = 1.0, 1.0, 0.9
    score = round(100 * (H ** a) * (C ** b) * (T ** c))

    subs = {
        "WATER": round(water, 3),
        "WEATHER": round(weather, 3),
        "TIME": round(T, 3),
        "HABITAT": round(H, 3)
    }

    notes = []
    if water_temp is None:
        notes.append("No water temperature provided; estimated from air temp (72h).")
    if item.context == "river" and (item.flow is None or item.flow_med is None):
        notes.append("River flow/median not provided; using neutral 0.5 for debit.")
    if item.context == "sea":
        notes.append("Tide/swell not implemented; consider adding a tide provider.")

    inputs_used = {
        "water_temp_used": water_temp,
        "dp_h": mf.dp_h,
        "wind_ms": mf.wind_ms,
        "wind_dir": mf.wind_dir,
        "cloud_pct": mf.cloud_pct,
        "rain_6h": mf.rain_6h,
        "sun_high": sun_high,
        "turbidity_score": turbidity_score,
        "flow": item.flow,
        "flow_med": item.flow_med,
        "shore_az": item.shore_az,
        "habitat": item.habitat
    }

    return ScoreResult(
        lat=item.lat, lon=item.lon,
        dt_iso=dt.replace(microsecond=0).isoformat(),
        species=item.species or "carp",
        context=item.context or "lake",
        score=score,
        subscores=subs,
        inputs_used=inputs_used,
        notes=notes
    )

@app.post("/score", response_model=BatchResponse)
def score_points(payload: BatchRequest) -> BatchResponse:
    items = payload.items or []
    if len(items) == 0:
        raise HTTPException(400, "No items provided.")
    if len(items) > 200:
        raise HTTPException(413, "Too many items; max 200 per request.")

    results = []
    for it in items:
        try:
            res = compute_scores_for_item(it)
            results.append(res)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(500, f"Scoring failed for point ({it.lat},{it.lon}): {e}")
    return BatchResponse(results=results)

@app.get("/healthz")
def healthz():
    return {"ok": True, "ts": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fishability_service:app", host="0.0.0.0", port=8000, reload=True)
