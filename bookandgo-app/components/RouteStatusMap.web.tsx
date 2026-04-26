import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function RouteStatusMap({ buses, theme, colorScheme }: any) {
    const [LeafletMap, setLeafletMap] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            Promise.all([
                import('react-leaflet'),
                import('leaflet')
            ]).then(([ReactLeaflet, LModule]) => {
                const L = LModule.default || LModule;
                
                require('leaflet/dist/leaflet.css');

                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                });

                setLeafletMap({
                    MapContainer: ReactLeaflet.MapContainer,
                    TileLayer: ReactLeaflet.TileLayer,
                    Marker: ReactLeaflet.Marker,
                    Popup: ReactLeaflet.Popup,
                    Tooltip: ReactLeaflet.Tooltip
                });
            }).catch(e => console.error("Could not load leaflet", e));
        }
    }, []);

    const defaultCenter: [number, number] = [7.8731, 80.7718]; // Sri Lanka center

    if (!LeafletMap) {
        return (
            <View style={[styles.map, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{color: '#666'}}>Loading Map...</Text>
            </View>
        );
    }

    const { MapContainer, TileLayer, Marker, Popup, Tooltip } = LeafletMap;

    return (
        <View style={styles.map}>
            <MapContainer 
                center={defaultCenter} 
                zoom={8} 
                style={{ height: '100%', width: '100%', position: 'absolute', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {buses?.map((bus: any) => (
                    <Marker 
                        key={bus.id} 
                        position={[bus.lat, bus.lng]}
                    >
                        <Tooltip permanent direction="top" offset={[0, -20]}>
                           <span style={{ fontWeight: 'bold', color: '#333' }}>{bus.route.split(' - ')[0]}</span>
                        </Tooltip>
                        <Popup>
                            <b>{bus.title}</b><br/>
                            Active Route: {bus.route}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </View>

    );
}

const styles = StyleSheet.create({
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});
