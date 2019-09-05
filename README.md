# react-native-maps-use-cluster

[![npm version](https://badge.fury.io/js/react-native-maps-use-cluster.svg)](https://badge.fury.io/js/react-native-maps-use-cluster)

A simple hook for clustering markers for `react-native-maps`.

Completely inspired by [react-native-maps-super-cluster](https://github.com/novalabio/react-native-maps-super-cluster), most of credit goes back to their maintainers and contributors.

<p align="center">
<img src="https://github.com/LoicMahieu/react-native-maps-use-cluster/blob/master/doc/example.gif?raw=true" height="550" />
</p>

## Installation

```bash
yarn add react-native-maps-use-cluster
```

## Usage

Here is the quick how-to example:

```tsx
import React, { useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useCluster } from "react-native-maps-use-cluster";

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

  const onClusterPress = cluster => {
    if (mapViewRef.current) {
      const coordinates = getCoordinates(cluster.properties.cluster_id);
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
  };

  const markers = clusters.map(cluster => {
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
            onClusterPress(cluster);
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
  });

  return (
    <MapView
      provider={"google"}
      ref={ref => (mapViewRef.current = ref || undefined)}
      style={styles.map}
      onRegionChangeComplete={setRegion}
    >
      {markers}
    </MapView>
  );
};
```

For complete demo, see `examples/expo`.
