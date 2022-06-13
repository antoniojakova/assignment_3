import React, { Component, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  setGameLanguage,
  setGameStarted,
} from '../../store/slices/gameStateSlice';
import { setStoreData } from '../../utils/localStorageFuncs';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useAppSelector } from '../../hooks/storeHooks';

//Setting Tab

export default function Settings() {
  const { gameEnded } = useAppSelector((state) => state.gameState);
  const dispatch = useDispatch();
  const [gameStats, setGameStats] = useState({});

  //set the defualt state of game start to false

  const resetGame = () => {
    dispatch(setGameStarted(false));
  };

  const getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('stats');
      if (jsonValue != null) {
        setGameStats(JSON.parse(jsonValue));
        console.log(jsonValue);
      }
    } catch (error) {}
  };

  const resetGameStats = async () => {
    try {
      const stats = {
        wins: 0,
        loses: 0,
        attemptsLastGame: 0,
      }
      await AsyncStorage.setItem('stats', JSON.stringify(stats));
      getData();
    } catch (error) {
      
    }
  };

  useEffect(() => {
    getData();
  }, [gameEnded]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'space-evenly',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '50%',
        }}
      >
        <Text style={styles.text}>Games stats</Text>
        <View>
          <Text style={styles.text}>Wins: {gameStats?.wins}</Text>
          <Text style={styles.text}>Loses: {gameStats?.loses}</Text>
          <Text style={styles.text}>
            Attempts on last game: {gameStats?.attemptsLastGame}
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={resetGameStats} style={styles.reset}>
          <Text style={{ color: 'black' }} onPress={resetGameStats}>Reset Game stats</Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          width: '20%',
        }}
      >
        <Button
          title='EN'
          onPress={() => {
            dispatch(setGameLanguage('en'));
            setStoreData('language', 'en');
            resetGame();
          }}
        />
        <Button
          title='TR'
          onPress={() => {
            dispatch(setGameLanguage('tr'));
            setStoreData('language', 'tr');
            resetGame();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    color: 'white',
  },
  reset: {
    backgroundColor: 'white',
    width: 150,
    zIndex: 12,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
});
