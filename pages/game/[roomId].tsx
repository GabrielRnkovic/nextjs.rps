import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import GameBoard from '../../components/GameBoard';

export default function GameRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetch(`/api/room?roomId=${roomId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.exists) {
            router.push('/');
          } else {
            setIsValid(true);
          }
        });
    }
  }, [roomId]);

  if (!isValid) return <div>Loading...</div>;

  return (
    <GameBoard 
      mode="friend" 
      roomId={roomId as string}
      onBack={() => router.push('/')}
    />
  );
}
