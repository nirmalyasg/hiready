import { Router } from 'express';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, company, phone, teamSize, message, source } = req.body;

    if (!name || !email || !company) {
      return res.status(400).json({ success: false, message: 'Name, email, and company are required' });
    }

    await db.execute(sql`
      INSERT INTO leads (name, email, company, phone, team_size, message, source, created_at)
      VALUES (${name}, ${email}, ${company}, ${phone || null}, ${teamSize || null}, ${message || null}, ${source || 'website'}, NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = ${name},
        company = ${company},
        phone = COALESCE(${phone || null}, leads.phone),
        team_size = COALESCE(${teamSize || null}, leads.team_size),
        message = COALESCE(${message || null}, leads.message),
        source = ${source || 'website'},
        updated_at = NOW()
    `);

    res.json({ success: true, message: 'Lead captured successfully' });
  } catch (error: any) {
    console.error('Error capturing lead:', error);
    if (error.message?.includes('relation "leads" does not exist')) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          company VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          team_size VARCHAR(50),
          message TEXT,
          source VARCHAR(50) DEFAULT 'website',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      const { name, email, company, phone, teamSize, message, source } = req.body;
      await db.execute(sql`
        INSERT INTO leads (name, email, company, phone, team_size, message, source)
        VALUES (${name}, ${email}, ${company}, ${phone || null}, ${teamSize || null}, ${message || null}, ${source || 'website'})
      `);
      
      return res.json({ success: true, message: 'Lead captured successfully' });
    }
    res.status(500).json({ success: false, message: 'Failed to capture lead' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.execute(sql`SELECT * FROM leads ORDER BY created_at DESC`);
    res.json({ success: true, leads: result.rows });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
});

export default router;
