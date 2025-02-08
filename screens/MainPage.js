import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { auth } from '../config/firebaseConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function MainPage({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Icon name="person" size={26} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Ana Sayfa</Text>
        <Text style={styles.welcomeText}>
          Hoş geldiniz, {auth.currentUser?.email}!
        </Text>
        
        <TouchableOpacity 
          style={styles.bookCaseButton}
          onPress={() => navigation.navigate('BookCase')}
        >
          <Text style={styles.buttonText}>Kitaplığım</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileButton: {
    padding: 8,
  },
  iconContainer: {
    backgroundColor: '#4CAF50',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 30,
  },
  bookCaseButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});