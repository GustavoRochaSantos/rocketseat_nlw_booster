import React, { useState, useEffect } from 'react'
import { Feather as Icon} from '@expo/vector-icons'
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Alert} from 'react-native'
import { useNavigation, useRoute} from '@react-navigation/native'
import Emoji from 'react-native-emoji';
import MapView, { Marker } from 'react-native-maps'
import {SvgUri} from 'react-native-svg'
import api from '../../services/api'
import * as Location from 'expo-location'

interface Params { 
  selectedUF:string,
  selectedCity: string
}
interface Item {
  id: number,
  title:string, 
  image_url:string
}

interface Point {
  id: number, 
  name: string, 
  latitude:number,
  longitude:number,
  image:string
}

const Points = ()=>{
  const route = useRoute()
  const routeParams = route.params as Params;

  const navigator = useNavigation()
  const [items, setItems] = useState<Item[]>([])
  const [points, setPoints] = useState<Point[]>([])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0])

  function apiGetPoints(){
    api.get('points', {
      params:{
        city: routeParams.selectedCity,
        uf:routeParams.selectedUF,
        items: selectedItems
      }
    }).then(response=>{
      setPoints(response.data)
    })
  }

  useEffect(()=>{ 
    api.get('items').then(response=>{
      console.log(response)
      setItems(response.data)
      console.log(items)
    })

  }, [])

  useEffect(()=>{
    apiGetPoints()
  }, [])

  useEffect(()=>{
    apiGetPoints()
  }, [selectedItems])
  
  useEffect(()=>{
    async function loadPosition(){
      const { status } = await Location.requestPermissionsAsync();

      if(status !== 'granted'){
        Alert.alert('Que tristeza...', 'Precisamos da sua localização para melhorar experiência de uso.')
        return
      }
      
      const location = await Location.getCurrentPositionAsync()
      const { latitude, longitude } = location.coords

      setInitialPosition([latitude, longitude])

    }

    loadPosition()
  }, [])

  function handlePreviousScreen(){
    navigator.goBack()
  }

  function handleMarkerPress(id:number){
    navigator.navigate('Detail', {id})
  }

  function handleItemClick(id: number){
    const alreadySelected = selectedItems.findIndex(item => item === id)

    if(alreadySelected >=0){
        const newItems = selectedItems.filter(item => item !== id)
        setSelectedItems(newItems)
    } else
        setSelectedItems([...selectedItems, id])
  }

  return (
    <>
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePreviousScreen}>
        <Icon name="arrow-left" size={20} color="#34cb79"/>
      </TouchableOpacity>
      
      <View style={{flexDirection: 'row',}}>
        <Emoji name="smiley" style={{fontSize: 18, marginRight:10, marginTop:24,}} />  
        <Text style={styles.title}>Bem vindo</Text>
      </View>

      <Text style={styles.description}>Encontre no mapa um ponto de coleta.</Text>
 
      <View style={styles.mapContainer}>
        { initialPosition[0] !== 0 && (
          <MapView 
          style={styles.map} 
          loadingEnabled={initialPosition[0]===0}
          initialRegion={{
            latitude: initialPosition[0],
            longitude: initialPosition[1],
            latitudeDelta: 0.014,
            longitudeDelta:0.014}}
        >
          {points.map(point=>( 
          <Marker key={point.id} coordinate={{
              latitude:point.latitude,
              longitude:point.longitude,
            }}
            onPress={()=>handleMarkerPress(point.id)}
          >
            <View style={styles.mapMarkerContainer}>
              <Image source={{uri:point.image ? point.image : 'https://lh5.googleusercontent.com/p/AF1QipN621c7d5G-m2XV56tr5MZilsuJdRkecr_noiuA=w408-h462-k-no'}} style={styles.mapMarkerImage}/>
              <Text style={styles.mapMarkerTitle}>{point.name}</Text>
            </View>

          </Marker>

          ))}

        </MapView>
        
        ) }
      </View>

    </View>
    <View style={styles.itemsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 20}}
        >
        {items.map(item=>(
          <TouchableOpacity 
            key={item.id} 
            style={[styles.item, selectedItems.includes(item.id) ? styles.selectedItem: {}]} 
            onPress={()=>{handleItemClick(item.id)}} 
            activeOpacity={0.5}
            
          >
            <SvgUri height={42} width={42} uri={item.image_url}/>
            <Text style={styles.itemTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </View>
    </>
  )
}

export default Points

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20 ,
  },

  title: {
    fontSize: 20,
    fontFamily: 'Ubuntu_700Bold',
    marginTop: 24,
  },

  description: {
    color: '#6C6C80',
    fontSize: 16,
    marginTop: 4,
    fontFamily: 'Roboto_400Regular',
  },

  mapContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 16,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  mapMarker: {
    width: 90,
    height: 80, 
  },

  mapMarkerContainer: {
    width: 90,
    height: 70,
    backgroundColor: '#34CB79',
    flexDirection: 'column',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center'
  },

  mapMarkerImage: {
    width: 90,
    height: 45,
    resizeMode: 'cover',
  },

  mapMarkerTitle: {
    flex: 1,
    fontFamily: 'Roboto_400Regular',
    color: '#FFF',
    fontSize: 13,
    lineHeight: 23,
  },

  itemsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 32,
  },

  item: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#eee',
    height: 120,
    width: 120,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'space-between',

    textAlign: 'center',
  },

  selectedItem: {
    borderColor: '#34CB79',
    borderWidth: 2,
  },

  itemTitle: {
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    fontSize: 13,
  },
});