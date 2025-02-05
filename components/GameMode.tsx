import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/GameMode.module.css';

interface Props {
  onSelect: (mode: 'bot' | 'multiplayer') => void;
}

export default function GameMode({ onSelect }: Props) {
  const router = useRouter();
  const [shareLink, setShareLink] = useState('');

  const createFriendGame = async () => {
    const response = await fetch('/api/room', { method: 'POST' });
    const { roomId } = await response.json();
    const link = `${window.location.origin}/game/${roomId}`;
    setShareLink(link);
  };

  return (
    <div className={styles.modeSelection}>
      <h2>Select Game Mode</h2>
      <button onClick={() => onSelect('bot')}>Play Against Bot</button>
      <button onClick={() => onSelect('multiplayer')}>Play Multiplayer</button>
      <button onClick={createFriendGame}>Play with Friend</button>
      
      {shareLink && (
        <div className={styles.shareLink}>
          <p>Share this link with your friend:</p>
          <input type="text" readOnly value={shareLink} />
          <button onClick={() => navigator.clipboard.writeText(shareLink)}>
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
}
