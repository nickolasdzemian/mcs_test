/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";

const App = () => {
  const [data, setData] = React.useState();
  const [err, setErr] = React.useState(false);
  const url = "http://somelink/350";
  let getData = () => {};

  async function fetchData() {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const json = await response.json();
      console.log(json);
      json == data ? null : setData(json);
      clearInterval(getData);
    } catch (error) {
      clearInterval(getData);
      setErr(true);
      alert(error);
    }
  }

  getData = err ? null : setInterval(() => {
    fetchData();
  }, 2500);

  React.useEffect(() => {
    getData;
  });

  return (
    <SafeAreaView style={styles.container}>
      {data ? (
        <ScrollView style={styles.scrollViewStyle}>
          <Text>Именование устройства: {String(data.mac)}</Text>
          <Text>Режим работы: {String(data.mode)}</Text>
          <Text>Состояние реле: {String(data.relay)}</Text>
          <Text>Питание: {String(data.status)}</Text>
          <Text>Температура пола: {String(data.tempFloor)}</Text>
          <Text>Температура воздуха: {String(data.tempAir)}</Text>
          <Text>Температура удержания: {String(data.tempUser)}</Text>
          <Text>Самообучение и датчики: {String(data.self)}</Text>
          <Text>Ограничение по воздуху: {String(data.airLimit)}</Text>
          <Text>
            Корректировка датчика воздуха: {String(data.airCorrection)}
          </Text>
          <Text>Тип датчика: {String(data.sensorType)}</Text>
          <Text>Доступность устройства: {String(data.isBusy)}</Text>
          <Text>Сырой график обогрева: </Text>
          {data.chart.map((item) => (
            <Text>
              {item.time / 60}: {item.temp}C
            </Text>
          ))}
        </ScrollView>
      ) : (
        <Text>Попа жопа...</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 100,
  },
  scrollViewStyle: {
    paddingHorizontal: 22,
    paddingVertical: 100,
  },
});

export default App;
