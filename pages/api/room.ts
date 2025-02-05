import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const roomId = Math.random().toString(36).substring(7);
    return res.status(200).json({ roomId });
  }

  if (req.method === 'GET') {
    const { roomId } = req.query;
    return res.status(200).json({ exists: true });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
