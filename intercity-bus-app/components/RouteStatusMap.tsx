import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function RouteStatusMap({ buses, theme, colorScheme }: any) {
    return (
        <MapView
            style={styles.map}
            initialRegion={{
                latitude: 7.8731, // Center of Sri Lanka
                longitude: 80.7718,
                latitudeDelta: 4.5,
                longitudeDelta: 4.5,
            }}
            customMapStyle={
                colorScheme === 'dark' || true
                    ? [
                        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
                        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
                        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
                        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
                        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
                        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
                    ]
                    : []
            }
        >
            {buses.map((bus: any) => (
                <Marker
                    key={bus.id}
                    coordinate={{ latitude: bus.lat, longitude: bus.lng }}
                    title={bus.title}
                    description={`Active Route: ${bus.route}`}
                    pinColor={theme.tint}
                />
            ))}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});
