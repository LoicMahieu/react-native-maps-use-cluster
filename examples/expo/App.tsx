import React, { useState, useRef } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useCluster, IUseClusterItem } from "react-native-maps-use-cluster";

const { width, height } = Dimensions.get("window");

const ASPECT_RATIO = width / height;
const LATITUDE = 37.733858;
const LONGITUDE = -122.446549;
const MARKERS_LATITUDE_DELTA = 0.03;
const MARKERS_LONGITUDE_DELTA = MARKERS_LATITUDE_DELTA * ASPECT_RATIO;
const MAP_LATITUDE_DELTA = 0.3;
const MAP_LONGITUDE_DELTA = MAP_LATITUDE_DELTA * ASPECT_RATIO;
const NUM_MARKERS = 100;

interface IMarker {
  latitude: number;
  longitude: number;
  id: number;
}

const markerInfo: Array<IMarker> = [];
for (let i = 1; i < NUM_MARKERS; i++) {
  markerInfo.push({
    latitude: (Math.random() * 2 - 1) * MARKERS_LATITUDE_DELTA + LATITUDE,
    longitude: (Math.random() * 2 - 1) * MARKERS_LONGITUDE_DELTA + LONGITUDE,
    id: i
  });
}

const App = () => {
  const mapViewRef = useRef<MapView>();
  const [region, setRegion] = useState<Region | undefined>();
  const { clusters, getCoordinates } = useCluster<
    { marker: IMarker } & IUseClusterItem
  >({
    items: markerInfo.map(marker => ({
      coordinate: marker,
      marker
    })),
    region,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height
  });

  return (
    <View style={styles.container}>
      <MapView
        provider={"google"}
        ref={ref => (mapViewRef.current = ref || undefined)}
        style={styles.map}
        initialRegion={{
          latitude: LATITUDE,
          longitude: LONGITUDE,
          latitudeDelta: MAP_LATITUDE_DELTA,
          longitudeDelta: MAP_LONGITUDE_DELTA
        }}
        onRegionChangeComplete={setRegion}
      >
        {clusters.map(cluster => {
          if (!cluster.properties) {
            return null;
          }

          if (cluster.properties.point_count === 0) {
            const { marker } = cluster.properties.item;
            return <Marker coordinate={marker} key={marker.id} />;
          } else {
            return (
              <Marker
                key={cluster.properties.cluster_id}
                coordinate={{
                  latitude: cluster.geometry.coordinates[1],
                  longitude: cluster.geometry.coordinates[0]
                }}
                onPress={() => {
                  if (mapViewRef.current) {
                    const coordinates = getCoordinates(
                      cluster.properties.cluster_id
                    );
                    if (coordinates && coordinates.length) {
                      mapViewRef.current.fitToCoordinates(coordinates, {
                        edgePadding: {
                          top: 10,
                          bottom: 10,
                          right: 10,
                          left: 10
                        },
                        animated: true
                      });
                    }
                  }
                }}
                style={{ zIndex: 99 }}
              >
                <View
                  style={{
                    backgroundColor: "red",
                    height: 20,
                    width: 20,
                    borderRadius: 20,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "white" }}>
                    {cluster.properties.point_count}
                  </Text>
                </View>
              </Marker>
            );
          }
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  map: {
    ...StyleSheet.absoluteFillObject
  }
});

export default App;
