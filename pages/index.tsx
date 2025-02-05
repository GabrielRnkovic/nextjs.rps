import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import GameBoard from '../components/GameBoard';
import GameMode from '../components/GameMode';

export default function Home() {
  const [gameMode, setGameMode] = useState<'bot' | 'multiplayer' | null>(null);

  return (
    <div className={styles.container}>
      <Head>
        <title>Rock Paper Scissors</title>
        <meta name="description" content="Play Rock Paper Scissors online" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Rock Paper Scissors</h1>
        
        {!gameMode ? (
          <GameMode onSelect={setGameMode} />
        ) : (
          <GameBoard 
            mode={gameMode} 
            onBack={() => setGameMode(null)}
          />
        )}
      </main>
    </div>
  );
}
