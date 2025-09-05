import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
app.use(cors());

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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));

