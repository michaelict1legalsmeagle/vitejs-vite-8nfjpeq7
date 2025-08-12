from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from datetime import date, timedelta

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace with your domain for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_json(url: str):
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()

@app.get("/health")
async def health():
    return {"ok": True}

# GEO
@app.get("/geo/postcode/{pc}")
async def geo_postcode(pc: str):
    try:
        data = await get_json(f"https://api.postcodes.io/postcodes/{pc}")
        res = data["result"]
        return {
            "postcode": res["postcode"],
            "lat": res["latitude"],
            "lng": res["longitude"],
            "outcode": res["outcode"],
            "admin_district": res["admin_district"],
            "lsoa": res["lsoa"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# POLICE
@app.get("/police/crime")
async def police_crime(postcode: str, months: int = Query(3, ge=1, le=12)):
    try:
        geo = await get_json(f"https://api.postcodes.io/postcodes/{postcode}")
        lat = geo["result"]["latitude"]; lng = geo["result"]["longitude"]
        dates = await get_json("https://data.police.uk/api/crimes-street-dates")
        latest = dates[0]["date"]

        y, m = map(int, latest.split("-"))
        months_list = []
        for i in range(months):
            d = date(y, m, 1)
            # move back i months
            months_list.append(f"{(d.replace(day=1) - timedelta(days=30*i)).strftime('%Y-%m')}")
        all_crimes = []
        async with httpx.AsyncClient(timeout=60) as client:
            for dstr in months_list:
                url = f"https://data.police.uk/api/crimes-street/all-crime?lat={lat}&lng={lng}&date={dstr}"
                r = await client.get(url); r.raise_for_status()
                all_crimes.extend(r.json())
        by_cat = {}
        for c in all_crimes:
            cat = c.get("category", "unknown"); by_cat[cat] = by_cat.get(cat, 0) + 1
        return { "centre": { "lat": lat, "lng": lng, "postcode": geo["result"]["postcode"] },
                 "months": months, "total": len(all_crimes), "byCategory": by_cat }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# FLOOD
async def flood_areas(lat: float, lng: float, dist: int):
    return (await get_json(f"https://environment.data.gov.uk/flood-monitoring/id/floodAreas?lat={lat}&long={lng}&dist={dist}")).get("items", [])
async def flood_stations(lat: float, lng: float, dist: int):
    return (await get_json(f"https://environment.data.gov.uk/flood-monitoring/id/stations?lat={lat}&long={lng}&dist={dist}")).get("items", [])
async def flood_warnings():
    return (await get_json("https://environment.data.gov.uk/flood-monitoring/id/floods")).get("items", [])

@app.get("/flood/summary")
async def flood_summary(postcode: str | None = None, lat: float | None = None, lng: float | None = None, dist: int = 10):
    try:
        if postcode:
            geo = await get_json(f"https://api.postcodes.io/postcodes/{postcode}")
            lat = geo["result"]["latitude"]; lng = geo["result"]["longitude"]
        if lat is None or lng is None:
            raise HTTPException(status_code=400, detail="postcode or lat,lng required")

        areas, stations, warns = await flood_areas(lat, lng, dist), await flood_stations(lat, lng, dist), await flood_warnings()
        area_codes = { a.get("notation") or a.get("code") or a.get("fwdCode") or a.get("id") for a in areas if a }
        nearby = [w for w in warns if w.get("floodAreaID") in area_codes]

        risk = "Very Low"
        if any(w.get("severity") == 1 for w in nearby): risk = "High"
        elif any(w.get("severity") == 2 for w in nearby): risk = "Medium"
        elif any(w.get("severity") == 3 for w in nearby): risk = "Low"
        elif len(areas) > 0: risk = "Low"

        return { "centre": { "lat": lat, "lng": lng }, "areasCount": len(areas), "stationsCount": len(stations),
                 "activeWarnings": len(nearby), "risk": risk, "areas": areas, "stations": stations, "warnings": nearby }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# LAND REGISTRY SPARQL
async def lr_query(query: str):
    headers = { "content-type": "application/x-www-form-urlencoded", "accept": "application/sparql-results+json" }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post("http://landregistry.data.gov.uk/landregistry/query", data={ "query": query }, headers=headers)
        r.raise_for_status()
        return r.json()

@app.get("/lr/ppd")
async def lr_ppd(postcode: str, months: int = 12, limit: int = 200):
    try:
        from datetime import datetime
        months = min(24, max(1, months))
        d = datetime.utcnow()
        y = d.year; m = d.month - months
        while m <= 0: y -= 1; m += 12
        since = f"{y}-{m:02d}-01"
        pc = postcode.upper().replace("  ", " ").strip()

        q = f"""
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
SELECT ?paon ?street ?town ?postcode ?amount ?date
WHERE {{
  ?tx a lrppi:TransactionRecord ;
      lrppi:pricePaid ?amount ;
      lrppi:transactionDate ?date ;
      lrppi:propertyAddress ?addr .
  ?addr lrcommon:postcode ?postcode .
  OPTIONAL {{ ?addr lrcommon:paon ?paon . }}
  OPTIONAL {{ ?addr lrcommon:street ?street . }}
  OPTIONAL {{ ?addr lrcommon:town ?town . }}
  FILTER (UCASE(STR(?postcode)) = "{pc}")
  FILTER (?date >= "{since}"^^xsd:date)
}}
ORDER BY DESC(?date)
LIMIT {min(500, max(1, limit))}
""".strip()

        data = await lr_query(q)
        rows = [{
            "paon": b.get("paon", {}).get("value"),
            "street": b.get("street", {}).get("value"),
            "town": b.get("town", {}).get("value"),
            "postcode": b.get("postcode", {}).get("value", pc),
            "amount": float(b.get("amount", {}).get("value", 0)),
            "date": b.get("date", {}).get("value"),
        } for b in data.get("results", {}).get("bindings", [])]

        # median over last 12m
        from statistics import median
        from datetime import timedelta
        cutoff = d.replace(day=1) - timedelta(days=365)
        recent = [r for r in rows if r["date"] and datetime.fromisoformat(r["date"]) >= cutoff]
        med = median([r["amount"] for r in recent]) if recent else None

        return { "count": len(rows), "medianLast12m": med, "recentCount12m": len(recent), "transactions": rows }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
