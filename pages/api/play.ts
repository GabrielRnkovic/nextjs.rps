import type { NextApiRequest, NextApiResponse } from 'next';

type Choice = 'rock' | 'paper' | 'scissors';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const choices: Choice[] = ['rock', 'paper', 'scissors'];
  const opponentChoice = choices[Math.floor(Math.random() * choices.length)];

  res.status(200).json({ opponentChoice });
}
