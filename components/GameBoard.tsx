import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/GameBoard.module.css';

type Choice = 'rock' | 'paper' | 'scissors';
type GameMode = 'bot' | 'multiplayer' | 'friend';

interface Props {
  mode: GameMode;
  onBack: () => void;
  roomId?: string;
}

const choices: Record<Choice, string> = {
  rock: '/images/rock.png',
  paper: '/images/paper.png',
  scissors: '/images/scissors.png'
};

export default function GameBoard({ mode, onBack, roomId }: Props) {
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (mode === 'friend' && roomId) {
      const newSocket = io();
      setSocket(newSocket);

      newSocket.emit('joinRoom', roomId);

      newSocket.on('gameReady', () => {
        setIsGameReady(true);
      });

      newSocket.on('gameResult', (moves: Record<string, Choice>) => {
        const opponentMove = Object.values(moves).find(
          move => move !== playerChoice
        );
        if (opponentMove) {
          setOpponentChoice(opponentMove);
          const result = determineWinner(playerChoice!, opponentMove);
          setResult(result);
          updateScore(result);
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [mode, roomId]);

  const updateScore = (result: string) => {
    if (result === 'You win!') {
      setScore(prev => {
        const newScore = { ...prev, player: prev.player + 1 };
        checkGameOver(newScore);
        return newScore;
      });
    } else if (result === 'You lose!') {
      setScore(prev => {
        const newScore = { ...prev, opponent: prev.opponent + 1 };
        checkGameOver(newScore);
        return newScore;
      });
    }
  };

  const checkGameOver = (newScore: { player: number; opponent: number }) => {
    if (newScore.player === 2 || newScore.opponent === 2) {
      setGameOver(true);
    } else {
      setRoundNumber(prev => prev + 1);
    }
  };

  const resetGame = () => {
    setScore({ player: 0, opponent: 0 });
    setPlayerChoice(null);
    setOpponentChoice(null);
    setResult('');
    setRoundNumber(1);
    setGameOver(false);
  };

  const makeChoice = async (choice: Choice) => {
    setIsAnimating(true);
    setPlayerChoice(choice);

    if (mode === 'friend' && socket && roomId) {
      socket.emit('makeMove', { roomId, choice });
      setResult('Waiting for opponent...');
    } else if (mode === 'bot') {
      const botChoice = getBotChoice();
      setOpponentChoice(botChoice);
      const result = determineWinner(choice, botChoice);
      setResult(result);
      updateScore(result);
    } else {
      const response = await fetch('/api/play', {
        method: 'POST',
        body: JSON.stringify({ choice })
      });
      const data = await response.json();
      setOpponentChoice(data.opponentChoice);
      setResult(determineWinner(choice, data.opponentChoice));
    }
    
    setIsAnimating(false);
  };

  const getBotChoice = (): Choice => {
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const determineWinner = (player: Choice, opponent: Choice): string => {
    if (player === opponent) return "It's a tie!";
    if (
      (player === 'rock' && opponent === 'scissors') ||
      (player === 'paper' && opponent === 'rock') ||
      (player === 'scissors' && opponent === 'paper')
    ) {
      return 'You win!';
    }
    return 'You lose!';
  };

  if (mode === 'friend' && !isGameReady) {
    return (
      <div className={styles.gameBoard}>
        <h2>Waiting for opponent to join...</h2>
        <p>Share the link with your friend to start playing</p>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.gameBoard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <motion.button 
        className={styles.backButton}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
      >
        ← Back
      </motion.button>

      <motion.div 
        className={styles.score}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className={styles.scoreBox}>
          <span>You</span>
          <motion.span
            key={score.player}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
          >
            {score.player}
          </motion.span>
        </div>
        <div className={styles.scoreBox}>
          <span>Opponent</span>
          <motion.span
            key={score.opponent}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
          >
            {score.opponent}
          </motion.span>
        </div>
        <div className={styles.roundInfo}>
          <span>Round {roundNumber}/3</span>
          {gameOver && (
            <span className={styles.gameOverText}>
              {score.player > score.opponent ? 'You Won the Game!' : 'Game Over!'}
            </span>
          )}
        </div>
      </motion.div>

      {!gameOver ? (
        <div className={styles.choices}>
          {Object.entries(choices).map(([choice, image], index) => (
            <motion.button
              key={choice}
              className={styles.choiceButton}
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => makeChoice(choice as Choice)}
              disabled={!!playerChoice || isAnimating}
            >
              <Image
                src={image}
                alt={choice}
                width={60}
                height={60}
                priority
              />
              <span className={styles.choiceLabel}>
                {choice.charAt(0).toUpperCase() + choice.slice(1)}
              </span>
            </motion.button>
          ))}
        </div>
      ) : (
        <motion.div
          className={styles.gameOverScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className={styles.heading}>
            {score.player > score.opponent 
              ? '🎉 Congratulations! You Won! 🎉' 
              : '😔 Better Luck Next Time! 😔'}
          </h2>
          <p className={styles.finalScore}>
            Final Score: {score.player} - {score.opponent}
          </p>
          <motion.button
            className={styles.playAgain}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
          >
            Play Again
          </motion.button>
        </motion.div>
      )}

      <AnimatePresence>
        {playerChoice && (
          <motion.div 
            className={styles.result}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className={styles.battleArea}>
              <motion.div 
                className={styles.playerChoice}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <h3 className={styles.heading}>Your Choice</h3>
                <Image
                  src={choices[playerChoice]}
                  alt={playerChoice}
                  width={100}
                  height={100}
                />
              </motion.div>

              {opponentChoice ? (
                <>
                  <motion.div 
                    className={styles.versus}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    VS
                  </motion.div>
                  <motion.div 
                    className={styles.opponentChoice}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    <h3 className={styles.heading}>Opponent's Choice</h3>
                    <Image
                      src={choices[opponentChoice]}
                      alt={opponentChoice}
                      width={100}
                      height={100}
                    />
                  </motion.div>
                </>
              ) : (
                <motion.div 
                  className={styles.waiting}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  Waiting...
                </motion.div>
              )}
            </div>
            
            <motion.p 
              className={styles.resultText}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {result}
            </motion.p>

            <motion.button
              className={styles.playAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setPlayerChoice(null);
                setOpponentChoice(null);
                setResult('');
              }}
            >
              Play Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
