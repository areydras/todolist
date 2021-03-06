import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import PushNotifications from 'react-native-push-notification'
import BackgroundFetch from 'react-native-background-fetch'

import Colors from "../constants/Colors";
import CircleTop from "../components/CircleTop";
import CircleBottom from "../components/CircleBottom";
import Card from "../components/Card";
import ModalComponent from "../components/ModalComponent";
import * as Todolist from "../store/actions/todolist";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [dataFilter, setDataFilter] = useState([]);
  const [index, setIndex] = useState(0);
  const dispatch = useDispatch();
  const todolist = useSelector(state => state.todolist.todolist, []);
  const todolistDate = useSelector(state => state.todolist.todolistDate, []);
  const clearSearch = "";

  PushNotifications.configure({
    onRegister: token => {
      console.log(token)
    },
    onNotification: notification => {
      console.log('notif', notification)
    },
    requestPermissions: true
  })

  useEffect(() => {
    BackgroundFetch.configure({
      minimumFetchInterval: 15,     
      stopOnTerminate: false,
      startOnBoot: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      requiresCharging: false,     
      requiresDeviceIdle: false,   
      requiresBatteryNotLow: false,
      requiresStorageNotLow: false 
    }, async() => {
      if(todolistDate[index]){
        let lessDate = todolistDate[index].date - 44100000;
        if (lessDate < Date.now()) {
          PushNotifications.localNotification({
            title: 'Notification for todo ' + todolistDate[index].title,
            message: 'Your todo, less than 12 hours.',
            playSound: true,
            soundName: 'default',
          });
        }
        await dispatch(Todolist.doneDate(todolistDate[index].id));
      }
      await setIndex(prevState => prevState+1)
      BackgroundFetch.finish();
    }, (error) => {
      console.log(err);
    });
  })

  useEffect(() => {
    fetchTodolist();
  }, [fetchTodolist]);
  
  const fetchTodolist = async () => {
    await dispatch(Todolist.fetchTodolist()).then(() => {
      setLoading(false);
    });
  };

  const handleHideVisible = bool => {
    bool ? setVisible(!bool) : null;
  };

  const handleShowVisible = (bool, title) => {
    if (bool) {
      setTitle(title);
      setVisible(bool);
    }
  };

  const handleCreateTodo = async data => {
    await dispatch(Todolist.addTodo(data));
    if (dataFilter.status) {
      handleFilter(dataFilter);
    }
  };

  const handleDeleteTodo = async id => {
    const newTodo = todolist.filter(todo => todo.id !== id);
    await dispatch(Todolist.deleteTodo(id, newTodo));
  };

  const handleUpdateTodo = async id => {
    let index = todolist.findIndex(todo => todo.id === id);
    await dispatch(Todolist.updateTodo(id, index));
    if(dataFilter.status){
      handleFilter(dataFilter);
    }
  };

  const handleFilter = async data => {
    setDataFilter(data);
    await dispatch(Todolist.filterTodo(data));
  };

  const handleClearFilter = async () => {
    setDataFilter([]);
    await dispatch(Todolist.clearFilterTodo(search));
  };

  const handleSearch = async search => {
    setSearch(search);
    await dispatch(Todolist.searchTodo(search));
  };

  const handleClearSearch = async () => {
    setSearch("");
    await dispatch(Todolist.clearSearchTodo(clearSearch));
  };

  return (
    <View style={styles.container}>
      <ModalComponent
        title={title}
        visible={visible}
        hideVisible={handleHideVisible}
        onFilter={handleFilter}
        onCreate={handleCreateTodo}
        onSearch={handleSearch}
      />
      <View style={styles.logo}>
        <Text style={styles.title}>Todolist</Text>
        <CircleTop
          position="left"
          icon="information"
          title="Information"
          onPress={handleShowVisible}
        />
        <CircleTop
          position="right"
          icon="search"
          title="Search"
          onPress={handleShowVisible}
        />
      </View>
      {dataFilter.status &&
      (dataFilter.status !== "false" || dataFilter.category !== "false") ? (
        <View
          style={{
            marginHorizontal: width / 25,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Text>
            Filtered :
            {dataFilter.status !== "false"
              ? ` status ${dataFilter.status.toLowerCase()} `
              : null}
            {dataFilter.category !== "false" && dataFilter.status !== "false"
              ? "and"
              : null}
            {dataFilter.category !== "false"
              ? ` category ${dataFilter.category.toLowerCase()}`
              : null}
          </Text>
          <TouchableOpacity onPress={handleClearFilter}>
            <Text style={{ color: Colors.primary }}>clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {search.length ? (
        <View
          style={{
            marginHorizontal: width / 25,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Text>Search for : {search}</Text>
          <TouchableOpacity onPress={handleClearSearch}>
            <Text style={{ color: Colors.primary }}>clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : todolist.length ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ flex: 1, paddingBottom: width / 8 }}>
            {todolist.map(todo => (
              <React.Fragment key={todo.id}>
                <Card
                  id={todo.id}
                  title={todo.title}
                  date={moment(todo.date).format("LL")}
                  category={todo.category.toLowerCase()}
                  status={todo.status}
                  onDeleteTodo={handleDeleteTodo}
                  onUpdateTodo={handleUpdateTodo}
                />
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text>Todolist is empty</Text>
        </View>
      )}
      <CircleBottom
        position="left"
        icon="filter"
        title="Filter"
        onPress={handleShowVisible}
      />
      <CircleBottom
        position="right"
        icon="add"
        title="Add Todo"
        onPress={handleShowVisible}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  logo: {
    height: 65,
    marginBottom: 10,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative"
  },
  title: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.primary
  }
});

export default HomeScreen;
