import GeoViewport from "@mapbox/geo-viewport";
import { useEffect, useRef, useState } from "react";
import SuperCluster, {
  ClusterFeature,
  ClusterProperties,
  PointFeature
} from "supercluster";

export interface IUseClusterItem {
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export interface IUseClusterRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface IUseClusterProperties<T extends IUseClusterItem>
  extends Omit<ClusterProperties, "cluster"> {
  item: T;
  cluster: boolean;
}

export type IUseClusterCluster<T extends IUseClusterItem> =
  | ClusterFeature<IUseClusterProperties<T>>
  | PointFeature<IUseClusterProperties<T>>
;

export type IUseClusterClusters<T extends IUseClusterItem> = Array<IUseClusterCluster<T>>;

export const useCluster = <T extends IUseClusterItem = IUseClusterItem>({
  region: givenRegion,
  getRegionId = region => [
    region && region.latitude,
    region && region.longitude,
    region && region.latitudeDelta,
    region && region.longitudeDelta
  ],
  items: givenItems,
  getItemsId = items => [items.length],

  extent = 512,
  minZoom = 1,
  maxZoom = 16,
  radius,

  width,
  height
}: {
  region?: IUseClusterRegion;
  getRegionId?: (region?: IUseClusterRegion) => any[];
  items: T[];
  getItemsId?: (items: T[]) => any[];

  extent?: number;
  minZoom?: number;
  maxZoom?: number;
  radius?: number;

  width: number;
  height: number;
}) => {
  const createClusterIndex = (items: T[]) => {
    const index = new SuperCluster<
      IUseClusterProperties<T>,
      IUseClusterProperties<T>
    >({
      extent,
      minZoom,
      maxZoom,
      radius: radius || width * 0.045 // 4.5% of screen width
    });

    const rawData: Array<PointFeature<IUseClusterProperties<T>>> = items.map(
      item => ({
        geometry: {
          coordinates: [item.coordinate.longitude, item.coordinate.latitude],
          type: "Point"
        },
        properties: {
          cluster: false,
          cluster_id: -1,
          point_count: 0,
          point_count_abbreviated: 0,
          item
        },
        type: "Feature"
      })
    );

    index.load(rawData);

    return index;
  };

  const createClusters = (
    index: SuperCluster<IUseClusterProperties<T>>,
    region: IUseClusterRegion
  ): IUseClusterClusters<T> => {
    const bbox = regionToBoundingBox(region);
    const viewport =
      region.longitudeDelta >= 40
        ? { zoom: minZoom }
        : GeoViewport.viewport(bbox, [width, height]);
    return index.getClusters(bbox, viewport.zoom) as IUseClusterClusters<T>;
  };

  const getCoordinates = (
    clusterId: number,
    { maxChildren }: { maxChildren?: number } = {}
  ) => {
    const children = clusterIndexRef.current
      ? clusterIndexRef.current.getLeaves(clusterId, maxChildren)
      : [];
    return children.map(c => c.properties.item.coordinate);
  };

  const clusterIndexRef = useRef<
    SuperCluster<IUseClusterProperties<T>, IUseClusterProperties<T>>
  >();
  const [clusters, setClusters] = useState<IUseClusterClusters<T>>();

  useEffect(() => {
    const newClusterIndex = createClusterIndex(givenItems);
    clusterIndexRef.current = newClusterIndex;
  }, [...getItemsId(givenItems)]);

  useEffect(() => {
    if (clusterIndexRef.current && givenRegion) {
      setClusters(createClusters(clusterIndexRef.current, givenRegion));
    }
  }, [
    clusterIndexRef.current,
    ...getItemsId(givenItems),
    ...getRegionId(givenRegion)
  ]);

  return {
    clusters: clusters || [],
    getCoordinates
  };
};

export const regionToBoundingBox = (
  region: IUseClusterRegion
): [number, number, number, number] => {
  const lngD =
    region.longitudeDelta < 0
      ? region.longitudeDelta + 360
      : region.longitudeDelta;

  return [
    region.longitude - lngD, // westLng - min lng
    region.latitude - region.latitudeDelta, // southLat - min lat
    region.longitude + lngD, // eastLng - max lng
    region.latitude + region.latitudeDelta // northLat - max lat
  ];
};
