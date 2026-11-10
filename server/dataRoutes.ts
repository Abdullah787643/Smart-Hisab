import { Router, Response } from 'express';
import { db } from './db.js';
import { AuthRequest, authMiddleware } from './middleware.js';

export const dataRouter = Router();

// Protect all data routes
dataRouter.use(authMiddleware);

// 1. Sync / Fetch all user data
dataRouter.get('/sync', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const rawTxs = db
      .prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
      .all(userId) as any[];

    const transactions = rawTxs.map((t) => ({
      id: t.id,
      userId: t.user_id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      time: t.time || undefined,
      description: t.description || undefined,
      source: t.source || undefined,
      whereSpent: t.where_spent || undefined,
      whySpent: t.why_spent || undefined,
      paymentMethod: t.payment_method || undefined,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    const rawDebts = db
      .prepare('SELECT * FROM debts WHERE user_id = ? ORDER BY start_date DESC, created_at DESC')
      .all(userId) as any[];

    const rawPayments = db
      .prepare('SELECT * FROM debt_payments WHERE user_id = ? ORDER BY date ASC, created_at ASC')
      .all(userId) as any[];

    const paymentsByDebt: Record<string, any[]> = {};
    for (const p of rawPayments) {
      if (!paymentsByDebt[p.debt_id]) {
        paymentsByDebt[p.debt_id] = [];
      }
      paymentsByDebt[p.debt_id].push({
        id: p.id,
        debtId: p.debt_id,
        userId: p.user_id,
        amount: p.amount,
        date: p.date,
        time: p.time || undefined,
        note: p.note || undefined,
        paymentMethod: p.payment_method || undefined,
        createdAt: p.created_at,
      });
    }

    const debts = rawDebts.map((d) => ({
      id: d.id,
      userId: d.user_id,
      type: d.type,
      personName: d.person_name,
      personPhone: d.person_phone || undefined,
      totalAmount: d.total_amount,
      startDate: d.start_date,
      dueDate: d.due_date || undefined,
      status: d.status,
      notes: d.notes || undefined,
      payments: paymentsByDebt[d.id] || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    // Fetch user settings
    const rawSettings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;
    const settings = rawSettings
      ? {
          language: rawSettings.language,
          currency: rawSettings.currency,
          theme: rawSettings.theme,
          bengaliDigits: Boolean(rawSettings.bengali_digits),
        }
      : null;

    res.json({
      success: true,
      data: {
        transactions,
        debts,
        settings,
      },
    });
  } catch (err: any) {
    console.error('Error fetching data sync:', err);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// 1b. Update User Settings
dataRouter.put('/settings', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { language, currency, theme, bengaliDigits } = req.body;

    db.prepare(`
      INSERT INTO user_settings (user_id, language, currency, theme, bengali_digits, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        language = COALESCE(excluded.language, user_settings.language),
        currency = COALESCE(excluded.currency, user_settings.currency),
        theme = COALESCE(excluded.theme, user_settings.theme),
        bengali_digits = COALESCE(excluded.bengali_digits, user_settings.bengali_digits),
        updated_at = excluded.updated_at
    `).run(
      userId,
      language || 'en',
      currency || 'BDT',
      theme || 'light',
      bengaliDigits ? 1 : 0,
      Date.now()
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error saving user settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// 2. Add or Upsert Transaction
dataRouter.post('/transactions', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      id,
      type,
      amount,
      category,
      date,
      time,
      description,
      source,
      whereSpent,
      whySpent,
      paymentMethod,
    } = req.body;

    const txId = id || 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const now = Date.now();

    db.prepare(`
      INSERT INTO transactions (id, user_id, type, amount, category, date, time, description, source, where_spent, why_spent, payment_method, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        amount = excluded.amount,
        category = excluded.category,
        date = excluded.date,
        time = excluded.time,
        description = excluded.description,
        source = excluded.source,
        where_spent = excluded.where_spent,
        why_spent = excluded.why_spent,
        payment_method = excluded.payment_method,
        updated_at = excluded.updated_at
      WHERE user_id = excluded.user_id
    `).run(
      txId,
      userId,
      type,
      Number(amount) || 0,
      category,
      date,
      time || null,
      description || null,
      source || null,
      whereSpent || null,
      whySpent || null,
      paymentMethod || null,
      now,
      now
    );

    res.json({ success: true, id: txId });
  } catch (err: any) {
    console.error('Error saving transaction:', err);
    res.status(500).json({ error: 'Failed to save transaction' });
  }
});

// 3. Update Transaction
dataRouter.put('/transactions/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      type,
      amount,
      category,
      date,
      time,
      description,
      source,
      whereSpent,
      whySpent,
      paymentMethod,
    } = req.body;

    db.prepare(`
      UPDATE transactions SET
        type = ?,
        amount = ?,
        category = ?,
        date = ?,
        time = ?,
        description = ?,
        source = ?,
        where_spent = ?,
        why_spent = ?,
        payment_method = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      type,
      Number(amount) || 0,
      category,
      date,
      time || null,
      description || null,
      source || null,
      whereSpent || null,
      whySpent || null,
      paymentMethod || null,
      Date.now(),
      id,
      userId
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// 4. Delete Transaction
dataRouter.delete('/transactions/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// 5. Add or Upsert Debt
dataRouter.post('/debts', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, type, personName, personPhone, totalAmount, startDate, dueDate, status, notes } = req.body;

    const debtId = id || 'debt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const now = Date.now();

    db.prepare(`
      INSERT INTO debts (id, user_id, type, person_name, person_phone, total_amount, start_date, due_date, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type,
        person_name = excluded.person_name,
        person_phone = excluded.person_phone,
        total_amount = excluded.total_amount,
        start_date = excluded.start_date,
        due_date = excluded.due_date,
        status = excluded.status,
        notes = excluded.notes,
        updated_at = excluded.updated_at
      WHERE user_id = excluded.user_id
    `).run(
      debtId,
      userId,
      type,
      personName,
      personPhone || null,
      Number(totalAmount) || 0,
      startDate,
      dueDate || null,
      status || 'pending',
      notes || null,
      now,
      now
    );

    res.json({ success: true, id: debtId });
  } catch (err: any) {
    console.error('Error saving debt:', err);
    res.status(500).json({ error: 'Failed to save debt' });
  }
});

// 6. Update Debt
dataRouter.put('/debts/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { type, personName, personPhone, totalAmount, startDate, dueDate, status, notes } = req.body;

    db.prepare(`
      UPDATE debts SET
        type = ?,
        person_name = ?,
        person_phone = ?,
        total_amount = ?,
        start_date = ?,
        due_date = ?,
        status = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      type,
      personName,
      personPhone || null,
      Number(totalAmount) || 0,
      startDate,
      dueDate || null,
      status || 'pending',
      notes || null,
      Date.now(),
      id,
      userId
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating debt:', err);
    res.status(500).json({ error: 'Failed to update debt' });
  }
});

// 7. Delete Debt
dataRouter.delete('/debts/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    db.prepare('DELETE FROM debts WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting debt:', err);
    res.status(500).json({ error: 'Failed to delete debt' });
  }
});

// 8. Record Debt Payment
dataRouter.post('/debts/:id/payments', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: debtId } = req.params;
    const { id: paymentId, amount, date, time, note, paymentMethod } = req.body;

    const payId = paymentId || 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = Date.now();

    db.prepare(`
      INSERT INTO debt_payments (id, debt_id, user_id, amount, date, time, note, payment_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        amount = excluded.amount,
        date = excluded.date,
        time = excluded.time,
        note = excluded.note,
        payment_method = excluded.payment_method
    `).run(
      payId,
      debtId,
      userId,
      Number(amount) || 0,
      date,
      time || null,
      note || null,
      paymentMethod || 'cash',
      now
    );

    // Recompute debt status
    const debt = db.prepare('SELECT total_amount FROM debts WHERE id = ? AND user_id = ?').get(debtId, userId) as
      | { total_amount: number }
      | undefined;

    if (debt) {
      const sumResult = db
        .prepare('SELECT SUM(amount) as paid FROM debt_payments WHERE debt_id = ? AND user_id = ?')
        .get(debtId, userId) as { paid: number } | undefined;

      const totalPaid = sumResult?.paid || 0;
      const isSettled = totalPaid >= debt.total_amount;
      const newStatus = isSettled ? 'settled' : totalPaid > 0 ? 'partial' : 'pending';

      db.prepare('UPDATE debts SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
        newStatus,
        now,
        debtId,
        userId
      );
    }

    res.json({ success: true, id: payId });
  } catch (err: any) {
    console.error('Error recording debt payment:', err);
    res.status(500).json({ error: 'Failed to record debt payment' });
  }
});

