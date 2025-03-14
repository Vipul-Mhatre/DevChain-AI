import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get('question');

  const db = new sqlite3.Database("c:\\Users\\Lenovo\\OneDrive\\Desktop\\Json\\server\\flare_knowledge_base.db", sqlite3.OPEN_READONLY);
  const dbGet = promisify(db.get.bind(db));

  try {
    const row = await dbGet(
      `SELECT content FROM web_pages WHERE content LIKE ? LIMIT 1`, 
      [`%${question}%`]
    );

    if (row) {
      return NextResponse.json({ answer: row.content });
    } else {
      const isRelated = /flare|blockchain/i.test(question);
      if (isRelated) {
        return NextResponse.json({ 
          answer: "I'll need to learn more about that specific topic."
        });
      } else {
        return NextResponse.json({ 
          answer: "Please ask something about Flare or blockchain only."
        });
      }
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to process your question" },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
