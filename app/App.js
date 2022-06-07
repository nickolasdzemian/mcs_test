/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import SmartConfigP from "react-native-smart-config-p";

const App = () => {
  const [data, setData] = React.useState();
  const [err, setErr] = React.useState(false);
  const [wifi, setWifi] = React.useState({ name: "", pass: "", count: 1 });
  const [conn, setConn] = React.useState(false);
  const url = "http://123.123.12.12:8080/350";
  let getData = () => {};

  async function fetchData() {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const json = await response.json();
      json == data ? null : setData(json);
      clearInterval(getData);
    } catch (error) {
      clearInterval(getData);
      setErr(true);
      alert(error);
    }
  }

  getData = err
    ? null
    : setInterval(() => {
        fetchData();
      }, 2500);

  React.useEffect(() => {
    getData;
  });

  const connect = () => {
    console.log(wifi);
    setConn(true);
    SmartConfigP.start({
      ssid: String(wifi.name),
      password: String(wifi.pass),
      // bssid: "MAC", // Mac address of Mobile
      count: 1, //Number Esp //wifi.count
      cast: "multicast", // boardcast or multicast
    })
      .then(SmartConfigP.stop())
      .then((data) => {
        setConn(false);
        const result = String(data[0].bssid);
        Alert.alert("Подключено устройство:", `1) mac-адрес ${result}`, [
          {
            text: "Возрадуемся!",
          },
        ]);
        /*[
        {
        'bssid': 'device-bssi1', //device bssid
        'ipv4': '192.168.1.11' //local ip address
        },
        {
        'bssid': 'device-bssi2', //device bssid
        'ipv4': '192.168.1.12' //local ip address
        },
        ...
      ]*/
      })
      .catch((err) => {
        setConn(false);
        alert(err);
      });
    SmartConfigP.stop();
  };

  return (
    <SafeAreaView style={styles.container}>
      {conn ? (
        <ActivityIndicator size="small" />
      ) : (
        <TouchableOpacity
          onPress={() => {
            wifi.name == "" || wifi.pass == ""
              ? alert("Поля не должны быть пустые")
              : connect();
          }}
        >
          <Text>Подключить</Text>
        </TouchableOpacity>
      )}
      <View>
        <TextInput
          style={styles.input}
          onChangeText={(txt) => setWifi({ ...wifi, name: txt })}
          placeholder="Имя сети"
          value={wifi.name}
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          onChangeText={(txt) => setWifi({ ...wifi, pass: txt })}
          placeholder="Пароль"
          value={wifi.pass}
        />
        <TextInput
          style={styles.input}
          onChangeText={(txt) => setWifi({ ...wifi, count: txt })}
          placeholder="Количество устройств (1)"
          value={wifi.count}
        />
      </View>
      {data ? (
        <ScrollView style={styles.scrollViewStyle}>
          <Text>Время последнего обновления:{`\n`}{String(data.timestamp)}</Text>
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
          {data.chart.map((item, idx) => (
            <Text key={idx}>
              {item.time / 60}: {item.temp}C
            </Text>
          ))}
        </ScrollView>
      ) : (
        <Text>Нет данных для отображения... Попа жопа...</Text>
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
    paddingVertical: 10,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

export default App;
