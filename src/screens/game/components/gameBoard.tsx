import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
// eslint-disable-next-line
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import React, { Component, useEffect, useState } from 'react';

import { useAppSelector } from '../../../hooks/storeHooks';
import { adjustTextDisplay } from '../../../utils/adjustLetterDisplay';
import { colors, HEIGHT, SIZE } from '../../../utils/constants';
import axios from '../../../axios/Axios';

//imported keyboard and letter square components

import Keyboard from './keyboard';
import LetterSquare from './letterSquare';

interface GameBoardProps {
  solution: string;
  handleGuess: (keyPressed: string) => void;
  resetGame: () => void;
}
//function handle the state (guess, gameended ,gamelanguage)
const GameBoard = ({ solution, handleGuess, resetGame }: GameBoardProps) => {
  const { guesses, gameEnded, wrongGuessShake, gameLanguage } = useAppSelector(
    (state) => state.gameState
  );
  const [wordDefinition, setWordDefinition] = useState();

  useEffect(() => {
    axios.get(solution).then((res) => {
      setWordDefinition(res.data[0].meanings[0].definitions[0].definition);
    });
  }, [gameEnded]);

  return (
    <View style={styles.board}>
      <View style={styles.blocksContainer}>
        {guesses.map((guess, idx) => (
          <View key={idx} style={styles.squareBlock}>
            {guess.letters.map((letter, idx) => {
              return (
                <LetterSquare
                  key={idx}
                  idx={idx}
                  letter={letter}
                  guess={guess}
                />
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.gameResult}>
        {gameEnded && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              height: SIZE*0.45,
              marginTop: 125,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                width: '100%'
              }}
            >
              <Text style={styles.solutionText}>
                Solution: {adjustTextDisplay(solution, gameLanguage)}
              </Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => resetGame()}
              >
                <Text style={styles.resetButtonText}>New Game</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.solutionText}>
              definition of the word: {wordDefinition}
            </Text>
          </View>
        )}
        {wrongGuessShake && (
          <Animated.Text
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.wrongGuessText}
          >
            Not in word list
          </Animated.Text>
        )}
      </View>
      {!gameEnded && <Keyboard handleGuess={handleGuess} />}
    </View>
  );
};

export default GameBoard;

const styles = StyleSheet.create({
  board: {
    width: SIZE,
    height: HEIGHT,
    backgroundColor: colors.bg,
    alignItems: 'center',

    marginTop: 50,
  },
  squareBlock: {
    width: SIZE * 0.9,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  blocksContainer: {
    width: SIZE * 0.9,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  gameResult: {
    width: SIZE,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  resetButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#404040',
  },
  resetButtonText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  solutionText: {
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  wrongGuessText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  modal: {
    width: '50%',
    height: '25%',
    backgroundColor: 'white',
    alignSelf: 'center',
  },
});
