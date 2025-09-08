import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';



const app = express();
app.use(cors());
app.use(express.json()); 

const pool = new Pool({
  //connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
  connectionString: process.env.DATABASE_URL || 'postgres://gisuser:gispassword@192.168.3.106:5432/fishing'
});

// IMPORTANT: în DB trebuie să existe funcția api.poi_geojson(...) din mesajul anterior
app.get('/api/poi', async (req, res) => {
  const { minlon, minlat, maxlon, maxlat, limit } = req.query;
  const sql = 'SELECT api.poi_geojson($1,$2,$3,$4,$5) AS fc';
  const params = [
    minlon ?? null, minlat ?? null, maxlon ?? null, maxlat ?? null, limit ?? 5000
  ];
  try {
    const { rows } = await pool.query(sql, params);
    res.type('application/geo+json').send(rows[0].fc);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch POI' });
  }
});


// POST: inserează punct și întoarce ID-ul
app.post('/api/poi_insert', async (req, res) => {

  const lat = parseFloat((req.body?.lat ?? req.query.lat) );
  const lon = parseFloat((req.body?.lon ?? req.query.lon) );
  const name = (req.body?.name ?? req.query.name ?? 'Punct nou') ;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat și lon sunt obligatorii și numerice' });
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'Coordonate invalide' });
  }

  try {
    const { rows } = await pool.query('SELECT api.poi_insert($1,$2,$3) AS id', [lat, lon, name]);
    const id = rows[0].id ;
    res.status(201).location(`/api/poi/${id}`).json({ id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to insert POI' });
  }
});


// POST: sterge punct și întoarce ID-ul
app.post('/api/poi_delete', async (req, res) => {
  const id = Number(req.body?.id ?? req.query.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID invalid' });
  }

  try {
    const { rows } = await pool.query('SELECT api.poi_delete($1) AS ok', [id]);
    const ok = rows?.[0]?.ok === true || rows?.[0]?.ok === 't';

    if (ok) {
      return res.status(200).json({ deleted: true, id });
    } else {
      return res.status(404).json({ deleted: false, id, error: 'POI inexistent' });
    }
  } catch (e) {
    // dacă există referințe FK fără CASCADE
    if (e.code === '23503') {
      return res.status(409).json({ error: 'Nu se poate șterge: referințe existente (FK).', id });
    }
    console.error(e);
    return res.status(500).json({ error: 'Eroare la ștergere', id });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));

