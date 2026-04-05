import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function MapComponent({ busLocation, routeCoordinates, theme, style }: any) {
    return (
        <MapView
            style={style}
            initialRegion={{
                latitude: busLocation.latitude,
                longitude: busLocation.longitude,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
            }}
        >
            <Marker coordinate={busLocation} title="Bus Location" description="Intercity Bus" />
            <Polyline coordinates={routeCoordinates} strokeColor={theme.tint} strokeWidth={4} />
        </MapView>
    );
}