// 9. Delete Debt Payment
dataRouter.delete('/debts/:id/payments/:paymentId', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: debtId, paymentId } = req.params;

    db.prepare('DELETE FROM debt_payments WHERE id = ? AND debt_id = ? AND user_id = ?').run(
      paymentId,
      debtId,
      userId
    );

    // Recompute debt status
    const debt = db.prepare('SELECT total_amount FROM debts WHERE id = ? AND user_id = ?').get(debtId, userId) as
      | { total_amount: number }
      | undefined;

    if (debt) {
      const sumResult = db
        .prepare('SELECT SUM(amount) as paid FROM debt_payments WHERE debt_id = ? AND user_id = ?')
        .get(debtId, userId) as { paid: number } | undefined;

      const totalPaid = sumResult?.paid || 0;
      const isSettled = totalPaid >= debt.total_amount;
      const newStatus = isSettled ? 'settled' : totalPaid > 0 ? 'partial' : 'pending';

      db.prepare('UPDATE debts SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
        newStatus,
        Date.now(),
        debtId,
        userId
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting payment:', err);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// 10. Clear All User Data
dataRouter.delete('/all', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM debt_payments WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM debts WHERE user_id = ?').run(userId);

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error clearing data:', err);
    res.status(500).json({ error: 'Failed to clear user data' });
  }
});
