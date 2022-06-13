import { useEffect, useRef, useState } from 'react';
import React, { Component } from 'react';
import * as Haptics from 'expo-haptics'

import AnimatedLottieView from 'lottie-react-native';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import axios from '../../axios/Axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppSelector, useAppDispatch } from '../../hooks/storeHooks';
import {
  setCurrentGuessIndex,
  setGameWon,
  setSolution,
  setGuesses,
  setUsedKeys,
  setGameEnded,
  setWrongGuessShake,
  setGameStarted,
  setGameLanguage,
} from '../../store/slices/gameStateSlice';
import { guess, matchStatus } from '../../types';
import { HEIGHT, initialGuesses, SIZE } from '../../utils/constants';
import { getStoreData } from '../../utils/localStorageFuncs';
import { answersEN, answersTR, wordsEN, wordsTR } from '../../words';
import GameBoard from './components/gameBoard';

export default function Game() {
  const {
    guesses,
    usedKeys,
    currentGuessIndex,
    gameStarted,
    gameEnded,
    gameWon,
    solution,
    gameLanguage,
  } = useAppSelector((state) => state.gameState);
  const dispatch = useAppDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [wordType, setWordType] = useState('');
  const [wordDesperate, setWordDesperate] = useState('');
  (async () => {
    const gameLanguage = (await getStoreData('language')) || 'en';
    dispatch(setGameLanguage(gameLanguage));
  })();

  const lottieRef = useRef<AnimatedLottieView>(null);

  //changing keyboard language

  const wordList = () => {
    switch (gameLanguage) {
      case 'en':
        return wordsEN.concat(answersEN);
      case 'tr':
        return wordsTR.concat(answersTR);
      default:
        return wordsEN.concat(answersEN);
    }
  };

  const answers = (): string[] => {
    switch (gameLanguage) {
      case 'en':
        return answersEN;
      case 'tr':
        return answersTR;
      default:
        return answersEN;
    }
  };

  //passing keys when found and check the condition

  const handleFoundKeysOnKeyboard = (guess: guess) => {
    const tempUsedKeys = { ...usedKeys };
    guess.letters.forEach((letter: string, idx: number) => {
      const keyValue = tempUsedKeys[letter];
      if (!keyValue) {
        // eslint-disable-next-line
        // @ts-ignore
        tempUsedKeys[letter] = guess.matches[idx];
      } else {
        if (keyValue === 'correct') return;
        else if (keyValue && guess.matches[idx] === 'correct') {
          tempUsedKeys[letter] = 'correct';
        } else if (keyValue === 'present' && guess.matches[idx] !== 'correct')
          return;
        // eslint-disable-next-line
        // @ts-ignore
        else tempUsedKeys[letter] = guess.matches[idx];
      }
    });
    dispatch(setUsedKeys(tempUsedKeys));
  };

  const checkGameEnd = () => {
    const attemptsCount = guesses.filter((guess: guess) => {
      return guess.isComplete;
    }).length;
    if (attemptsCount === 6) {
      dispatch(setGameEnded(true));
    }
  };

  useEffect(() => {}, [currentGuessIndex]);

  useEffect(() => { 
    const storeData = async () => {
      const stats = {
        wins: 0,
        loses: 0,
        attemptsLastGame: 0,
      }
      try {
        const jsonValue = await AsyncStorage.getItem('stats');
        if (gameEnded) {
          if (gameWon) {
            if (jsonValue == null) {
              stats.wins = 1;
              stats.attemptsLastGame = currentGuessIndex+1;
              await AsyncStorage.setItem('stats', JSON.stringify(stats));
            } else {
              const stats1 = JSON.parse(jsonValue);
              stats.wins =stats1.wins +1;
              stats.attemptsLastGame = currentGuessIndex+1;
              await AsyncStorage.setItem('stats', JSON.stringify(stats));
            }
          } else {
            if (jsonValue == null) {
              stats.loses = 1;
              stats.attemptsLastGame = currentGuessIndex;
              await AsyncStorage.setItem('stats', JSON.stringify(jsonValue));
            } else {
              const stats1 = JSON.parse(jsonValue);
              stats.loses =stats1.loses +1;
              stats.attemptsLastGame = currentGuessIndex;
              await AsyncStorage.setItem('stats', JSON.stringify(stats));
            }
          }
        }
      } catch (error) {
        
      }
    }

    storeData();
  })

  const updateGuess = (keyPressed: string, currentGuess: guess) => {
    const currentGuessLetters = [...currentGuess.letters];
    let nextEmptyIndex = currentGuessLetters.findIndex(
      (letter) => letter === ''
    );
    if (nextEmptyIndex === -1) nextEmptyIndex = 5;
    const lastNonEmptyIndex = nextEmptyIndex - 1;
    if (keyPressed !== '<' && keyPressed !== 'Enter' && nextEmptyIndex < 5) {
      currentGuessLetters[nextEmptyIndex] = keyPressed;
      const updatedGuess = { ...currentGuess, letters: currentGuessLetters };
      const updatedGuesses = guesses.map((guess, idx) => {
        if (idx === currentGuessIndex) return updatedGuess;
        else return guess;
      });
      dispatch(setGuesses([...updatedGuesses]));
    } else if (keyPressed === '<') {
      currentGuessLetters[lastNonEmptyIndex] = '';
      const updatedGuess = { ...currentGuess, letters: currentGuessLetters };
      const updatedGuesses = guesses.map((guess, idx) => {
        if (idx === currentGuessIndex) return updatedGuess;
        else return guess;
      });
      dispatch(setGuesses([...updatedGuesses]));
    }
  };
  //compare guess and update the guess
  const checkGuess = (currentGuess: guess) => {
    const currentGuessedWord = currentGuess.letters.join('');
    if (currentGuessedWord.length === 5) {
      if (currentGuessedWord === solution) {
        const matches: matchStatus[] = [
          'correct',
          'correct',
          'correct',
          'correct',
          'correct',
        ];
        const updatedGuess = {
          ...currentGuess,
          matches,
          isComplete: true,
          isCorrect: true,
        };
        const updatedGuesses = guesses.map((guess, idx) => {
          if (idx === currentGuessIndex) return updatedGuess;
          else return guess;
        });
        dispatch(setGuesses(updatedGuesses));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
          lottieRef.current?.play();
          dispatch(setGameWon(true));
          dispatch(setGameEnded(true));
          handleFoundKeysOnKeyboard(updatedGuess);
        }, 250 * 6);
      } else if (wordList().includes(currentGuessedWord)) {
        console.log(currentGuessIndex)
        if (currentGuessedWord !== solution && currentGuessIndex === 5) {
          console.log('game here')
          dispatch(setGameWon(false));
          dispatch(setGameEnded(true));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        const matches: matchStatus[] = [];
        currentGuessedWord.split('').forEach((letter, index) => {
          const leftSlice = currentGuessedWord.slice(0, index + 1);
          const countInLeft = leftSlice
            .split('')
            .filter((item) => item === letter).length;
          const totalCount = solution
            .split('')
            .filter((item) => item === letter).length;
          const nonMatchingPairs = solution
            .split('')
            .filter((item, idx) => currentGuessedWord[idx] !== item);

          if (letter === solution[index]) {
            matches.push('correct');
          } else if (solution.includes(letter)) {
            if (
              countInLeft <= totalCount &&
              nonMatchingPairs.includes(letter)
            ) {
              matches.push('present');
            } else {
              matches.push('absent');
            }
          } else {
            matches.push('absent');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        });

        const updatedGuess = {
          ...currentGuess,
          matches,
          isComplete: true,
          isCorrect: false,
        };

        const updatedGuesses = guesses.map((guess, idx) => {
          if (idx === currentGuessIndex) return updatedGuess;
          else return guess;
        });

        dispatch(setGuesses(updatedGuesses));
        dispatch(setCurrentGuessIndex(currentGuessIndex + 1));
        handleFoundKeysOnKeyboard(updatedGuess);
      } else {
        dispatch(setWrongGuessShake(true));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => {
          dispatch(setWrongGuessShake(false));
        }, 1000);
      }
    }
  };

  const handleGuess = (keyPressed: string) => {
    if (!gameEnded) {
      const currentGuess = guesses[currentGuessIndex];
      if (currentGuess) {
        if (keyPressed !== 'Enter' && !currentGuess.isComplete) {
          updateGuess(keyPressed, currentGuess);
        } else if (keyPressed === 'Enter' && !gameWon) {
          checkGuess(currentGuess);
        }
      }
    }
  };
  //changing the state of game to reset
  const resetGameState = () => {
    dispatch(setGuesses([...initialGuesses]));
  };

  const clue = () => {
    console.log(solution);

    axios.get(solution).then((res) => {
      setWordType(res.data[0].meanings[0].partOfSpeech);
      setModalVisible(true);
    });
  };

  const desperateClue = () => {
    axios.get(solution).then((res) => {
      setWordDesperate(res.data[0].meanings[0].definitions[0].definition);
      setModalVisible(true);
    });
  };

  const resetGame = () => {
    lottieRef.current?.reset();
    dispatch(setGameStarted(true));
    resetGameState();
    dispatch(setCurrentGuessIndex(0));
    dispatch(setUsedKeys([]));
    dispatch(setGameWon(false));
    dispatch(setGameEnded(false));
    dispatch(
      setSolution(answers()[Math.floor(Math.random() * answers().length)])
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  if (!gameStarted)
    return (
      <View style={styles.newGameScreen}>
        <TouchableOpacity onPress={resetGame}>
          <Text style={{ color: 'white', fontSize: 20 }}>Start a new game</Text>
        </TouchableOpacity>
      </View>
    );
  return (
    <View
      style={{
        position: 'relative',
        alignContent: 'center',
        flex: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}
      >
        <TouchableOpacity
          activeOpacity={0.5}
          style={styles.clueButton}
          onPress={clue}
        >
          <Text style={styles.buttonText}>Clue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.5}
          style={styles.clueButton}
          onPress={desperateClue}
          disabled={currentGuessIndex != 5}
        >
          <Text style={styles.buttonText}>desperate clue</Text>
        </TouchableOpacity>
      </View>
      <GameBoard
        solution={solution}
        handleGuess={handleGuess}
        resetGame={resetGame}
      />
      <AnimatedLottieView
        ref={lottieRef}
        style={styles.lottieContainer}
        source={require('../../lottie/confetti.json')}
      />
      <Modal
        animationType='slide'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modal}>
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false);
              setWordType('');
              setWordDesperate('');
            }}
          >
            <Text>Close</Text>
          </TouchableOpacity>

          {wordType !== '' && (
            <Text>The type of the solution is: {wordType}</Text>
          )}
          {wordDesperate !== '' && (
            <Text>desperate clue: {wordDesperate}</Text>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  lottieContainer: {
    width: SIZE,
    height: HEIGHT * 0.5,
    backgroundColor: 'transparent',
    position: 'absolute',
    zIndex: 10,
    top: 20,
  },
  newGameScreen: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueButton: {
    width: '30%',
    height: 25,
    backgroundColor: 'gray',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -35,
    marginTop: 35,
    zIndex: 12,
    borderRadius: 15,
  },
  buttonText: {
    color: 'white',
  },
  modal: {
    width: '50%',
    height: '25%',
    backgroundColor: 'white',
    alignSelf: 'center',
  },
});
